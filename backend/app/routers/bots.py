from fastapi import APIRouter, Depends, UploadFile, File, Form
import json
import base64
from ..models.schemas import ChatRequest, ChatResponse, ChatMessage
from ..integrations.openai_client import transcribe_audio, generate_speech

router = APIRouter(
    prefix="/api/bots",
    tags=["bots"]
)

@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    from ..services.bot_service import BotService
    try:
        response = await BotService.process_chat(request)
        return response
    except Exception as e:
        return ChatResponse(
            reply=f"I encountered an error connecting to my persona brain. Error: {str(e)}",
            lead_score=0,
            lead_type="error",
            action_taken="none"
        )


@router.post("/voice")
async def voice_chat(
    file: UploadFile = File(...),
    bot_id: str = Form(...),
    session_id: str = Form(...),
    history: str = Form("[]")
):
    from ..services.bot_service import BotService
    try:
        # Read the audio bytes and pass to whisper
        audio_bytes = await file.read()
        file_tuple = (file.filename or "audio.webm", audio_bytes, file.content_type)
        transcript_text = await transcribe_audio(file_tuple)

        # Build history objects
        history_dicts = json.loads(history)
        history_objs = [ChatMessage(**h) for h in history_dicts]

        # Call BotService with the transcribed text
        # Overwrite the message slightly to enforce casual spoken constraints
        request = ChatRequest(
            bot_id=bot_id,
            session_id=session_id,
            message=transcript_text + " [Respond briefly in casual, conversational language appropriate for a real-time phone call. Use natural filler words occasionally. NEVER use markdown or bullet points. Avoid lists.]",
            history=history_objs
        )

        response = await BotService.process_chat(request)

        # Generate audio response
        bot_audio_bytes = await generate_speech(response.reply, "nova")
        audio_b64 = base64.b64encode(bot_audio_bytes).decode("utf-8")

        return {
            "transcript": transcript_text,
            "reply": response.reply,
            "audio_b64": audio_b64,
            "lead_score": response.lead_score,
            "lead_type": response.lead_type
        }
    except Exception as e:
        return {"error": str(e)}

@router.post("/whatsapp")
async def whatsapp_webhook(payload: dict):
    from ..services.bot_service import BotService
    try:
        # Standard WhatsApp Cloud API payload format
        entry = payload.get("entry", [{}])[0]
        changes = entry.get("changes", [{}])[0]
        value = changes.get("value", {})
        messages = value.get("messages", [])
        
        if not messages:
            return {"status": "ok", "message": "no messages parsed"}

        msg = messages[0]
        phone_number = msg.get("from")
        body = msg.get("text", {}).get("body", "")
        
        # Hardcoding a master bot ID for MVP, or extract from phone/tenant config
        bot_id = "spa_ai" 
        
        # We use their phone number as the session ID so context persists memory seamlessly
        request = ChatRequest(
            bot_id=bot_id,
            session_id=phone_number,
            message=body,
            history=[]
        )
        
        response = await BotService.process_chat(request)
        
        # Usually here you would send a POST request to Meta's API to reply.
        # e.g., requests.post("https://graph.facebook.com/v22.0/.../messages", json={"to": phone_number, "text": {"body": response.reply}})
        
        return {"status": "success", "reply": response.reply}
    except Exception as e:
        return {"status": "error", "detail": str(e)}
