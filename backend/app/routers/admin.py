import os
import re
import tempfile
import uuid
import asyncio
from typing import Optional, List
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, BackgroundTasks
from pydantic import BaseModel
from ..rag.ingestion import extract_text_from_pdf, chunk_text
from ..integrations.openai_client import generate_embedding
from ..integrations.supabase_client import get_supabase_client

router = APIRouter(
    prefix="/api/admin",
    tags=["admin"]
)

# ====================
# KNOWLEDGE BASE
# ====================

@router.post("/kb/upload_pdf")
async def upload_pdf(bot_id: str = Form(...), file: UploadFile = File(...)):
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files supported")
        
    supabase = get_supabase_client()
    if not supabase:
        raise HTTPException(status_code=500, detail="Database credentials missing. Cannot upload.")
        
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
        content = await file.read()
        tmp.write(content)
        tmp_path = tmp.name
        
    try:
        extracted_text = extract_text_from_pdf(tmp_path)
        chunks = chunk_text(extracted_text)
        
        records = []
        for chunk in chunks:
            embedding = await generate_embedding(chunk)
            records.append({
                "bot_id": bot_id,
                "content": chunk,
                "embedding": embedding,
                "metadata": {"source": file.filename},
                "source_type": "pdf",
                "page_title": file.filename,
                "source_group": file.filename,
            })
            
        if records:
            supabase.table("knowledge_base").insert(records).execute()
            
        return {"status": "success", "filename": file.filename, "bot": bot_id, "chunks_inserted": len(chunks)}
    finally:
        os.remove(tmp_path)


class IngestTextRequest(BaseModel):
    bot_id: str
    text_content: str
    source_name: str


