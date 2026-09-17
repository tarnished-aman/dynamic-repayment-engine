from fastapi import HTTPException


def api_error(status_code: int, error: str, message: str, extra: dict | None = None) -> HTTPException:
    payload = {
        "error": error,
        "message": message,
        "status_code": status_code,
    }
    if extra:
        payload.update(extra)
    return HTTPException(status_code=status_code, detail=payload)


def borrower_not_found() -> HTTPException:
    return api_error(
        404,
        "borrower_not_found",
        "No borrower exists with the supplied ID.",
    )


def insufficient_history() -> HTTPException:
    return api_error(
        422,
        "insufficient_history",
        "There is not enough historical data to reliably detect borrower-specific seasonality.",
    )


def nlp_failure() -> HTTPException:
    """
    Raised when the Groq (LLM) service call fails.
    The error code is kept as 'claude_api_failure' for API contract compatibility.
    """
    return api_error(
        500,
        "claude_api_failure",
        "The language-model service failed while processing the borrower message.",
        extra={"fallback_action": "escalated"},
    )
