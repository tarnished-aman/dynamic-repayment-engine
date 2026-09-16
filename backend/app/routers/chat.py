from fastapi import APIRouter

from app.schemas import ChatMessageRequest
from app.services.engine import engine

router = APIRouter()


@router.post("/chat/message")
def post_chat_message(payload: ChatMessageRequest):
    return engine.handle_message(payload)


@router.get("/chat/history/{borrower_id}")
def get_chat_history(borrower_id: str):
    return engine.chat_history(borrower_id)
