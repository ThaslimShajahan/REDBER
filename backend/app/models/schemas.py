from pydantic import BaseModel
from typing import Optional, List

class ChatMessage(BaseModel):
    sender: str
    text: str

class ChatRequest(BaseModel):
    message: str
    bot_id: str
    session_id: str
    history: Optional[List[ChatMessage]] = []
    image_data: Optional[str] = None
    timezone: Optional[str] = None

class ChatResponse(BaseModel):
    reply: str
    lead_score: Optional[int] = None
    lead_type: Optional[str] = None
    action_taken: Optional[str] = None
    format_type: Optional[str] = "default"  # default | menu | steps | booking_confirm | comparison | faq | location

class IngestTextRequest(BaseModel):
    bot_id: str
    text: str
    metadata: Optional[dict] = None

class IngestUrlRequest(BaseModel):
    bot_id: str
    url: str
