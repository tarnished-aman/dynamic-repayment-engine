from datetime import datetime

from app.config import Settings, get_settings
from app.data import (
    DemoClock,
    InMemoryBorrowerRepository,
    InMemoryConversationStore,
    InMemoryPaymentPlanGateway,
)
from app.errors import borrower_not_found, insufficient_history
from app.schemas import (
    ChatMessageRequest,
    ChatMessageResponse,
    ConversationItem,
)
from app.services.assessment import build_assessment
from app.services.cashflow import analyze_cashflow, cashflow_history
from app.services.decision import decide_action, seasonal_match
from app.services.nlp import NlpService
from app.services.risk_flags import build_risk_flags
from app.services.trust_score import calculate_trust_score


class AnalysisEngine:
    """Backend A facade used by routers. Swap repository/gateway when Backend B lands."""

    def __init__(
        self,
        repo: InMemoryBorrowerRepository | None = None,
        payments: InMemoryPaymentPlanGateway | None = None,
        conversations: InMemoryConversationStore | None = None,
        nlp: NlpService | None = None,
        clock: DemoClock | None = None,
        settings: Settings | None = None,
    ):
        self.settings = settings or get_settings()
        self.repo = repo or InMemoryBorrowerRepository()
        self.payments = payments or InMemoryPaymentPlanGateway(self.repo)
        self.conversations = conversations or InMemoryConversationStore()
        self.nlp = nlp or NlpService(self.settings)
        self.clock = clock or DemoClock(self.settings)

    def require_borrower(self, borrower_id: str):
        borrower = self.repo.get_borrower(borrower_id)
        if borrower is None:
            raise borrower_not_found()
        return borrower

    def score(self, borrower_id: str):
        return calculate_trust_score(self.require_borrower(borrower_id), self.settings)

    def history(self, borrower_id: str):
        return cashflow_history(self.require_borrower(borrower_id), self.settings)

    def analysis(self, borrower_id: str):
        borrower = self.require_borrower(borrower_id)
        return analyze_cashflow(borrower, self.clock.today(), self.settings)

    def risk_flags(self, borrower_id: str):
        borrower = self.require_borrower(borrower_id)
        if len(borrower.monthly_history) < self.settings.seasonality_minimum_history_months:
            raise insufficient_history()
        analysis = analyze_cashflow(borrower, self.clock.today(), self.settings)
        return build_risk_flags(borrower, analysis, self.clock.today(), self.settings)

    def assessment(self, borrower_id: str):
        borrower = self.require_borrower(borrower_id)
        analysis = analyze_cashflow(borrower, self.clock.today(), self.settings)
        if len(borrower.monthly_history) < self.settings.seasonality_minimum_history_months:
            flags = None
        else:
            flags = build_risk_flags(borrower, analysis, self.clock.today(), self.settings)
        chats = self.conversations.list_for_borrower(borrower_id)
        latest = chats[-1] if chats else None
        if flags is None:
            from app.schemas import RiskFlagsResponse

            flags = RiskFlagsResponse(
                borrower_id=borrower_id,
                current_flag="normal",
                upcoming_flag=None,
                upcoming_flag_month=None,
                flagged_months=[],
                flag_reason="insufficient_history",
                supporting_evidence=["Not enough history for seasonality"],
            )
        return build_assessment(analysis, flags, latest)

    def chat_history(self, borrower_id: str):
        self.require_borrower(borrower_id)
        return {
            "borrower_id": borrower_id,
            "conversations": self.conversations.list_for_borrower(borrower_id),
        }

    def handle_message(
        self,
        payload: ChatMessageRequest,
        *,
        audio_bytes: bytes | None = None,
        audio_filename: str | None = None,
    ) -> ChatMessageResponse:
        borrower = self.require_borrower(payload.borrower_id)
        message = payload.message.strip()
        if audio_bytes:
            message = self.nlp.transcribe(audio_bytes, audio_filename or "audio.webm", payload.language)
        elif not message:
            from app.errors import api_error

            raise api_error(
                400,
                "invalid_request",
                "A borrower message or audio recording is required.",
            )

        nlp = self.nlp.classify(message, payload.language)
        analysis = analyze_cashflow(borrower, self.clock.today(), self.settings)

        if len(borrower.monthly_history) < self.settings.seasonality_minimum_history_months:
            from app.schemas import RiskFlagsResponse

            flags = RiskFlagsResponse(
                borrower_id=borrower.borrower_id,
                current_flag="normal",
                upcoming_flag=None,
                upcoming_flag_month=None,
                flagged_months=[],
                flag_reason="insufficient_history",
                supporting_evidence=["Not enough history for seasonality"],
            )
        else:
            flags = build_risk_flags(borrower, analysis, self.clock.today(), self.settings)

        matched, match_type, matched_flag, matched_month = seasonal_match(nlp, flags)
        action, explanation = decide_action(nlp, analysis, matched, match_type, self.settings)

        payment_updated = False
        # Decision engine never writes schedules itself. Auto-relief is a Backend B mutation.
        if action == "auto_relief":
            reason = "Temporary hardship confirmed through cash-flow analysis and emergency event assessment."
            self.payments.apply_auto_relief(
                borrower.borrower_id,
                reason,
                updated_at=self.clock.now(),
            )
            payment_updated = True

        conversation_id = f"CONV{len(self.conversations.list_for_borrower(borrower.borrower_id)) + 1:04d}"
        item = ConversationItem(
            conversation_id=conversation_id,
            timestamp=self.clock.now(),
            message=message,
            intent=nlp["intent"],
            extracted_reason=nlp["extracted_reason"],
            action_taken=action,
            seasonal_match_type=match_type,
        )
        self.conversations.append(borrower.borrower_id, item)

        return ChatMessageResponse(
            borrower_id=borrower.borrower_id,
            intent=nlp["intent"],
            extracted_reason=nlp["extracted_reason"],
            intent_confidence=nlp["intent_confidence"],
            cashflow_assessment={
                "hardship_classification": analysis.hardship_classification,
                "confidence": analysis.confidence,
            },
            matched_seasonal_flag=matched,
            seasonal_match_type=match_type,  # type: ignore[arg-type]
            matched_flag=matched_flag,  # type: ignore[arg-type]
            matched_flag_month=matched_month,
            action_taken=action,  # type: ignore[arg-type]
            decision_explanation=explanation,
            payment_plan_updated=payment_updated,
            conversation_id=conversation_id,
        )


engine = AnalysisEngine()
