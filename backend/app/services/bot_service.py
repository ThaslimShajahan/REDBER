import json
import typing
import asyncio
import time
import datetime
import logging
import re as _re
from app.models.schemas import ChatRequest, ChatResponse
from app.integrations.openai_client import generate_chat_response, generate_chat_response_stream, generate_embedding
from app.integrations.supabase_client import get_supabase_client

logger = logging.getLogger(__name__)

# Simple in-memory persona cache — TTL 5 minutes per bot_id
_persona_cache: typing.Dict[str, typing.Tuple[str, dict, float]] = {}
_CACHE_TTL = 300  # seconds

_MAX_BG_RETRIES = 3


class BotService:

    @staticmethod
    async def _prepare_messages(request: ChatRequest) -> typing.Tuple[typing.List[typing.Dict], bool]:
        """
        Fetch persona + config, build RAG context + memory in parallel, then assemble
        the full OpenAI messages list.  Returns (messages, has_image).
        """
        supabase = get_supabase_client()

        # ── Persona cache (5 min TTL) ─────────────────────────────────────────
        persona = "You are a helpful AI assistant."
        persona_config: dict = {}
        cached = _persona_cache.get(request.bot_id)
        if cached and (time.time() - cached[2]) < _CACHE_TTL:
            persona, persona_config = cached[0], cached[1]
        elif supabase:
            loop = asyncio.get_event_loop()
            res = await loop.run_in_executor(
                None,
                lambda: supabase.table("bots")
                    .select("persona_prompt, persona_config")
                    .eq("id", request.bot_id)
                    .execute()
            )
            if res.data:
                persona = res.data[0]["persona_prompt"]
                persona_config = res.data[0].get("persona_config") or {}
            _persona_cache[request.bot_id] = (persona, persona_config, time.time())

        # ── Behavior rules from persona_config ───────────────────────────────
        behavior_rules = []
        if persona_config.get("tone"):
            behavior_rules.append(f"- Tone of Voice: {persona_config['tone']}")
        if persona_config.get("conversation_length"):
            behavior_rules.append(f"- Verbosity/Length: {persona_config['conversation_length']}")

        sales_rules = []
        if persona_config.get("lead_capture_mode"):
            sales_rules.append("- CRITICAL: Actively ask for the user's Name, Phone, and Email to capture them as a lead.")
        if persona_config.get("upsell_suggestions"):
            sales_rules.append("- Look for opportunities to upsell or cross-sell relevant items.")

        guardrails = []
        if persona_config.get("restricted_topics"):
            guardrails.append(f"- MUST NEVER discuss: {', '.join(persona_config['restricted_topics'])}")
        if persona_config.get("compliance_rules"):
            guardrails.append(f"- Strict Compliance Rules: {', '.join(persona_config['compliance_rules'])}")
        if persona_config.get("out_of_scope_response"):
            guardrails.append(f"- If asked out-of-scope questions, reply exactly: \"{persona_config['out_of_scope_response']}\"")

        goals = persona_config.get("goals", [])
        goal_text = f"Your primary business goals are: {', '.join(goals)}." if goals else ""

        # ── Industry / booking detection ──────────────────────────────────────
        industry = persona_config.get("industry", "").lower()
        is_restaurant = "restaurant" in industry or "food" in industry or "restaurant" in request.bot_id
        is_automotive = (
            "automotive" in industry or "dealer" in industry or "car" in industry
            or any(k in request.bot_id for k in ("dealer", "autobahn", "mahindra", "maya"))
        )
        is_resort = (
            "resort" in industry or "hotel" in industry or "hospitality" in industry
            or any(k in request.bot_id for k in ("resort", "hotel"))
        )
        is_booking_bot = (
            any("reserv" in str(g).lower() or "book" in str(g).lower() for g in goals)
            or is_restaurant or is_automotive or is_resort
        )

        if is_resort:
            booking_rules = """
BOOKING PROTOCOL (Resort / Hotel):
1. If the guest shows interest in booking a room or stay, warmly guide them step-by-step.
2. Collect each piece of information ONE at a time (conversationally):
   a. Check-in date  b. Check-out date  c. Room type preference
   d. Number of adults & children  e. Special requests  f. Full name
   g. Mobile number  h. Email address
3. Once ALL 8 details are confirmed, summarise clearly and ask the guest to confirm.
4. If the guest confirms, append exactly: [SYSTEM_BOOKING_CONFIRMED]
5. NEVER ask for 'number of guests' in a single combined question.
6. Be warm, gracious, and professional — this is a luxury resort experience.
"""
        elif is_restaurant:
            booking_rules = """
BOOKING PROTOCOL (Restaurant):
1. If user wants to reserve a table, ask ONLY for: Date, Time, Number of Guests, Name, Phone.
2. Ask one question at a time.
3. Once all 5 details are confirmed, repeat them and append: [SYSTEM_BOOKING_CONFIRMED]
"""
        elif is_automotive:
            booking_rules = """
BOOKING PROTOCOL (Automotive Dealership):
1. If user wants a test drive or site visit, ask ONLY for: Preferred Date, Preferred Time, Name, Phone, Email.
2. Ask conversationally — one or two questions at a time.
3. Once all 5 details are confirmed, repeat them and append: [SYSTEM_BOOKING_CONFIRMED]
4. NEVER ask unrelated questions (e.g. party size, table preference).
"""
        elif is_booking_bot:
            booking_rules = """
BOOKING PROTOCOL:
1. If user shows booking intent, ask for required details step-by-step.
2. Once all details are collected, repeat them to confirm.
3. If the user confirms, append: [SYSTEM_BOOKING_CONFIRMED]
"""
        else:
            booking_rules = ""

        # ── Fetch memory + RAG context in TRUE parallel ───────────────────────
        memory_text = ""

        async def _fetch_memory():
            nonlocal memory_text
            if not supabase:
                return
            try:
                loop = asyncio.get_event_loop()
                cust_task = loop.run_in_executor(
                    None,
                    lambda: supabase.table("customers")
                        .select("name, preferences")
                        .eq("phone", request.session_id)
                        .limit(1)
                        .execute()
                )
                mem_task = loop.run_in_executor(
                    None,
                    lambda: supabase.table("leads")
                        .select("summary")
                        .eq("session_id", request.session_id)
                        .order("created_at", desc=True)
                        .limit(1)
                        .execute()
                )
                cust_res, mem_res = await asyncio.gather(cust_task, mem_task, return_exceptions=True)
                if not isinstance(cust_res, Exception) and cust_res.data:
                    cust = cust_res.data[0]
                    memory_text += f"\nKNOWN USER: {cust.get('name')} | History: {cust.get('preferences')}\n"
                if not isinstance(mem_res, Exception) and mem_res.data:
                    memory_text += f"\nRecent session context:\n{mem_res.data[0]['summary']}\n"
            except Exception as e:
                logger.warning("Memory fetch error: %s", e)

        rag_query = request.message or "car vehicle details"
        image_context_hint = ""

        async def _build_rag_context():
            nonlocal image_context_hint
            _rag_query = rag_query

            if hasattr(request, "image_data") and request.image_data:
                try:
                    vision_hint = await generate_chat_response([
                        {"role": "user", "content": [
                            {"type": "text", "text": "Identify the car model and color. Reply with ONLY the model keywords (e.g. 'Red Mahindra Thar')."},
                            {"type": "image_url", "image_url": {"url": request.image_data}}
                        ]}
                    ], max_tokens=15)
                    if vision_hint and "missing" not in vision_hint.lower():
                        image_context_hint = vision_hint.strip()
                        _rag_query = f"{image_context_hint} specs pricing {rag_query}"
                except Exception as e:
                    logger.warning("[VISION_RAG] Hint generation failed: %s", e)

            ctx_text = ""
            ctx_images: typing.List[typing.Tuple[str, str]] = []
            try:
                query_embedding = await generate_embedding(_rag_query)
                if supabase and query_embedding:
                    loop = asyncio.get_event_loop()
                    res = await loop.run_in_executor(
                        None,
                        lambda: supabase.rpc("match_documents", {
                            "query_embedding": query_embedding,
                            "match_threshold": 0.35,
                            "match_count": 4,
                            "filter_bot_id": request.bot_id
                        }).execute()
                    )
                    if res.data:
                        all_text_parts: typing.List[str] = []
                        for item in res.data:
                            content = item["content"]
                            page_title = item.get("page_title", "")
                            imgs = _re.findall(r'!\[([^\]]*)\]\(([^)]+)\)', content)
                            for alt, url in imgs:
                                url_lower = url.lower()
                                if any(k in url_lower for k in ['.svg', 'icon', 'logo', 'button', 'badge', 'bg-', 'background']):
                                    continue
                                display_name = alt.strip() if alt.strip() else (page_title or "Vehicle")
                                if not any(u == url for a, u in ctx_images):
                                    ctx_images.append((display_name, url))
                            text_only = _re.sub(r'!\[[^\]]*\]\([^)]+\)', '', content).strip()
                            if text_only:
                                metadata = item.get("metadata", {})
                                page_url = metadata.get("source", "") if isinstance(metadata, dict) else ""
                                if not page_url:
                                    page_url = item.get("source_group", "")
                                source_type = item.get("source_type", "")
                                if source_type in ["url", "sitemap", "website"] and page_url and page_url.startswith("http"):
                                    text_only += f"\n[Available Web Page Link: {page_url}]"
                                all_text_parts.append(text_only)
                        ctx_text = "\n\n".join(all_text_parts)
            except Exception as e:
                logger.error("RAG retrieval error: %s", e)
            return ctx_text, ctx_images

        (context_text, context_images), _ = await asyncio.gather(
            _build_rag_context(),
            _fetch_memory(),
        )

        # ── Image knowledge section ───────────────────────────────────────────
        image_knowledge = ""
        if context_images:
            image_knowledge = "\n\nIMAGES FROM KNOWLEDGE BASE (use only these exact links for their matching vehicle):\n"
            for i, (alt, img_url) in enumerate(context_images[:8]):
                image_knowledge += f"- Image of {alt}: ![{alt}]({img_url})\n"

        has_image = bool(getattr(request, "image_data", None))

        # ── System prompt ─────────────────────────────────────────────────────
        _no_kb_msg = "⚠️ No knowledge base data found. Do NOT invent anything. Tell the user you don't have that information and offer to connect them with the team."
        current_time = datetime.datetime.now().strftime("%Y-%m-%d %I:%M %p")
        current_date = datetime.datetime.now().strftime("%A, %B %d, %Y")

        image_capability_section = ""
        if has_image or is_automotive:
            image_capability_section = """
IMAGE CAPABILITY (STRICT KB-ONLY):
- You CAN visually identify the vehicle in any uploaded image.
- You may ONLY share specs/pricing if they appear verbatim in the KNOWLEDGE BASE.
- If not in KB: "I can see this appears to be a [model], but I don't have detailed specs for it yet. Would you like me to connect you with our sales team?"
- NEVER guess or use training knowledge for vehicle details.
"""

        system_prompt = f"""[CURRENT DATE & TIME — treat this as absolute ground truth, never use your training knowledge to determine the date]
TODAY: {current_date}  |  TIME: {current_time}
DATE RULE: Any date before {current_date} is in the past. NEVER confirm a booking for a past date.

{persona}

{goal_text}

CONFIGURATION & BEHAVIOR:
{chr(10).join(behavior_rules) if behavior_rules else "- Be helpful and professional."}
{chr(10).join(sales_rules)}

{booking_rules}

GUARDRAILS:
{chr(10).join(guardrails) if guardrails else "- Respond helpfully within your domain."}
{image_capability_section}
RESPONSE FORMAT (append ONE tag at end of every response):
- Items/menu/pricing → [FORMAT: menu]
- Step-by-step instructions → [FORMAT: steps]
- Booking confirmed → [FORMAT: booking_confirm]
- Comparing options → [FORMAT: comparison]
- Single FAQ answer → [FORMAT: faq]
- Location/address → [FORMAT: location]
- Everything else → [FORMAT: default]

FORMATTING RULES:
- Use Markdown: **bold** for key info, bullet lists, double newlines between paragraphs.
- NEVER invent URLs or image links — only use those explicitly in the KNOWLEDGE BASE.
- If KB contains `[Available Web Page Link: ...]`, share it with the user as [View Page](url).
- MAP RULE: If user asks for location, provide full address + Google Maps link: [Get Directions](https://www.google.com/maps/search/?api=1&query=<URL_ENCODED_ADDRESS>)
- MULTI-LANGUAGE: Always reply in the EXACT language the user is speaking.
- SUGGESTION ENGINE: End with a relevant next-step question when appropriate.

CONFIDENCE & LEARNING:
- Append [CONFIDENCE: High|Medium|Low] at the very end of every response.
- If you cannot answer from the KB, also append [GAP: <missing topic>].

MEMORY:
{memory_text if memory_text else "No prior session context."}

⚠️ KNOWLEDGE BASE — YOUR ONLY SOURCE OF TRUTH ⚠️
Answer ONLY using the data below. If not found, say: "I don't have that specific information yet. Would you like me to connect you with our team?"
{context_text if context_text else _no_kb_msg}
{image_knowledge}"""

        # ── Build messages array ──────────────────────────────────────────────
        messages: typing.List[typing.Dict[str, typing.Any]] = [{"role": "system", "content": system_prompt}]

        if request.history:
            for msg in request.history[-6:]:
                role = "assistant" if msg.sender == "bot" else "user"
                messages.append({"role": role, "content": msg.text})

        if has_image:
            messages.append({
                "role": "user",
                "content": [
                    {"type": "text", "text": request.message or "Analyze this image and answer the user query."},
                    {"type": "image_url", "image_url": {"url": request.image_data}}
                ]
            })
        else:
            messages.append({"role": "user", "content": request.message})

        return messages, has_image

    @staticmethod
    def _parse_tags(bot_reply: str) -> typing.Tuple[str, str, str, typing.Optional[str]]:
        """Strip AI signal tags from reply. Returns (clean_reply, format_type, confidence_score, gap_topic)."""
        format_match = _re.search(r'\[FORMAT:\s*(.*?)\]', bot_reply)
        format_type = format_match.group(1).strip().lower() if format_match else "default"
        bot_reply = _re.sub(r'\[FORMAT:\s*.*?\]', '', bot_reply).strip()

        confidence_match = _re.search(r'\[CONFIDENCE:\s*(.*?)\]', bot_reply)
        confidence_score = confidence_match.group(1).strip() if confidence_match else "Unknown"
        bot_reply = _re.sub(r'\[CONFIDENCE:\s*.*?\]', '', bot_reply).strip()

        if confidence_score.lower() == "low":
            bot_reply += "\n\n*(Note: I may need to confirm this information as my confidence is low.)*"

        gap_match = _re.search(r'\[GAP:\s*(.*?)\]', bot_reply)
        gap_topic = gap_match.group(1).strip() if gap_match else None
        bot_reply = _re.sub(r'\[GAP:\s*.*?\]', '', bot_reply).strip()

        return bot_reply, format_type, confidence_score, gap_topic

    @staticmethod
    def _handle_booking(bot_reply: str) -> typing.Tuple[str, str]:
        """Detect booking confirmation tag. Returns (clean_reply, action_taken)."""
        if "[SYSTEM_BOOKING_CONFIRMED]" in bot_reply:
            bot_reply = bot_reply.replace("[SYSTEM_BOOKING_CONFIRMED]", "").strip()
            bot_reply += "\n\n✅ *System Notification: Event has been successfully added to the reservation calendar.*"
            return bot_reply, "booking_created"
        return bot_reply, "none"

    @staticmethod
    def _log_gap_async(request: ChatRequest, gap_topic: str):
        """Fire-and-forget: log a knowledge gap to the KB table."""
        supabase = get_supabase_client()
        if not supabase:
            return
        def _do():
            try:
                supabase.table("knowledge_base").insert({
                    "bot_id": request.bot_id,
                    "content": json.dumps({"question": request.message, "topic": gap_topic, "status": "pending"}),
                    "source_type": "learning_gap",
                    "source_group": "User Questions",
                    "page_title": gap_topic
                }).execute()
            except Exception as e:
                logger.warning("Failed to log knowledge gap: %s", e)
        loop = asyncio.get_event_loop()
        loop.run_in_executor(None, _do)

    @staticmethod
    def _start_background_post_process(request: ChatRequest, bot_reply: str, confidence_score: str, gap_topic: typing.Optional[str], action_taken: str):
        """Fire-and-forget: lead detection + DB logging with up to _MAX_BG_RETRIES attempts."""

        async def _attempt() -> None:
            supabase = get_supabase_client()
            full_convo = ""
            if request.history:
                for msg in request.history[-10:]:
                    role = "Customer" if msg.sender == "user" else "Bot"
                    full_convo += f"{role}: {msg.text}\n"
            full_convo += f"Customer: {request.message}\nBot: {bot_reply}"

            lead_detection_prompt = f"""Analyze this conversation and output ONLY valid JSON.

Conversation:
{full_convo}

Your task:
1. Score 0-100: how likely is the customer to convert?
2. Type: one of: "booking", "reservation", "product_inquiry", "complaint", "general_question", "lead_opportunity", "none"
3. Extract: Name, Phone, Email, Date, Time, Check-out, Room Type, Guests (null if not found)
4. Write a 1-3 line summary of what the customer wants.

JSON only, no markdown:
{{"score": 85, "type": "booking", "name": "...", "phone": "...", "email": "...", "summary": "...", "date": null, "time": null, "check_out": null, "room_type": null, "guests": null}}"""

            lead_json_str = await generate_chat_response([
                {"role": "system", "content": "You are a lead extraction AI. Output ONLY valid JSON, no explanation, no markdown."},
                {"role": "user", "content": lead_detection_prompt}
            ])
            cleaned_json = lead_json_str.strip()
            if cleaned_json.startswith("```"):
                cleaned_json = cleaned_json.split("```")[1]
                if cleaned_json.startswith("json"):
                    cleaned_json = cleaned_json[4:]
            lead_data: dict = json.loads(cleaned_json.strip())

            if action_taken == "booking_created":
                lead_data["score"] = 100
                lead_data["type"] = "booking"

            def _save():
                if not supabase:
                    return
                if lead_data.get("score", 0) >= 30:
                    existing = supabase.table("leads").select("id").eq("session_id", request.session_id).execute()
                    extracted = []
                    for k, label in [("name", "Name"), ("phone", "Phone"), ("email", "Email"),
                                     ("date", "Check-In/Date"), ("check_out", "Check-Out"),
                                     ("time", "Time"), ("room_type", "Room"), ("guests", "Guests")]:
                        if lead_data.get(k):
                            extracted.append(f"{label}: {lead_data[k]}")
                    summary = ("\n".join(extracted) + "\n\n" if extracted else "") + "SUMMARY: " + lead_data.get("summary", "")
                    payload = {
                        "bot_id": request.bot_id, "session_id": request.session_id,
                        "score": lead_data["score"], "type": lead_data["type"],
                        "name": lead_data.get("name"), "phone": lead_data.get("phone"),
                        "email": lead_data.get("email"), "status": "new", "summary": summary.strip()
                    }
                    if existing.data:
                        supabase.table("leads").update(payload).eq("session_id", request.session_id).execute()
                    else:
                        supabase.table("leads").insert(payload).execute()

                    if lead_data.get("phone"):
                        supabase.table("customers").upsert({
                            "phone": lead_data["phone"], "name": lead_data.get("name"),
                            "email": lead_data.get("email"), "preferences": lead_data.get("summary")
                        }, on_conflict="phone").execute()

                    if action_taken == "booking_created" and lead_data.get("phone"):
                        supabase.table("bookings").insert({
                            "bot_id": request.bot_id, "customer_phone": lead_data["phone"],
                            "booking_date": lead_data.get("date"), "booking_time": lead_data.get("time"),
                            "status": "confirmed"
                        }).execute()

                supabase.table("chat_logs").insert({
                    "bot_id": request.bot_id, "session_id": request.session_id,
                    "user_message": request.message, "bot_reply": bot_reply,
                    "lead_score": lead_data.get("score", 0), "lead_type": lead_data.get("type", "none"),
                    "confidence_score": confidence_score, "gap_topic": gap_topic
                }).execute()

            loop = asyncio.get_event_loop()
            await loop.run_in_executor(None, _save)

        async def _run_with_retry():
            for attempt in range(1, _MAX_BG_RETRIES + 1):
                try:
                    await _attempt()
                    return
                except Exception as e:
                    if attempt < _MAX_BG_RETRIES:
                        wait = 2 ** attempt  # 2s, 4s
                        logger.warning("[BG] Attempt %d/%d failed (%s) — retrying in %ds", attempt, _MAX_BG_RETRIES, e, wait)
                        await asyncio.sleep(wait)
                    else:
                        logger.error("[BG] All %d attempts failed for bot=%s session=%s: %s",
                                     _MAX_BG_RETRIES, request.bot_id, request.session_id, e)

        asyncio.create_task(_run_with_retry())

    # ── Public API ────────────────────────────────────────────────────────────

    @staticmethod
    async def process_chat(request: ChatRequest) -> ChatResponse:
        messages, has_image = await BotService._prepare_messages(request)

        bot_reply = await generate_chat_response(messages, max_tokens=450 if has_image else 350)

        bot_reply, format_type, confidence_score, gap_topic = BotService._parse_tags(bot_reply)
        bot_reply, action_taken = BotService._handle_booking(bot_reply)

        if gap_topic:
            BotService._log_gap_async(request, gap_topic)

        BotService._start_background_post_process(request, bot_reply, confidence_score, gap_topic, action_taken)

        return ChatResponse(
            reply=bot_reply,
            lead_score=0,
            lead_type="none",
            action_taken=action_taken,
            format_type=format_type
        )

    @staticmethod
    async def process_chat_stream(request: ChatRequest) -> typing.AsyncGenerator[dict, None]:
        """
        Async generator for SSE streaming.
        Yields {"type": "token", "content": "..."} for each token,
        then {"type": "done", "reply": ..., "format_type": ..., "action_taken": ...} at the end.
        """
        messages, has_image = await BotService._prepare_messages(request)

        full_reply = ""
        async for token in generate_chat_response_stream(messages, max_tokens=450 if has_image else 350):
            full_reply += token
            yield {"type": "token", "content": token}

        # Post-process the complete reply
        clean_reply, format_type, confidence_score, gap_topic = BotService._parse_tags(full_reply)
        clean_reply, action_taken = BotService._handle_booking(clean_reply)

        if gap_topic:
            BotService._log_gap_async(request, gap_topic)

        BotService._start_background_post_process(request, clean_reply, confidence_score, gap_topic, action_taken)

        yield {"type": "done", "reply": clean_reply, "format_type": format_type, "action_taken": action_taken}
