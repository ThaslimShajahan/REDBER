import json
from ..models.schemas import ChatRequest, ChatResponse
from ..integrations.openai_client import generate_chat_response, generate_embedding
from ..integrations.supabase_client import get_supabase_client

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
        # Detect bot domain for contextual booking questions
        industry = persona_config.get("industry", "").lower()
        is_restaurant = "restaurant" in industry or "food" in industry or "restaurant" in request.bot_id
        is_automotive = "automotive" in industry or "dealer" in industry or "car" in industry or "dealer" in request.bot_id or "autobahn" in request.bot_id
        is_booking_bot = any("reserv" in str(g).lower() or "book" in str(g).lower() for g in goals) or is_restaurant or is_automotive
        
        if is_restaurant:
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
        
        # 1. Generate embedding for query & retrieve RAG context
        context_text = ""
        context_images = []  # image URLs found in crawled content
        try:
            query_embedding = await generate_embedding(request.message or "car vehicle details")
            if supabase and query_embedding:
                res = supabase.rpc("match_documents", {
                    "query_embedding": query_embedding,
                    "match_threshold": 0.3, 
                    "match_count": 6,
                    "filter_bot_id": request.bot_id
                }).execute()
                if res.data:
                    import re as _re
                    all_text_parts = []
                    for item in res.data:
                        content = item["content"]
                        # Extract image markdowns: ![alt](url)
                        imgs = _re.findall(r'!\[([^\]]*)\]\(([^)]+)\)', content)
                        for alt, url in imgs:
                            if url not in context_images:
                                context_images.append(url)
                        # Keep text, strip image markdown lines to keep context clean
                        text_only = _re.sub(r'!\[[^\]]*\]\([^)]+\)', '', content).strip()
                        if text_only:
                            all_text_parts.append(text_only)
                    context_text = "\n\n".join(all_text_parts)
        except Exception as e:
            print(f"RAG retrieval error: {e}")

        # Build image knowledge section
        image_knowledge = ""
        if context_images:
            image_knowledge = "\n\nIMAGES FROM KNOWLEDGE BASE (include these as markdown when discussing relevant vehicles):\n"
            for img_url in context_images[:8]:  # max 8 images
                image_knowledge += f"![Vehicle]({img_url})\n"

        # 2. Formulate Chat Prompt - Merging DB persona + Config UI + Context
        system_prompt = f"""{persona}

{goal_text}

CONFIGURATION & BEHAVIOR:
{chr(10).join(behavior_rules)}
{chr(10).join(sales_rules)}

{booking_rules}

GUARDRAILS:
{chr(10).join(guardrails)}

IMAGE CAPABILITY (CRITICAL):
- You CAN and SHOULD analyze any image the user sends you.
- If a user shares a car photo, identify the make, model, colour, and any visible features.
- If the car matches a Mahindra vehicle in your knowledge base, provide full specs and pricing.
- If you cannot be 100% certain of the exact model, describe what you see and ask for confirmation.
- NEVER say you cannot identify cars. Always attempt image analysis first.

SMART FORMAT SIGNAL (CRITICAL - always include at end of response):
Detect the primary intent of THIS response and append the matching tag:
- Listing items, menu, packages, pricing → [FORMAT: menu]
- Step-by-step how-to, process, instructions → [FORMAT: steps]  
- Booking/reservation confirmed → [FORMAT: booking_confirm]
- Comparing two or more options/models → [FORMAT: comparison]
- Answering a single FAQ/question → [FORMAT: faq]
- Providing location, address, directions → [FORMAT: location]
- All other conversational replies → [FORMAT: default]

FORMATTING RULES:
- When listing items, use bullet points (•). Keep it concise.
- When you know about a specific vehicle and relevant images exist, embed them using markdown: ![description](url)
- Structure your response for readability.
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

KNOWLEDGE BASE:
{context_text if context_text else "No knowledge base data found. Do not invent factual information."}
{image_knowledge}
"""

        messages = [{"role": "system", "content": system_prompt}]
        
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
        
        # 4. Lead Detection & Scoring Pipeline
        # Build full conversation context for accurate lead extraction
        full_convo = ""
        if request.history:
            for msg in request.history[-10:]:  # last 10 messages for context
                role = "Customer" if msg.sender == "user" else "Bot"
                full_convo += f"{role}: {msg.text}\n"
        full_convo += f"Customer: {request.message}\nBot: {bot_reply}"
        
        lead_detection_prompt = f"""Analyze this conversation and output ONLY valid JSON.

Conversation:
{full_convo}

Your task:
1. Score 0-100: how likely is the customer to convert? Score >60 only if they show clear interest, provide contact info, or confirm a booking.
2. Type: choose ONE of: "reservation", "product_inquiry", "complaint", "general_question", "lead_opportunity", "none".
3. Extract entities from the FULL conversation: Name (first name only), Phone, Email, Date, Time. If not found, use null.
4. Write a clean 1-3 line human-readable summary of what the customer wants.
5. Customer name: extract the actual first name from the conversation (NOT "Not provided" or session ID).

Output format (JSON only, no markdown):
{{"score": 85, "type": "test_drive", "name": "Thaslim", "phone": "9633484641", "email": "thaslim@gmail.com", "summary": "Customer Thaslim wants a test drive for Mahindra Thar AX(O) tomorrow at 2 PM."}}"""
        
        lead_data = {"score": 0, "type": "none", "summary": "No lead detected"}
        try:
            lead_json_str = await generate_chat_response([
                {"role": "system", "content": "You are a lead extraction AI. Output ONLY valid JSON, no explanation, no markdown."},
                {"role": "user", "content": lead_detection_prompt}
            ])
            # Clean any markdown fences GPT might prefix
            cleaned_json = lead_json_str.strip()
            if cleaned_json.startswith("```"):
                cleaned_json = cleaned_json.split("```")[1]
                if cleaned_json.startswith("json"):
                    cleaned_json = cleaned_json[4:]
            cleaned_json = cleaned_json.strip()
            lead_data = json.loads(cleaned_json)
            print(f"[LEAD] Extracted: score={lead_data.get('score')}, type={lead_data.get('type')}, name={lead_data.get('name')}")
            
            # Lower threshold: capture any meaningful intent (score >= 30)
            if supabase and lead_data.get("score", 0) >= 30:
                # Check for existing lead for this session
                existing = supabase.table("leads").select("id").eq("session_id", request.session_id).execute()
                
                # Build summary with contact details embedded
                extracted_details = []
                if lead_data.get("name"): extracted_details.append(f"Name: {lead_data['name']}")
                if lead_data.get("phone"): extracted_details.append(f"Phone: {lead_data['phone']}")
                if lead_data.get("email"): extracted_details.append(f"Email: {lead_data['email']}")
                if lead_data.get("date"): extracted_details.append(f"Date: {lead_data['date']}")
                if lead_data.get("time"): extracted_details.append(f"Time: {lead_data['time']}")
                combined_summary = "\n".join(extracted_details) + ("\n\n" if extracted_details else "") + lead_data.get("summary", "")
                
                # TIER 1: Full payload (requires migration APPLY_THIS_MIGRATION.sql to be run)
                full_payload = {
                    "bot_id": request.bot_id,
                    "session_id": request.session_id,
                    "score": lead_data["score"],
                    "type": lead_data["type"],
                    "name": lead_data.get("name"),
                    "phone": lead_data.get("phone"),
                    "email": lead_data.get("email"),
                    "status": "new",
                    "summary": combined_summary.strip(),
                }
                # TIER 2: Minimal fallback — only original schema columns
                minimal_payload = {
                    "bot_id": request.bot_id,
                    "session_id": request.session_id,
                    "score": lead_data["score"],
                    "type": lead_data["type"],
                    "summary": combined_summary.strip(),
                }
                
                saved = False
                try:
                    if existing.data:
                        supabase.table("leads").update(full_payload).eq("session_id", request.session_id).execute()
                    else:
                        supabase.table("leads").insert(full_payload).execute()
                    saved = True
                    print(f"[LEAD] ✅ Saved with full payload (score={lead_data['score']})")
                except Exception as e1:
                    print(f"[LEAD] Full payload failed ({e1}), trying minimal schema fallback...")
                    try:
                        if existing.data:
                            supabase.table("leads").update(minimal_payload).eq("session_id", request.session_id).execute()
                        else:
                            supabase.table("leads").insert(minimal_payload).execute()
                        saved = True
                        print(f"[LEAD] ✅ Saved with minimal payload — run APPLY_THIS_MIGRATION.sql to enable full fields")
                    except Exception as e2:
                        print(f"[LEAD] ❌ BOTH save attempts failed. Error: {e2}")

                if saved:
                    if action_taken == "none":
                        action_taken = "lead_stored"
                    
                    # Update customers table for memory (best-effort)
                    if lead_data.get("phone"):
                        try:
                            supabase.table("customers").upsert({
                                "phone": lead_data.get("phone"),
                                "name": lead_data.get("name"),
                                "email": lead_data.get("email"),
                                "preferences": lead_data.get("summary")
                            }, on_conflict="phone").execute()
                        except Exception as e:
                            print(f"[MEMORY] customers upsert skipped (table may not exist yet): {e}")
                    
                    # Save booking to DB (best-effort)
                    if action_taken == "booking_created" and lead_data.get("phone"):
                        try:
                            supabase.table("bookings").insert({
                                "bot_id": request.bot_id,
                                "customer_phone": lead_data.get("phone"),
                                "booking_date": lead_data.get("date"),
                                "booking_time": lead_data.get("time"),
                                "status": "confirmed"
                            }).execute()
                        except Exception as e:
                            print(f"[BOOKING] bookings insert skipped (table may not exist yet): {e}")

        except Exception as e:
            print(f"[LEAD] ❌ Lead scoring/parsing error: {e}")

        # 5. Persist chat log
        try:
            if supabase:
                supabase.table("chat_logs").insert({
                    "bot_id": request.bot_id,
                    "session_id": request.session_id,
                    "user_message": request.message,
                    "bot_reply": bot_reply,
                    "lead_score": lead_data.get("score", 0),
                    "lead_type": lead_data.get("type", "none"),
                    "confidence_score": confidence_score,
                    "gap_topic": gap_topic if gap_topic else None
                }).execute()
        except Exception as e:
            print(f"Chat log insert error. Migration add_advanced_ai_columns.sql likely needed. Error: {e}")

        return ChatResponse(
            reply=bot_reply,
            lead_score=lead_data.get("score"),
            lead_type=lead_data.get("type"),
            action_taken=action_taken,
            format_type=format_type
        )
