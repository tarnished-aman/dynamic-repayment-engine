from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.routers import analysis, chat

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

# Backend B endpoints: borrower profile, borrower list, payment plan, and override
from app.routers import backend_b  # noqa: E402
app.include_router(backend_b.router)
