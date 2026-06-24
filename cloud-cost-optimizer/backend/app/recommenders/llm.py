import json
import os

import anthropic

from app.models import Recommendation, UtilizationProfile

SYSTEM_PROMPT = """You are a cloud cost optimization analyst. Given a list of resource \
utilization profiles (EC2 instances, Kubernetes workloads, storage volumes), recommend \
cost-saving actions: rightsizing, reserved instance / savings plan purchases, or idle \
resource cleanup.

Respond with a JSON array. Each element must have exactly these fields:
resource_id, kind, action, rationale, estimated_monthly_savings_usd, confidence (0-1).
Only recommend actions that are clearly justified by the data provided. Do not invent \
resources that aren't in the input."""


def _client() -> anthropic.Anthropic:
    return anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])


def recommend(profiles: list[UtilizationProfile]) -> list[Recommendation]:
    """Ask the LLM for prioritized cost-saving recommendations given utilization data."""
    if not profiles:
        return []

    model = os.environ.get("LLM_MODEL", "claude-sonnet-4-6")
    payload = [p.model_dump() for p in profiles]

    response = _client().messages.create(
        model=model,
        max_tokens=4096,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": json.dumps(payload)}],
    )

    raw_text = response.content[0].text
    recommendations_data = json.loads(raw_text)
    return [Recommendation(**item) for item in recommendations_data]
