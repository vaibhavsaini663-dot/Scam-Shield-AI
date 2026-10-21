import os
import re
from datetime import datetime
from typing import List, Literal

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from openai import OpenAI


# =========================================================
# CONFIGURATION
# =========================================================

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "").strip()
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-5.5").strip()

openai_client = None

if OPENAI_API_KEY:
    openai_client = OpenAI(api_key=OPENAI_API_KEY)


# =========================================================
# FASTAPI APP
# =========================================================

app = FastAPI(
    title="ScamShield AI API",
    description="AI-powered scam detection and digital safety API",
    version="1.0.0"
)


# =========================================================
# CORS
# =========================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================================
# DATA MODELS
# =========================================================

class ScanRequest(BaseModel):
    content: str = Field(..., min_length=1, max_length=10000)
    scan_type: Literal["message", "url"] = "message"


class Indicator(BaseModel):
    title: str
    description: str
    level: Literal["High Risk", "Medium Risk", "Low Risk"]


class ScanResponse(BaseModel):
    success: bool
    risk_score: int
    risk_level: Literal["Low Risk", "Medium Risk", "High Risk"]
    summary: str
    explanation: str
    indicators: List[Indicator]
    dont: List[str]
    do: List[str]
    scan_type: Literal["message", "url"]
    timestamp: str
    engine: str


# =========================================================
# TEMPORARY HISTORY
# =========================================================

scan_history = []


# =========================================================
# HELPER FUNCTIONS
# =========================================================

def calculate_risk_level(score: int) -> str:

    if score >= 70:
        return "High Risk"

    if score >= 40:
        return "Medium Risk"

    return "Low Risk"


def clean_score(score) -> int:

    try:
        score = int(score)
    except Exception:
        score = 50

    return max(0, min(100, score))


def detect_url_features(content: str):

    indicators = []
    score = 0

    url = content.strip()

    # HTTP instead of HTTPS
    if url.lower().startswith("http://"):
        score += 20

        indicators.append(
            Indicator(
                title="Insecure Connection",
                description="The URL uses HTTP instead of HTTPS.",
                level="Medium Risk"
            )
        )

    # IP address instead of domain
    ip_pattern = r"https?://(?:\d{1,3}\.){3}\d{1,3}"

    if re.search(ip_pattern, url):
        score += 25

        indicators.append(
            Indicator(
                title="IP-Based URL",
                description="The link uses an IP address instead of a normal domain.",
                level="High Risk"
            )
        )

    # URL shorteners
    shorteners = [
        "bit.ly",
        "tinyurl.com",
        "t.co",
        "is.gd",
        "cutt.ly",
        "shorturl.at"
    ]

    if any(domain in url.lower() for domain in shorteners):
        score += 25

        indicators.append(
            Indicator(
                title="Shortened URL",
                description="Shortened links can hide the final destination.",
                level="High Risk"
            )
        )

    # Suspicious URL words
    suspicious_words = [
        "login",
        "verify",
        "verification",
        "password",
        "otp",
        "account",
        "urgent",
        "free",
        "reward",
        "gift",
        "claim",
        "winner",
        "payment"
    ]

    found_words = [
        word for word in suspicious_words
        if word in url.lower()
    ]

    if found_words:
        score += min(len(found_words) * 7, 25)

        indicators.append(
            Indicator(
                title="Suspicious URL Keywords",
                description="The URL contains words commonly used in phishing or scam links.",
                level="Medium Risk"
            )
        )

    return min(score, 100), indicators


