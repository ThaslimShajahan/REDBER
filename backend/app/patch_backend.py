import codecs

schemas_path = 'models/schemas.py'
with codecs.open(schemas_path, 'r', 'utf-8') as f:
    s_content = f.read()
    
if 'image_data: Optional[str] = None' not in s_content:
    s_content = s_content.replace(
        'history: Optional[List[ChatMessage]] = []',
        'history: Optional[List[ChatMessage]] = []\n    image_data: Optional[str] = None'
    )
    with codecs.open(schemas_path, 'w', 'utf-8') as f:
        f.write(s_content)


bot_service_path = 'services/bot_service.py'
with codecs.open(bot_service_path, 'r', 'utf-8') as f:
    bs_content = f.read()

old_user_msg = 'messages.append({"role": "user", "content": request.message})'
new_user_msg = '''if hasattr(request, "image_data") and request.image_data:
            messages.append({
                "role": "user", 
                "content": [
                    {"type": "text", "text": request.message or "Analyze this image and answer the user query."},
                    {"type": "image_url", "image_url": {"url": request.image_data}}
                ]
            })
        else:
            messages.append({"role": "user", "content": request.message})'''

if new_user_msg not in bs_content:
    bs_content = bs_content.replace(old_user_msg, new_user_msg)
    
    # Also fix embedding retrieval for empty message
    bs_content = bs_content.replace(
        'query_embedding = await generate_embedding(request.message)',
        'query_embedding = await generate_embedding(request.message or "car vehicle details")'
    )
    
    with codecs.open(bot_service_path, 'w', 'utf-8') as f:
        f.write(bs_content)


admin_path = 'routers/admin.py'
with codecs.open(admin_path, 'r', 'utf-8') as f:
    a_content = f.read()

# ingest_url patch
old_ingest_1 = '''        soup = BeautifulSoup(resp.text, "html.parser")
        page_title = soup.title.get_text(strip=True) if soup.title else request.url
        for tag in soup(["script", "style", "nav", "footer", "header", "aside"]):
            tag.decompose()
        text = " ".join(soup.get_text(separator=" ").split())'''

new_ingest_1 = '''        soup = BeautifulSoup(resp.text, "html.parser")
        page_title = soup.title.get_text(strip=True) if soup.title else request.url
        
        from urllib.parse import urljoin
        image_mds = []
        for img in soup.find_all("img"):
            src = img.get("src")
            alt = img.get("alt", "")
            if src and len(src) > 5 and not src.startswith("data:"):
                image_mds.append(f"![{alt}]({urljoin(request.url, src)})")
                
        for tag in soup(["script", "style", "nav", "footer", "header", "aside"]):
            tag.decompose()
        text = " ".join(soup.get_text(separator=" ").split())
        
        if image_mds:
            text += "\\n\\nImages on this page:\\n" + "\\n".join(image_mds)'''

a_content = a_content.replace(old_ingest_1, new_ingest_1)


# crawl_and_ingest patch
old_ingest_2 = '''                # Extract text
                for tag in soup(["script", "style", "nav", "footer", "header", "aside"]):
                    tag.decompose()
                text = " ".join(soup.get_text(separator=" ").split())'''

new_ingest_2 = '''                # Extract images
                from urllib.parse import urljoin
                image_mds = []
                for img in soup.find_all("img"):
                    src = img.get("src")
                    alt = img.get("alt", "")
                    if src and len(src) > 5 and not src.startswith("data:"):
                        image_mds.append(f"![{alt}]({urljoin(url, src)})")

                # Extract text
                for tag in soup(["script", "style", "nav", "footer", "header", "aside"]):
                    tag.decompose()
                text = " ".join(soup.get_text(separator=" ").split())
                
                if image_mds:
                    text += "\\n\\nImages on this page:\\n" + "\\n".join(image_mds)'''

a_content = a_content.replace(old_ingest_2, new_ingest_2)

with codecs.open(admin_path, 'w', 'utf-8') as f:
    f.write(a_content)

print("Backend patched")
