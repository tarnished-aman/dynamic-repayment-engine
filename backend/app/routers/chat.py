from fastapi import APIRouter, Request

import app.services.engine as engine_module

from app.errors import api_error
from app.schemas import ChatMessageRequest

router = APIRouter()


@router.post("/chat/message")
async def post_chat_message(request: Request):
    content_type = request.headers.get("content-type", "")
    audio_bytes: bytes | None = None
    audio_filename: str | None = None

    if "multipart/form-data" in content_type:
        form = await request.form()
        audio = form.get("audio")
        if audio is not None and hasattr(audio, "read"):
            audio_bytes = await audio.read()
            audio_filename = getattr(audio, "filename", None)
        try:
            payload = ChatMessageRequest(
                borrower_id=str(form.get("borrower_id") or ""),
                message=str(form.get("message") or ""),
                language=str(form.get("language") or "hi"),
                input_type=str(form.get("input_type") or ("voice" if audio_bytes else "text")),  # type: ignore[arg-type]
            )
        except Exception as exc:  # noqa: BLE001
            raise api_error(
                400,
                "invalid_request",
                "The request body or path parameters are invalid.",
            ) from exc
    else:
        try:
            payload = ChatMessageRequest.model_validate(await request.json())
        except Exception as exc:  # noqa: BLE001
            raise api_error(
                400,
                "invalid_request",
                "The request body or path parameters are invalid.",
            ) from exc

    return engine_module.engine.handle_message(
        payload,
        audio_bytes=audio_bytes,
        audio_filename=audio_filename,
    )


@router.get("/chat/history/{borrower_id}")
def get_chat_history(borrower_id: str):
    return engine_module.engine.chat_history(borrower_id)
