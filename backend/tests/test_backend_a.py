from fastapi.testclient import TestClient

from app.main import app
from app.services.engine import engine
from app.data import InMemoryBorrowerRepository, InMemoryConversationStore, InMemoryPaymentPlanGateway
from app.services.engine import AnalysisEngine


client = TestClient(app)


def test_raju_trust_score():
    response = client.get("/borrower/BOR001/score")
    assert response.status_code == 200
    body = response.json()
    assert body["trust_score"] == 72
    assert body["score_band"] == "medium_trust"
    assert [item["factor"] for item in body["score_factors"]] == [
        "utility_payments_ontime",
        "supplier_payments_consistent",
        "mobile_topup_frequency",
    ]


def test_raju_cashflow_and_risk_on_sep_16():
    analysis = client.get("/borrower/BOR001/cashflow-analysis").json()
    flags = client.get("/borrower/BOR001/risk-flags").json()

    assert analysis["income_change_pct"] == -18.2
    assert analysis["hardship_classification"] == "temporary"
    assert analysis["cashflow_status"] == "temporary_stress"
    assert analysis["repayment_consistency"] == 0.94
    assert analysis["seasonal_pattern"]["low_income_months"] == ["Oct", "Nov"]

    assert flags["current_flag"] == "normal"
    assert flags["upcoming_flag"] == "lean_season"
    assert flags["upcoming_flag_month"] == "Oct"
    assert flags["flagged_months"] == ["Oct", "Nov"]
    assert flags["analysis_basis"] == "borrower_history"


def test_farmer_without_seasonality_is_not_flagged():
    flags = client.get("/borrower/BOR003/risk-flags").json()
    assert flags["current_flag"] == "normal"
    assert flags["upcoming_flag"] is None
    assert flags["flagged_months"] == []


def test_insufficient_history_returns_422():
    response = client.get("/borrower/BOR006/risk-flags")
    assert response.status_code == 422
    assert response.json()["error"] == "insufficient_history"


def test_unknown_borrower_404():
    response = client.get("/borrower/BOR999/score")
    assert response.status_code == 404
    assert response.json()["error"] == "borrower_not_found"


def test_raju_flood_message_auto_relief():
    fresh = AnalysisEngine(
        repo=InMemoryBorrowerRepository(),
        conversations=InMemoryConversationStore(),
    )
    fresh.payments = InMemoryPaymentPlanGateway(fresh.repo)

    from app.schemas import ChatMessageRequest

    result = fresh.handle_message(
        ChatMessageRequest(
            borrower_id="BOR001",
            message="Baadh ne meri fasal barbaad kar di",
            language="hi",
            input_type="voice",
        )
    )
    assert result.intent == "emergency"
    assert result.extracted_reason == "flood destroyed crops"
    assert result.intent_confidence == 0.91
    assert result.seasonal_match_type == "upcoming"
    assert result.matched_flag == "lean_season"
    assert result.matched_flag_month == "Oct"
    assert result.action_taken == "auto_relief"
    assert result.payment_plan_updated is True

    plan = fresh.payments.get_plan("BOR001")
    statuses = {item.due_date.isoformat(): item.status for item in plan.adjusted_schedule}
    assert statuses["2026-10-01"] == "deferred"
    assert "2027-01-01" in statuses
    assert statuses["2027-01-01"] == "added"


def test_no_emergency_takes_no_action():
    from app.schemas import ChatMessageRequest

    isolated = AnalysisEngine(
        repo=InMemoryBorrowerRepository(),
        conversations=InMemoryConversationStore(),
    )
    result = isolated.handle_message(
        ChatMessageRequest(
            borrower_id="BOR001",
            message="Kal EMI bhar dunga",
            language="hi",
            input_type="text",
        )
    )
    assert result.intent == "no_emergency"
    assert result.action_taken == "none"
    assert result.payment_plan_updated is False