@router.post("/kb/ingest_text")
async def ingest_manual_text(request: IngestTextRequest):
    supabase = get_supabase_client()
    if not supabase:
        raise HTTPException(status_code=500, detail="Database credentials missing.")
        
    try:
        chunks = chunk_text(request.text_content)
        records = []
        for chunk in chunks:
            embedding = await generate_embedding(chunk)
            records.append({
                "bot_id": request.bot_id,
                "content": chunk,
                "embedding": embedding,
                "metadata": {"source": request.source_name},
                "source_type": "manual",
                "page_title": request.source_name,
                "source_group": request.source_name,
            })
            
        if records:
            supabase.table("knowledge_base").insert(records).execute()
            
        return {"status": "success", "source": request.source_name, "chunks_inserted": len(chunks)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class IngestUrlRequest(BaseModel):
    bot_id: str
    url: str


@router.post("/kb/ingest_url")
async def ingest_url(request: IngestUrlRequest):
    import httpx
    from bs4 import BeautifulSoup
    
    supabase = get_supabase_client()
    if not supabase:
        raise HTTPException(status_code=500, detail="Database credentials missing.")
    
    try:
        async with httpx.AsyncClient(timeout=20, follow_redirects=True) as client:
            resp = await client.get(request.url, headers={"User-Agent": "Mozilla/5.0"})
            resp.raise_for_status()
        
        soup = BeautifulSoup(resp.text, "html.parser")
        page_title = soup.title.get_text(strip=True) if soup.title else request.url
        
        # Extract images before decomposing tags
        from urllib.parse import urljoin
        image_mds = []
        for img in soup.find_all("img", src=True):
            src = img["src"]
            alt = img.get("alt", "Image").strip()
            abs_url = urljoin(request.url, src)
            image_mds.append(f"![{alt}]({abs_url})")

        for tag in soup(["script", "style", "nav", "footer", "header", "aside"]):
            tag.decompose()
        
        text = " ".join(soup.get_text(separator=" ").split())
        
        # Append images to text so they are included in chunks
        if image_mds:
            text += "\n\n### Images found on this page:\n" + "\n".join(image_mds)
        
        if not text or len(text) < 100:
            raise HTTPException(status_code=422, detail="Could not extract usable text from that URL.")
        
        chunks = chunk_text(text)
        records = []
        for chunk in chunks:
            embedding = await generate_embedding(chunk)
            if embedding:
                records.append({
                    "bot_id": request.bot_id,
                    "content": chunk,
                    "embedding": embedding,
                    "metadata": {"source": request.url},
                    "source_type": "url",
                    "page_title": page_title,
                    "source_group": request.url,
                })
        
        if records:
            supabase.table("knowledge_base").insert(records).execute()
        
        return {"status": "success", "url": request.url, "page_title": page_title, "chunks_inserted": len(records)}
    except httpx.HTTPError as e:
        raise HTTPException(status_code=400, detail=f"Failed to fetch URL: {str(e)}")


# ====================
# WEBSITE DEEP CRAWLER
# ====================

class CrawlRequest(BaseModel):
    bot_id: str
    url: str


def _extract_internal_links(base_url: str, html: str) -> list[str]:
    """Extract unique internal links from HTML."""
    from bs4 import BeautifulSoup
    from urllib.parse import urljoin, urlparse
    
    soup = BeautifulSoup(html, "html.parser")
    base_parsed = urlparse(base_url)
    base_domain = f"{base_parsed.scheme}://{base_parsed.netloc}"
    
    links = set()
    for a_tag in soup.find_all("a", href=True):
        href = a_tag["href"].strip()
        if not href or href.startswith("#") or href.startswith("mailto:") or href.startswith("tel:"):
            continue
        full_url = urljoin(base_url, href)
        parsed = urlparse(full_url)
        # Must be same domain, no fragments, no query-heavy URLs
        if parsed.netloc == base_parsed.netloc:
            clean = f"{parsed.scheme}://{parsed.netloc}{parsed.path}".rstrip("/")
            if clean and clean != base_url.rstrip("/"):
                links.add(clean)
    return list(links)


def _extract_sitemap_urls(sitemap_xml: str, base_domain: str) -> list[str]:
    """Extract URLs from sitemap XML."""
    from urllib.parse import urlparse
    urls = re.findall(r'<loc>(.*?)</loc>', sitemap_xml)
    base_parsed = urlparse(base_domain)
    result = []
    for u in urls:
        parsed = urlparse(u)
        if parsed.netloc == base_parsed.netloc:
            result.append(u)
    return result


async def _crawl_and_ingest(job_id: str, bot_id: str, start_url: str):
    """Background task: crawl a website and ingest all pages."""
    import httpx
    from bs4 import BeautifulSoup
    from urllib.parse import urlparse
    
    supabase = get_supabase_client()
    if not supabase:
        return
    
    headers = {"User-Agent": "Mozilla/5.0 (compatible; PersonaAI-Crawler/1.0)"}
    visited = set()
    to_visit = [start_url.rstrip("/")]
    base_parsed = urlparse(start_url)
    base_domain = f"{base_parsed.scheme}://{base_parsed.netloc}"
    total_chunks = 0
    
    def _update_job(**kwargs):
        try:
            supabase.table("crawl_jobs").update({**kwargs, "updated_at": "now()"}).eq("id", job_id).execute()
        except Exception:
            pass
    
    _update_job(status="running")
    
    # Try to fetch sitemap first
    try:
        async with httpx.AsyncClient(timeout=10, follow_redirects=True) as client:
            sitemap_resp = await client.get(f"{base_domain}/sitemap.xml", headers=headers)
            if sitemap_resp.status_code == 200:
                sitemap_urls = _extract_sitemap_urls(sitemap_resp.text, base_domain)
                for u in sitemap_urls:
                    if u not in visited:
                        to_visit.append(u)
                print(f"Sitemap: found {len(sitemap_urls)} URLs")
    except Exception as e:
        print(f"Sitemap fetch failed (non-fatal): {e}")
    
    _update_job(pages_found=len(to_visit))
    
    # Cap at 30 pages to avoid runaway
    max_pages = 30
    pages_done = 0
    
    async with httpx.AsyncClient(timeout=15, follow_redirects=True) as client:
        while to_visit and pages_done < max_pages:
            url = to_visit.pop(0)
            if url in visited:
                continue
            visited.add(url)
            
            try:
                resp = await client.get(url, headers=headers)
                if resp.status_code != 200:
                    continue
                if "text/html" not in resp.headers.get("content-type", ""):
                    continue
                
                soup = BeautifulSoup(resp.text, "html.parser")
                page_title = soup.title.get_text(strip=True) if soup.title else url
                
                # Extract images before cleanup
                from urllib.parse import urljoin
                image_mds = []
                for img in soup.find_all("img", src=True):
                    src = img["src"]
                    alt = img.get("alt", "Image").strip()
                    abs_url = urljoin(url, src)
                    image_mds.append(f"![{alt}]({abs_url})")

                # Discover more links
                new_links = _extract_internal_links(url, resp.text)
                for link in new_links:
                    if link not in visited and link not in to_visit:
                        to_visit.append(link)
                
                # Extract text
                for tag in soup(["script", "style", "nav", "footer", "header", "aside"]):
                    tag.decompose()
                text = " ".join(soup.get_text(separator=" ").split())
                
                if image_mds:
                    text += "\n\n### Images on this page:\n" + "\n".join(image_mds)
                
                if not text or len(text) < 80:
                    continue
                
                # Chunk & embed
                chunks = chunk_text(text)
                records = []
                for chunk in chunks:
                    embedding = await generate_embedding(chunk)
                    if embedding:
                        records.append({
                            "bot_id": bot_id,
                            "content": chunk,
                            "embedding": embedding,
                            "metadata": {"source": url, "page_title": page_title},
                            "source_type": "website",
                            "page_title": page_title,
                            "source_group": start_url.rstrip("/"),
                        })
                
                if records:
                    supabase.table("knowledge_base").insert(records).execute()
                    total_chunks += len(records)
                
                pages_done += 1
                _update_job(pages_done=pages_done, chunks_inserted=total_chunks, pages_found=len(visited) + len(to_visit))
                
                # Small delay to be polite
                await asyncio.sleep(0.5)
                
            except Exception as e:
                print(f"Failed to crawl {url}: {e}")
                continue
    
    _update_job(status="done", pages_done=pages_done, chunks_inserted=total_chunks)


@router.post("/kb/crawl_website")
async def crawl_website(request: CrawlRequest, background_tasks: BackgroundTasks):
    """Start a full website crawl in background. Returns job_id to poll status."""
    supabase = get_supabase_client()
    if not supabase:
        raise HTTPException(status_code=500, detail="Database credentials missing.")
    
    # Create a crawl job record
    job_id = str(uuid.uuid4())
    try:
        supabase.table("crawl_jobs").insert({
            "id": job_id,
            "bot_id": request.bot_id,
            "url": request.url,
            "status": "pending",
        }).execute()
    except Exception as e:
        # Table might not exist yet, proceed without job tracking
        print(f"crawl_jobs table not found (create it): {e}")
    
    background_tasks.add_task(_crawl_and_ingest, job_id, request.bot_id, request.url)
    
    return {"status": "started", "job_id": job_id, "message": f"Crawling {request.url} in background..."}


@router.get("/kb/crawl_status/{job_id}")
async def get_crawl_status(job_id: str):
    """Get the status of a crawl job."""
    supabase = get_supabase_client()
    if not supabase:
        raise HTTPException(status_code=500, detail="Database credentials missing.")
    try:
        resp = supabase.table("crawl_jobs").select("*").eq("id", job_id).execute()
        if resp.data:
            return resp.data[0]
        return {"status": "not_found"}
    except Exception:
        return {"status": "unknown"}


@router.get("/kb/source/chunks")
async def get_kb_source_chunks(source_group: str):
    """Retrieve all chunks for a specific source for viewing."""
    supabase = get_supabase_client()
    if not supabase:
        raise HTTPException(status_code=500, detail="Database credentials missing.")
    from urllib.parse import unquote
    decoded = unquote(source_group)
    try:
        response = supabase.table("knowledge_base").select(
            "id, content, page_title, source_type"
        ).eq("source_group", decoded).execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/kb/source")
async def delete_kb_source(source_group: str):
    """Delete ALL chunks from a given source (e.g. one PDF or one website URL)."""
    supabase = get_supabase_client()
    if not supabase:
        raise HTTPException(status_code=500, detail="Database credentials missing.")
    from urllib.parse import unquote
    decoded = unquote(source_group)
    result = supabase.table("knowledge_base").delete().eq("source_group", decoded).execute()
    return {"status": "deleted", "source_group": decoded, "deleted_count": len(result.data) if result.data else 0}


@router.delete("/kb/item/{item_id}")
async def delete_kb_item(item_id: str):
    supabase = get_supabase_client()
    if not supabase:
        raise HTTPException(status_code=500, detail="Database credentials missing.")
    supabase.table("knowledge_base").delete().eq("id", item_id).execute()
    return {"status": "deleted"}


@router.get("/leads")
async def get_leads():
    supabase = get_supabase_client()
    if not supabase:
        raise HTTPException(status_code=500, detail="Database credentials missing. Cannot fetch leads.")
    response = supabase.table("leads").select("*").order("created_at", desc=True).limit(50).execute()
    return response.data


@router.get("/logs")
async def get_logs():
    supabase = get_supabase_client()
    if not supabase:
        raise HTTPException(status_code=500, detail="Database credentials missing.")
    try:
        response = supabase.table("chat_logs").select("*").order("created_at", desc=True).limit(200).execute()
        return response.data
    except Exception:
        return []


@router.get("/kb")
async def get_kb():
    supabase = get_supabase_client()
    if not supabase:
        raise HTTPException(status_code=500, detail="Database credentials missing.")
    response = supabase.table("knowledge_base").select(
        "id, bot_id, content, metadata, source_type, page_title, source_group, created_at"
    ).order("created_at", desc=True).execute()
    return response.data


@router.get("/kb/stats")
async def get_kb_stats():
    """Returns aggregated stats for Knowledge Growth Tracking"""
    supabase = get_supabase_client()
    if not supabase:
        raise HTTPException(status_code=500, detail="Database credentials missing.")
        
    try:
        response = supabase.table("knowledge_base").select("source_type").execute()
        stats = {
            "total": len(response.data),
            "website": 0,
            "pdf": 0,
            "manual": 0,
            "learning_gap": 0
        }
        for item in response.data:
            stype = item.get("source_type") or "manual"
            if stype in stats:
                stats[stype] += 1
            else:
                stats["manual"] += 1
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/kb/sources")
async def get_kb_sources():
    """Returns KB grouped by source for the KB management view."""
    supabase = get_supabase_client()
    if not supabase:
        raise HTTPException(status_code=500, detail="Database credentials missing.")
    
    response = supabase.table("knowledge_base").select(
        "id, bot_id, source_type, page_title, source_group, created_at"
    ).order("created_at", desc=True).execute()
    
    # Group by source_group
    from collections import defaultdict
    groups: dict = defaultdict(lambda: {"chunks": 0, "bot_id": "", "source_type": "manual",
                                         "page_title": "", "source_group": "", "created_at": "", "ids": []})
    for item in response.data:
        sg = item.get("source_group") or item.get("metadata", {}).get("source", "Unknown")
        groups[sg]["chunks"] += 1
        groups[sg]["bot_id"] = item.get("bot_id", "")
        groups[sg]["source_type"] = item.get("source_type", "manual")
        groups[sg]["page_title"] = item.get("page_title", "") or sg
        groups[sg]["source_group"] = sg
        groups[sg]["created_at"] = item.get("created_at", "")
        groups[sg]["ids"].append(item["id"])
    
    return list(groups.values())


# ====================
# BOT MANAGEMENT
# ====================

@router.get("/bots")
async def get_bots():
    supabase = get_supabase_client()
    if not supabase:
        raise HTTPException(status_code=500, detail="Database credentials missing.")
        
    response = supabase.table("bots").select("*").execute()
    
    bots = []
    for bot in response.data:
        bots.append({
            "id": bot["id"],
            "name": bot["name"],
            "role": bot["role"],
            "persona_prompt": bot["persona_prompt"],
            "theme_color": bot.get("theme_color", ""),
            "status": bot.get("status", "Active"),
            "avatar": bot.get("avatar", ""),
            "page_config": bot.get("page_config") or {},
            "persona_config": bot.get("persona_config") or {},
            "engine": "gpt-4o",
            "docs": 0
        })
    return bots


class PersonaConfig(BaseModel):
    industry: Optional[str] = ""
    language: Optional[str] = "English"
    tone: Optional[str] = "Friendly"
    personality_level: Optional[int] = 5
    conversation_length: Optional[str] = "Medium"
    lead_capture_mode: Optional[bool] = True
    upsell_suggestions: Optional[bool] = False
    ask_contact_after: Optional[int] = 3
    goals: Optional[List[str]] = []
    restricted_topics: Optional[List[str]] = []
    out_of_scope_response: Optional[str] = ""
    compliance_rules: Optional[List[str]] = []


class BotUpdateRequest(BaseModel):
    name: str
    role: str
    persona_prompt: str
    theme_color: str
    avatar: str
    status: str
    page_config: dict = {}
    persona_config: dict = {}


@router.put("/bots/{bot_id}")
async def update_bot(bot_id: str, request: BotUpdateRequest):
    supabase = get_supabase_client()
    if not supabase:
        raise HTTPException(status_code=500, detail="Database credentials missing.")
    
    try:
        supabase.table("bots").update({
            "name": request.name,
            "role": request.role,
            "persona_prompt": request.persona_prompt,
            "theme_color": request.theme_color,
            "avatar": request.avatar,
            "status": request.status,
            "page_config": request.page_config,
            "persona_config": request.persona_config,
        }).eq("id", bot_id).execute()
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/bots/{bot_id}")
async def patch_bot(bot_id: str, payload: dict):
    """Partially update a bot's fields."""
    supabase = get_supabase_client()
    if not supabase:
        raise HTTPException(status_code=500, detail="Database credentials missing.")
    try:
        supabase.table("bots").update(payload).eq("id", bot_id).execute()
        return {"status": "updated"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class BotCreateRequest(BaseModel):
    id: str
    name: str
    role: str
    persona_prompt: str
    theme_color: str = "bg-gradient-to-r from-purple-500 to-indigo-600"
    avatar: str = ""
    status: str = "Active"
    page_config: dict = {}
    persona_config: dict = {}


class GeneratePersonaRequest(BaseModel):
    bot_name: str
    role: str
    industry: str
    tone: str
    restricted_topics: List[str] = []


@router.post("/bots/generate-persona")
async def generate_persona_auto(request: GeneratePersonaRequest):
    """Auto-train Persona and extract Suggested Knowledge"""
    from ..integrations.openai_client import generate_chat_response
    import json
    
    prompt = f"""You are an expert AI persona architect. 
Given the following details, generate a comprehensive Persona System Prompt and a list of base knowledge facts that this AI should inherently know.
Name: {request.bot_name}
Role: {request.role}
Industry: {request.industry}
Tone: {request.tone}
Restrictions: {', '.join(request.restricted_topics)}

Output strictly valid JSON:
{{
  "persona_prompt": "You are [Name], a [Role] for a [Industry]... (write a rich, 2-3 paragraph system prompt detailing personality, duties, and rules)",
  "suggested_knowledge": [
    "A brief 1-2 sentence fact regarding standard policies or etiquette for this role (e.g. Standard check-in time is 3 PM).",
    "Another fact..."
  ]
}}"""
    
    try:
        raw_reply = await generate_chat_response([
            {"role": "system", "content": "You output only JSON without markdown wrappers."},
            {"role": "user", "content": prompt}
        ])
        reply = raw_reply.choices[0].message.content if hasattr(raw_reply, "choices") else str(raw_reply)
        
        cleaned = reply.strip().strip('`').lstrip('json').strip()
        data = json.loads(cleaned)
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Generation failed: {e}")


@router.post("/bots")
async def create_bot(request: BotCreateRequest):
    supabase = get_supabase_client()
    if not supabase:
        raise HTTPException(status_code=500, detail="Database credentials missing.")
    try:
        supabase.table("bots").insert({
            "id": request.id,
            "name": request.name,
            "role": request.role,
            "persona_prompt": request.persona_prompt,
            "theme_color": request.theme_color,
            "avatar": request.avatar,
            "status": request.status,
            "page_config": request.page_config,
            "persona_config": request.persona_config,
        }).execute()
        return {"status": "created", "id": request.id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/bots/{bot_id}")
async def delete_bot(bot_id: str):
    supabase = get_supabase_client()
    if not supabase:
        raise HTTPException(status_code=500, detail="Database credentials missing.")
    try:
        supabase.table("bots").delete().eq("id", bot_id).execute()
        return {"status": "deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ====================
# CONTACT MESSAGES
# ====================

class ContactSubmission(BaseModel):
    name: str
    email: str
    subject: str
    message: str

@router.post("/contacts")
async def submit_contact(payload: ContactSubmission):
    supabase = get_supabase_client()
    if not supabase:
        raise HTTPException(status_code=500, detail="Database unavailable.")
    try:
        supabase.table("contacts").insert({
            "name": payload.name,
            "email": payload.email,
            "subject": payload.subject,
            "message": payload.message,
            "is_read": False,
        }).execute()
        return {"status": "received"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/contacts")
async def get_contacts():
    supabase = get_supabase_client()
    if not supabase:
        raise HTTPException(status_code=500, detail="Database unavailable.")
    try:
        res = supabase.table("contacts").select("*").order("created_at", desc=True).execute()
        return res.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/contacts/{contact_id}/read")
async def mark_contact_read(contact_id: str):
    supabase = get_supabase_client()
    if not supabase:
        raise HTTPException(status_code=500, detail="Database unavailable.")
    try:
        supabase.table("contacts").update({"is_read": True}).eq("id", contact_id).execute()
        return {"status": "updated"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/contacts/{contact_id}")
async def delete_contact(contact_id: str):
    supabase = get_supabase_client()
    if not supabase:
        raise HTTPException(status_code=500, detail="Database unavailable.")
    try:
        supabase.table("contacts").delete().eq("id", contact_id).execute()
        return {"status": "deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

