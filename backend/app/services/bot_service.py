import json
import typing
from app.models.schemas import ChatRequest, ChatResponse
from app.integrations.openai_client import generate_chat_response, generate_embedding
from app.integrations.supabase_client import get_supabase_client

class BotService:
    @staticmethod
    async def process_chat(request: ChatRequest) -> ChatResponse:
        supabase = get_supabase_client()
        
        # dynamically retrieve persona and config
        persona = "You are a helpful AI assistant."
        persona_config = {}
        if supabase:
            res = supabase.table("bots").select("persona_prompt, persona_config").eq("id", request.bot_id).execute()
            if res.data and len(res.data) > 0:
                persona = res.data[0]["persona_prompt"]
                persona_config = res.data[0].get("persona_config") or {}
        
        # Build dynamic persona rules based on the UI configuration
        behavior_rules = []
        if persona_config.get("tone"): behavior_rules.append(f"- Tone of Voice: {persona_config['tone']}")
        if persona_config.get("conversation_length"): behavior_rules.append(f"- Verbosity/Length: {persona_config['conversation_length']}")
        
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
        
        booking_rules = ""
        # Detect bot domain for contextual booking and knowledge refinement
        industry = persona_config.get("industry", "").lower()
        is_restaurant = "restaurant" in industry or "food" in industry or "restaurant" in request.bot_id
        is_automotive = "automotive" in industry or "dealer" in industry or "car" in industry or "dealer" in request.bot_id or "autobahn" in request.bot_id or "mahindra" in request.bot_id or "maya" in request.bot_id
        is_resort = "resort" in industry or "hotel" in industry or "hospitality" in industry or "resort" in request.bot_id or "hotel" in request.bot_id
        is_booking_bot = any("reserv" in str(g).lower() or "book" in str(g).lower() for g in goals) or is_restaurant or is_automotive or is_resort
        
        if is_resort:
            booking_rules = """
            BOOKING PROTOCOL (Resort / Hotel):
            1. If the guest shows interest in booking a room or stay, warmly guide them step-by-step.
            2. Collect each piece of information ONE at a time (conversationally):
               a. Check-in date
               b. Check-out date (confirm number of nights)
               c. Room type preference (offer options if the guest is unsure)
               d. Number of adults & number of children (ask for ages of children)
               e. Any special requests (honeymoon, anniversary, dietary restrictions, early check-in, etc.)
               f. Guest's full name
               g. Mobile number
               h. Email address (for booking confirmation voucher)
            3. Once ALL 8 details are confirmed, summarize them clearly and ask the guest to confirm.
            4. If the guest confirms, append exactly: [SYSTEM_BOOKING_CONFIRMED]
            5. NEVER ask for 'number of guests' in a single combined question — always separate adults and children.
            6. Be warm, gracious, and professional throughout — this is a luxury resort experience.
            """
        elif is_restaurant:
            booking_rules = """
            BOOKING PROTOCOL (Restaurant):
            1. If user wants to reserve a table, ask ONLY for: Date, Time, Number of Guests, Name, Phone.
            2. Ask one question at a time — do NOT dump all questions at once.
            3. Once all 5 details are confirmed, repeat them clearly and append: [SYSTEM_BOOKING_CONFIRMED]
            """
        elif is_automotive:
            booking_rules = """
            BOOKING PROTOCOL (Automotive Dealership):
            1. If user wants a test drive or site visit, ask ONLY for: Preferred Date, Preferred Time, Name, Phone Number, Email.
            2. Ask conversationally — one or two questions at a time. Do NOT ask for 'Number of Guests'.
            3. Once all 5 details are confirmed by the user, repeat them clearly and append: [SYSTEM_BOOKING_CONFIRMED]
            4. NEVER ask unrelated questions (e.g. party size, table preference).
            """
        elif is_booking_bot:
            booking_rules = """
            BOOKING PROTOCOL:
            1. If user shows booking intent, ask for required details step-by-step relevant to your domain.
            2. Once all details are collected, repeat them to confirm.
            3. If the user confirms, append: [SYSTEM_BOOKING_CONFIRMED]
            """

        # Fetch Deep Customer Memory & Previous Interactions
        memory_text = ""
        try:
            if supabase:
                # 1. Check if session_id is a known phone number in Customers
                cust_res = supabase.table("customers").select("name, preferences").eq("phone", request.session_id).limit(1).execute()
                if cust_res.data:
                    cust = cust_res.data[0]
                    memory_text += f"\nCRITICAL CUSTOMER MEMORY (KNOWN USER):\nName: {cust.get('name')}\nPreferences/History: {cust.get('preferences')}\n"
                    memory_text += "Use this context to welcome them back personally by name and recall their past bookings/preferences if relevant.\n"
                
                # 2. Add recent lead summary context
                mem_res = supabase.table("leads").select("summary").eq("session_id", request.session_id).order("created_at", desc=True).limit(1).execute()
                if mem_res.data:
                    memory_text += f"\nContext from recent session interactions:\n{mem_res.data[0]['summary']}\n"
        except Exception as e:
            print(f"Memory fetch error: {e}")
        
        # 1. Synthesize RAG query - combine message with visual context if image present
        rag_query = request.message or "car vehicle details"
        image_context_hint = ""
        
        if hasattr(request, "image_data") and request.image_data:
            try:
                # Fast pass to identify car model from image for better RAG lookup
                # (Only if it's an automotive domain which is highly visual)
                vision_prompt = "Identify the car model and color in this image. Reply with ONLY the name/model keywords (e.g. 'Red Mahindra Thar')."
                vision_hint = await generate_chat_response([
                    {"role": "user", "content": [
                        {"type": "text", "text": vision_prompt},
                        {"type": "image_url", "image_url": {"url": request.image_data}}
                    ]}
                ], max_tokens=20)
                
                if vision_hint and "missing" not in vision_hint.lower():
                    image_context_hint = vision_hint.strip()
                    rag_query = f"{image_context_hint} specs pricing {rag_query}"
            except Exception as vision_err:
                print(f"[VISION_RAG] Hint generation failed: {vision_err}")

        # 2. Generate embedding for query & retrieve RAG context
        context_text = ""
        context_images = []  # list of tuples: (alt_text, url)
        try:
            query_embedding = await generate_embedding(rag_query)
            if supabase and query_embedding:
                res = supabase.rpc("match_documents", {
                    "query_embedding": query_embedding,
                    "match_threshold": 0.3, 
                    "match_count": 6,
                    "filter_bot_id": request.bot_id
                }).execute()
                if res.data:
                    import re as _re
                    all_text_parts: typing.List[str] = []
                    for item in res.data:
                        content = item["content"]
                        page_title = item.get("page_title", "")
                        # Extract image markdowns: ![alt](url)
                        imgs = _re.findall(r'!\[([^\]]*)\]\(([^)]+)\)', content)
                        for alt, url in imgs:
                            # Skip likely UI icons, logos, flags, and backgrounds
                            url_lower = url.lower()
                            if any(k in url_lower for k in ['.svg', 'icon', 'logo', 'button', 'badge', 'bg-', 'background']):
                                continue
                                
                            # if alt is empty, fallback to page title or "Vehicle"
                            display_name = alt.strip() if alt.strip() else (page_title or "Vehicle")
                            # Avoid duplicates
                            if not any(u == url for a, u in context_images):
                                context_images.append((display_name, url))
                            
                        # Keep text, strip image markdown lines to keep context clean
                        text_only = _re.sub(r'!\[[^\]]*\]\([^)]+\)', '', content).strip()
                        if text_only:
                            metadata = item.get("metadata", {})
                            page_url = metadata.get("source", "") if isinstance(metadata, dict) else ""
                            if not page_url:
                                page_url = item.get("source_group", "")
                            
                            source_type = item.get("source_type", "")
                            
                            # If it came from a website, append the URL so the AI can link to it
                            if source_type in ["url", "sitemap", "website"] and page_url and page_url.startswith("http"):
                                text_only += f"\n[Available Web Page Link: {page_url}]"
                                
                            all_text_parts.append(text_only)
                    context_text = "\n\n".join(all_text_parts)
        except Exception as e:
            print(f"RAG retrieval error: {e}")

        # Build image knowledge section
        image_knowledge = ""
        if context_images:
            image_knowledge = "\n\nIMAGES FROM KNOWLEDGE BASE (CRITICAL: ONLY use these exact markdown links for their specific matching vehicle! Do NOT mix them up):\n"
            for i, (alt, img_url) in enumerate(context_images):
                if i >= 8:
                    break
                image_knowledge += f"- Image of {alt}: ![{alt}]({img_url})\n"

        # 2. Formulate Chat Prompt - Merging DB persona + Config UI + Context
        _no_kb_msg = "⚠️ No knowledge base data found for this query. Do NOT invent or guess anything. Tell the user you don't have that information yet and offer to connect them with the team."
        import datetime
        current_time = datetime.datetime.now().strftime("%Y-%m-%d %I:%M %p")
        current_date = datetime.datetime.now().strftime("%A, %B %d, %Y")

        system_prompt = f"""{persona}

Current Date and Time Information (CRITICAL CONTEXT):
- Current Date: {current_date}
- Current Time: {current_time}
- Use this information to correctly interpret terms like "today", "tomorrow", "next week", "later today" and to ensure reservations exist in the future.

{goal_text}

CONFIGURATION & BEHAVIOR:
{chr(10).join(behavior_rules)}
{chr(10).join(sales_rules)}

{booking_rules}

GUARDRAILS:
{chr(10).join(guardrails)}

IMAGE CAPABILITY (CRITICAL — STRICT KB-ONLY):
- You CAN visually analyze any image the user sends and identify what the vehicle LOOKS like.
- After identifying it visually, you MUST look it up in the KNOWLEDGE BASE below.
- You may ONLY share specs, pricing, or availability if they appear verbatim in the KNOWLEDGE BASE.
- If the vehicle is not in the KNOWLEDGE BASE, respond: "I can see this appears to be a [model], but I don't have detailed specs or pricing for it in my knowledge base yet. Would you like me to connect you with our sales team?"
- NEVER guess, infer, or use your own training knowledge to fill in vehicle details.

SMART FORMAT SIGNAL (CRITICAL - always include at end of response):
Detect the primary intent of THIS response and append the matching tag:
- Listing items, menu, packages, pricing → [FORMAT: menu]
- Step-by-step how-to, process, instructions → [FORMAT: steps]  
- Booking/reservation confirmed → [FORMAT: booking_confirm]
- Comparing two or more options/models → [FORMAT: comparison]
- Answering a single FAQ/question → [FORMAT: faq]
- Providing location, address, directions → [FORMAT: location]
- All other conversational replies → [FORMAT: default]

FORMATTING RULES & HALLUCINATION PREVENTION (CRITICAL):
- Use standard Markdown for ALL formatting. 
- When listing items, use standard Markdown bullet points (* or -) with a space after.
- Use **bolding** for important names, prices, specifications, and features to make them stand out.
- Separate paragraphs with DOUBLE newlines for clear spacing.
- Keep responses structured: Lead with the most important info, use bullets for details, and end with a conversational next step.
- NEVER invent, guess, or hallucinate URLs or image links. You must ONLY use explicit URLs that operate within your KNOWLEDGE BASE below. 
- If the user asks for an image/link but none are provided in your context, say you do not have it available. Do NOT write an image markdown tag using a fake or predictive URL.
- When you know about a specific vehicle and *relevant images exist in the context*, embed them using markdown: ![description](url)
- VERY IMPORTANT: If your knowledge block contains an `[Available Web Page Link: ...]`, you CAN and SHOULD share that link with the user if they ask for the page or more information! Format it nicely like [View Page](url).
- CRITICAL MAP RULE: If the user asks for your location, address, or directions, you MUST provide the exact full address. IMMEDIATELY after the address, you MUST provide a clickable Google Maps link in this exact markdown format:  [Get Directions](https://www.google.com/maps/search/?api=1&query=<INSERT_URL_ENCODED_ADDRESS>)

MULTI-LANGUAGE (CRITICAL):
- ALWAYS respond in the EXACT language the user is speaking (e.g., if asked in Arabic, reply in Arabic).

SUGGESTION ENGINE:
- If appropriate, proactively end your response with a question suggesting a next step (e.g. "Would you like to schedule a visit?").

SELF-LEARNING & CONFIDENCE (CRITICAL):
- You MUST append this exact tag at the very end of your response based on your factual certainty: [CONFIDENCE: High] or [CONFIDENCE: Medium] or [CONFIDENCE: Low].
- If you are asked a specific domain question and DO NOT know the answer from your knowledge base, you MUST also append this exact tag: [GAP: <insert missing topic here>]

MEMORY / HISTORY:
{memory_text}

⚠️ KNOWLEDGE BASE — YOUR ONLY SOURCE OF TRUTH ⚠️
CRITICAL: You MUST answer ONLY using the data below. Do NOT use your own GPT training knowledge to answer factual questions about vehicles, prices, specs, features, or availability.
- If the answer is NOT found below, say: "I don't have that specific information in my knowledge base right now. Would you like me to connect you with our team?"
- For image uploads: you may visually identify the car model, but ONLY provide details that exist below in this knowledge base. No KB data = no specs given.
{context_text if context_text else _no_kb_msg}
{image_knowledge}
"""

        messages: typing.List[typing.Dict[str, typing.Any]] = [{"role": "system", "content": system_prompt}]
        
        # Inject Chat History
        if request.history:
            for msg in request.history:
                role = "assistant" if msg.sender == "bot" else "user"
                messages.append({"role": role, "content": msg.text})

        if hasattr(request, "image_data") and request.image_data:
            messages.append({
                "role": "user", 
                "content": [
                    {"type": "text", "text": request.message or "Analyze this image and answer the user query."},
                    {"type": "image_url", "image_url": {"url": request.image_data}}
                ]
            })
        else:
            messages.append({"role": "user", "content": request.message})

        # 3. Generate Reply — use higher token limit and vision when image present
        has_image = bool(request.image_data)
        bot_reply = await generate_chat_response(messages, max_tokens=1200 if has_image else 800)
        
        # Parse all AI signal tags (FORMAT, CONFIDENCE, GAP)
        import re as _re

        # Parse FORMAT signal
        format_match = _re.search(r'\[FORMAT:\s*(.*?)\]', bot_reply)
        format_type = format_match.group(1).strip().lower() if format_match else "default"
        bot_reply = _re.sub(r'\[FORMAT:\s*.*?\]', '', bot_reply).strip()

        # Parse Confidence and Gaps
        confidence_match = _re.search(r'\[CONFIDENCE:\s*(.*?)\]', bot_reply)
        confidence_score = confidence_match.group(1).strip() if confidence_match else "Unknown"
        bot_reply = _re.sub(r'\[CONFIDENCE:\s*.*?\]', '', bot_reply).strip()

        if confidence_score.lower() == "low":
            bot_reply += "\n\n*(Note: I may need to confirm this information as my confidence is low.)*"

        gap_match = _re.search(r'\[GAP:\s*(.*?)\]', bot_reply)
        gap_topic = gap_match.group(1).strip() if gap_match else None
        bot_reply = _re.sub(r'\[GAP:\s*.*?\]', '', bot_reply).strip()

        # Log gap to Knowledge Base table if detected
        if gap_topic and supabase:
            try:
                supabase.table("knowledge_base").insert({
                    "bot_id": request.bot_id,
                    "content": json.dumps({"question": request.message, "topic": gap_topic, "status": "pending"}),
                    "source_type": "learning_gap",
                    "source_group": "User Questions",
                    "page_title": gap_topic
                }).execute()
            except Exception as e:
                print(f"Failed to log knowledge gap: {e}")

        # Check for Bookings trigger
        action_taken = "none"
        if "[SYSTEM_BOOKING_CONFIRMED]" in bot_reply:
            bot_reply = bot_reply.replace("[SYSTEM_BOOKING_CONFIRMED]", "").strip()
            # MOCK GOOGLE CALENDAR CREATION HERE
            bot_reply += "\n\n✅ *System Notification: Event has been successfully added to the reservation calendar.*"
            action_taken = "booking_created"

        # 4 & 5. Perform slow Lead Detection & DB Logging in the background!
        import asyncio
        async def _background_post_process(req, bot_response, conf, gap, act):
            full_convo = ""
            if req.history:
                for msg in req.history[-10:]:
                    role = "Customer" if msg.sender == "user" else "Bot"
                    full_convo += f"{role}: {msg.text}\n"
            full_convo += f"Customer: {req.message}\nBot: {bot_response}"
            
            lead_detection_prompt = f"""Analyze this conversation and output ONLY valid JSON.

Conversation:
{full_convo}

Your task:
1. Score 0-100: how likely is the customer to convert? Score >60 only if they show clear interest, provide contact info, or confirm a booking.
2. Type: choose ONE of: "booking", "reservation", "product_inquiry", "complaint", "general_question", "lead_opportunity", "none". Provide "booking" if a stay or service was just booked.
3. Extract entities from the FULL conversation: Name (first name only), Phone, Email, Date (Check-in), Time, Check-out, Room Type, Guests (Adults+Children). If not found, use null.
4. Write a clean 1-3 line human-readable summary of what the customer wants, including any special requests.
5. Customer name: extract the actual first name from the conversation (NOT "Not provided" or session ID).

Output format (JSON only, no markdown):
{{"score": 85, "type": "booking", "name": "Thaslim", "phone": "9633484641", "email": "thaslim@gmail.com", "summary": "Customer confirmed booking...", "date": null, "time": null, "check_out": null, "room_type": null, "guests": null}}"""
            
            lead_data = {"score": 0, "type": "none", "summary": "No lead detected"}
            try:
                lead_json_str = await generate_chat_response([
                    {"role": "system", "content": "You are a lead extraction AI. Output ONLY valid JSON, no explanation, no markdown."},
                    {"role": "user", "content": lead_detection_prompt}
                ])
                cleaned_json = lead_json_str.strip()
                if cleaned_json.startswith("```"):
                    cleaned_json = cleaned_json.split("```")[1]
                    if cleaned_json.startswith("json"):
                        cleaned_json = cleaned_json[4:]
                lead_data = json.loads(cleaned_json.strip())
                
                # If a system booking was confirmed, force the lead type and score
                if act == "booking_created":
                    lead_data["score"] = 100
                    lead_data["type"] = "booking"
                
                if supabase and lead_data.get("score", 0) >= 30:
                    existing = supabase.table("leads").select("id").eq("session_id", req.session_id).execute()
                    
                    # Build summary
                    extracted_details = []
                    if lead_data.get("name"): extracted_details.append(f"Name: {lead_data['name']}")
                    if lead_data.get("phone"): extracted_details.append(f"Phone: {lead_data['phone']}")
                    if lead_data.get("email"): extracted_details.append(f"Email: {lead_data['email']}")
                    if lead_data.get("date"): extracted_details.append(f"Check-In/Date: {lead_data['date']}")
                    if lead_data.get("check_out"): extracted_details.append(f"Check-Out: {lead_data['check_out']}")
                    if lead_data.get("time"): extracted_details.append(f"Time: {lead_data['time']}")
                    if lead_data.get("room_type"): extracted_details.append(f"Room: {lead_data['room_type']}")
                    if lead_data.get("guests"): extracted_details.append(f"Guests: {lead_data['guests']}")
                    
                    combined_summary = "\n".join(extracted_details) + ("\n\n" if extracted_details else "") + "SUMMARY: " + lead_data.get("summary", "")
                    
                    full_payload = {
                        "bot_id": req.bot_id, "session_id": req.session_id, "score": lead_data["score"], "type": lead_data["type"],
                        "name": lead_data.get("name"), "phone": lead_data.get("phone"), "email": lead_data.get("email"),
                        "status": "new", "summary": combined_summary.strip()
                    }
                    minimal_payload = {
                        "bot_id": req.bot_id, "session_id": req.session_id, "score": lead_data["score"], 
                        "type": lead_data["type"], "summary": combined_summary.strip()
                    }
                    
                    saved = False
                    try:
                        if existing.data: supabase.table("leads").update(full_payload).eq("session_id", req.session_id).execute()
                        else: supabase.table("leads").insert(full_payload).execute()
                        saved = True
                    except Exception:
                        try:
                            if existing.data: supabase.table("leads").update(minimal_payload).eq("session_id", req.session_id).execute()
                            else: supabase.table("leads").insert(minimal_payload).execute()
                            saved = True
                        except Exception: pass

                    if saved:
                        if lead_data.get("phone"):
                            try:
                                supabase.table("customers").upsert({
                                    "phone": lead_data.get("phone"), "name": lead_data.get("name"), 
                                    "email": lead_data.get("email"), "preferences": lead_data.get("summary")
                                }, on_conflict="phone").execute()
                            except Exception: pass
                        
                        if act == "booking_created" and lead_data.get("phone"):
                            try:
                                supabase.table("bookings").insert({
                                    "bot_id": req.bot_id, "customer_phone": lead_data.get("phone"),
                                    "booking_date": lead_data.get("date"), "booking_time": lead_data.get("time"), "status": "confirmed"
                                }).execute()
                            except Exception: pass
            except Exception as e:
                print(f"[BG_LEAD] Error: {e}")

            # Persist chat log
            try:
                if supabase:
                    supabase.table("chat_logs").insert({
                        "bot_id": req.bot_id, "session_id": req.session_id, "user_message": req.message,
                        "bot_reply": bot_response, "lead_score": lead_data.get("score", 0),
                        "lead_type": lead_data.get("type", "none"), "confidence_score": conf, "gap_topic": gap
                    }).execute()
            except Exception as e:
                print(f"[BG_LOG] Error: {e}")

        # Fire and forget
        asyncio.create_task(_background_post_process(request, bot_reply, confidence_score, gap_topic, action_taken))

        return ChatResponse(
            reply=bot_reply,
            lead_score=0, # Computed async now
            lead_type="none", # Computed async now
            action_taken=action_taken,
            format_type=format_type
        )