def local_message_analysis(content: str):

    text = content.lower()

    score = 10

    indicators = []

    # =====================================================
    # MONEY
    # =====================================================

    money_words = [
        "registration fee",
        "processing fee",
        "joining fee",
        "pay",
        "payment",
        "fee",
        "deposit",
        "transfer money",
        "send money",
        "₹",
        "rs.",
        "inr"
    ]

    if any(word in text for word in money_words):

        score += 25

        indicators.append(
            Indicator(
                title="Requests for Money",
                description="The message appears to request payment, a fee, or money transfer.",
                level="High Risk"
            )
        )

    # =====================================================
    # URGENCY
    # =====================================================

    urgency_words = [
        "urgent",
        "immediately",
        "act now",
        "last chance",
        "limited time",
        "within 24 hours",
        "today only",
        "account will be blocked",
        "expires today"
    ]

    if any(word in text for word in urgency_words):

        score += 20

        indicators.append(
            Indicator(
                title="Creates Urgency",
                description="Urgent language may pressure you into making a quick decision.",
                level="High Risk"
            )
        )

    # =====================================================
    # OTP / PASSWORD
    # =====================================================

    sensitive_words = [
        "otp",
        "one time password",
        "password",
        "pin",
        "cvv",
        "bank details",
        "card number"
    ]

    if any(word in text for word in sensitive_words):

        score += 25

        indicators.append(
            Indicator(
                title="Requests Sensitive Information",
                description="The message asks for information that should normally remain private.",
                level="High Risk"
            )
        )

    # =====================================================
    # FAKE REWARD
    # =====================================================

    reward_words = [
        "you won",
        "winner",
        "lottery",
        "free gift",
        "cash prize",
        "congratulations",
        "reward"
    ]

    if any(word in text for word in reward_words):

        score += 15

        indicators.append(
            Indicator(
                title="Unusual Reward",
                description="The message promises an unexpected reward or prize.",
                level="Medium Risk"
            )
        )

    # =====================================================
    # JOB / INTERNSHIP
    # =====================================================

    job_words = [
        "internship",
        "job offer",
        "work from home",
        "selected for job",
        "selected for internship"
    ]

    if any(word in text for word in job_words):

        if any(word in text for word in money_words):

            score += 20

            indicators.append(
                Indicator(
                    title="Possible Fake Recruitment",
                    description="The message combines a job/internship offer with a payment request.",
                    level="High Risk"
                )
            )

    # =====================================================
    # LINKS
    # =====================================================

    if re.search(r"https?://", text):

        score += 15

        indicators.append(
            Indicator(
                title="Suspicious Link",
                description="The message contains a link that should be verified before opening.",
                level="Medium Risk"
            )
        )

    # =====================================================
    # IMPERSONATION
    # =====================================================

    impersonation_words = [
        "official",
        "government",
        "bank",
        "support team",
        "customer care",
        "hr department",
        "security team"
    ]

    if any(word in text for word in impersonation_words):

        score += 10

        indicators.append(
            Indicator(
                title="Possible Impersonation",
                description="The sender may be presenting itself as a trusted organization or department.",
                level="Medium Risk"
            )
        )

    score = min(score, 100)

    # If nothing suspicious was detected
    if not indicators:

        indicators.append(
            Indicator(
                title="No Major Warning Signs",
                description="No strong scam indicators were detected by the basic analysis.",
                level="Low Risk"
            )
        )

    return score, indicators


def default_actions():

    dont = [
        "Don't send money",
        "Don't share passwords, OTPs or banking information",
        "Don't click suspicious links",
        "Don't download unexpected attachments"
    ]

    do = [
        "Verify the organization through its official website",
        "Contact the organization through official channels",
        "Report suspicious messages when possible",
        "Take time to verify before taking action"
    ]

    return dont, do


# =========================================================
# AI ANALYSIS
# =========================================================

def analyze_with_ai(content: str, scan_type: str):

    if not openai_client:
        return None

    instructions = """
You are ScamShield AI, a digital safety assistant.

Analyze the provided message or URL for common scam indicators.

You are NOT a law enforcement or financial authority.
Do not claim certainty that something is a scam.
Use cautious language.

Return ONLY valid JSON with this exact structure:

{
  "risk_score": 0,
  "risk_level": "Low Risk",
  "summary": "short summary",
  "explanation": "clear explanation",
  "indicators": [
    {
      "title": "indicator title",
      "description": "short explanation",
      "level": "High Risk"
    }
  ],
  "dont": [
    "action"
  ],
  "do": [
    "action"
  ]
}

Rules:

risk_score must be an integer from 0 to 100.

0-39 = Low Risk
40-69 = Medium Risk
70-100 = High Risk

Focus on:
- payment requests
- OTP/password requests
- suspicious links
- urgency
- impersonation
- fake jobs/internships
- unrealistic rewards
- requests for personal information
- suspicious account warnings

Keep explanations understandable for students and ordinary internet users.
"""

    user_input = f"""
Scan type: {scan_type}

Content:
{content}
"""

    try:

        response = openai_client.responses.create(
            model=OPENAI_MODEL,
            instructions=instructions,
            input=user_input,
            temperature=0.2,
            max_output_tokens=1200
        )

        raw = response.output_text.strip()

        # Remove markdown code fences if model adds them
        raw = raw.replace("```json", "")
        raw = raw.replace("```", "")
        raw = raw.strip()

        import json

        data = json.loads(raw)

        score = clean_score(data.get("risk_score", 50))

        level = calculate_risk_level(score)

        indicators = []

        for item in data.get("indicators", []):

            try:

                item_level = item.get(
                    "level",
                    "Medium Risk"
                )

                if item_level not in [
                    "High Risk",
                    "Medium Risk",
                    "Low Risk"
                ]:
                    item_level = "Medium Risk"

                indicators.append(
                    Indicator(
                        title=str(
                            item.get(
                                "title",
                                "Suspicious Pattern"
                            )
                        ),
                        description=str(
                            item.get(
                                "description",
                                "Potential warning sign detected."
                            )
                        ),
                        level=item_level
                    )
                )

            except Exception:
                continue

        if not indicators:
            indicators.append(
                Indicator(
                    title="AI Analysis Completed",
                    description="No specific warning indicator was returned.",
                    level="Low Risk"
                )
            )

        dont = data.get("dont", [])
        do = data.get("do", [])

        if not dont or not do:
            dont, do = default_actions()

        return {
            "risk_score": score,
            "risk_level": level,
            "summary": str(
                data.get(
                    "summary",
                    "Analysis completed."
                )
            ),
            "explanation": str(
                data.get(
                    "explanation",
                    "The content was analyzed for common scam patterns."
                )
            ),
            "indicators": indicators,
            "dont": dont[:6],
            "do": do[:6],
            "engine": "OpenAI AI"
        }

    except Exception as error:

        print("AI analysis failed:", error)

        return None


