from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, RedirectResponse

from app.routers import analysis, backend_b, chat

# Ensure SQLite tables exist before the first request (Backend Support's DB layer).
try:
    from database import init_db
    init_db()
except Exception:  # noqa: BLE001 — don't crash the app if DB setup fails at import time
    pass

app = FastAPI(
    title="Dynamic Risk & Repayment Engine",
    version="3.0",
    description="Backend A: trust score, cash-flow, seasonality, NLP, and decision engine.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(HTTPException)
async def http_exception_handler(_request: Request, exc: HTTPException):
    if isinstance(exc.detail, dict) and "error" in exc.detail:
        return JSONResponse(status_code=exc.status_code, content=exc.detail)
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": "request_failed",
            "message": str(exc.detail),
            "status_code": exc.status_code,
        },
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(_request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=400,
        content={
            "error": "invalid_request",
            "message": "The request body or path parameters are invalid.",
            "status_code": 400,
        },
    )


app.include_router(analysis.router)
app.include_router(chat.router)
app.include_router(backend_b.router)


@app.get("/", include_in_schema=False)
def root():
    """Redirect browser / curl requests to the interactive API docs."""
    return RedirectResponse(url="/docs")
