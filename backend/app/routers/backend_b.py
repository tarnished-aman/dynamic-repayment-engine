"""
Backend B routers (borrower profile + payment plans).

Leave these files in place so compile is a router include, not a rewrite.
Do not implement seasonality, NLP, hardship classification, or relief decisions here.
"""

from fastapi import APIRouter

router = APIRouter()


# GET /borrower/{id}
# GET /borrowers
# GET /borrower/{id}/payment-plan
# POST /borrower/{id}/payment-plan/override
#
# When Backend B is ready, include this router from app.main and reuse:
#   engine.repo          -> borrower records
#   engine.payments      -> InMemoryPaymentPlanGateway / SQL implementation