# =========================================================
# MAIN ANALYSIS
# =========================================================

def perform_analysis(content: str, scan_type: str):

    # First run local analysis
    if scan_type == "url":

        local_score, local_indicators = detect_url_features(
            content
        )

    else:

        local_score, local_indicators = local_message_analysis(
            content
        )

    # Then try AI
    ai_result = analyze_with_ai(
        content,
        scan_type
    )

    # =====================================================
    # AI AVAILABLE
    # =====================================================

    if ai_result:

        # Combine local security signals with AI.
        # Give AI more weight but don't ignore local rules.

        final_score = max(
            ai_result["risk_score"],
            local_score
        )

        final_score = clean_score(final_score)

        final_level = calculate_risk_level(
            final_score
        )

        existing_titles = {
            item.title
            for item in ai_result["indicators"]
        }

        for item in local_indicators:

            if item.title not in existing_titles:

                ai_result["indicators"].append(
                    item
                )

        ai_result["risk_score"] = final_score
        ai_result["risk_level"] = final_level

        return ai_result

    # =====================================================
    # LOCAL FALLBACK
    # =====================================================

    dont, do = default_actions()

    score = local_score

    level = calculate_risk_level(score)

    if level == "High Risk":

        summary = (
            "Multiple warning signs commonly associated "
            "with online scams were detected."
        )

        explanation = (
            "The content contains patterns that may indicate "
            "a scam, such as requests for money, urgency, "
            "sensitive information, suspicious links, or "
            "possible impersonation. Verify the sender or "
            "organization independently before taking action."
        )

    elif level == "Medium Risk":

        summary = (
            "Some potentially suspicious patterns were detected."
        )

        explanation = (
            "The content contains one or more warning signs. "
            "This does not prove that it is a scam, but you "
            "should verify the sender and information before "
            "clicking links, sharing information, or making payments."
        )

    else:

        summary = (
            "No major scam indicators were detected."
        )

        explanation = (
            "The basic analysis did not find strong scam "
            "patterns. However, ScamShield AI cannot guarantee "
            "that content is safe, so verify important requests "
            "through trusted channels."
        )

    return {
        "risk_score": score,
        "risk_level": level,
        "summary": summary,
        "explanation": explanation,
        "indicators": local_indicators,
        "dont": dont,
        "do": do,
        "engine": "ScamShield Local Detection"
    }


# =========================================================
# ROUTES
# =========================================================

@app.get("/")
def root():

    return {
        "name": "ScamShield AI",
        "status": "online",
        "message": "ScamShield AI backend is running."
    }


@app.get("/api/health")
def health():

    return {
        "status": "healthy",
        "ai_enabled": openai_client is not None,
        "model": OPENAI_MODEL if openai_client else None
    }


@app.post("/api/analyze", response_model=ScanResponse)
def analyze(request: ScanRequest):

    content = request.content.strip()

    if not content:

        raise HTTPException(
            status_code=400,
            detail="Content cannot be empty."
        )

    if len(content) > 10000:

        raise HTTPException(
            status_code=400,
            detail="Content is too long."
        )

    result = perform_analysis(
        content,
        request.scan_type
    )

    timestamp = datetime.now().isoformat()

    response = ScanResponse(
        success=True,
        risk_score=result["risk_score"],
        risk_level=result["risk_level"],
        summary=result["summary"],
        explanation=result["explanation"],
        indicators=result["indicators"],
        dont=result["dont"],
        do=result["do"],
        scan_type=request.scan_type,
        timestamp=timestamp,
        engine=result["engine"]
    )

    # Store small history
    scan_history.insert(
        0,
        {
            "content": content[:120],
            "risk_score": response.risk_score,
            "risk_level": response.risk_level,
            "scan_type": response.scan_type,
            "timestamp": timestamp
        }
    )

    # Keep only latest 20
    del scan_history[20:]

    return response


@app.get("/api/history")
def history():

    return {
        "success": True,
        "history": scan_history
    }