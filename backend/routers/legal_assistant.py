import logging
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends

from auth import get_current_user_id
from config import settings
from database import get_db
from models import LegalAssistantRequest, LegalAssistantResponse

logger = logging.getLogger(__name__)

HTTPX_AVAILABLE = False
try:
    import httpx

    HTTPX_AVAILABLE = True
except ImportError:
    pass

HF_MODEL = "mistralai/Mistral-7B-Instruct-v0.3"
HF_API_URL = "https://router.huggingface.co/v1/chat/completions"

router = APIRouter(prefix="/api", tags=["legal-assistant"])

# ---------------------------------------------------------------------------
# Document-type detection
# ---------------------------------------------------------------------------

_DOC_KEYWORDS = {
    "fir": ["fir", "first information report", "police report", "police complaint"],
    "notice": ["legal notice", "cease and desist", "platform hosting", "hosting synthetic"],
    "complaint": ["civil complaint", "complaint for damages", "civil suit", "lawsuit"],
    "dmca": ["dmca", "takedown", "takedown request", "takedown notice"],
}


def _detect_doc_type(text: str, explicit: Optional[str] = None) -> Optional[str]:
    if explicit and explicit in _DOC_KEYWORDS:
        return explicit
    lower = text.lower()
    for doc_type, keywords in _DOC_KEYWORDS.items():
        if any(kw in lower for kw in keywords):
            return doc_type
    return None


# ---------------------------------------------------------------------------
# System prompts per document type
# ---------------------------------------------------------------------------

_SYSTEM_PROMPTS: dict[str, str] = {
    "fir": (
        "You are PersonaShield AI Legal Assistant specializing in drafting First Information Reports (FIR). "
        "Generate a properly formatted FIR document with these sections:\n"
        "1. FIR HEADER — FIR number (placeholder), date, police station (placeholder)\n"
        "2. COMPLAINANT DETAILS — name, address placeholder\n"
        "3. ACCUSED — unknown person(s) / details if available\n"
        "4. DATE & TIME OF OCCURRENCE\n"
        "5. PLACE OF OCCURRENCE — online / digital platform\n"
        "6. DESCRIPTION OF OFFENCE — detailed account of deepfake-based identity impersonation\n"
        "7. APPLICABLE SECTIONS — cite relevant IPC/BNS sections (e.g., Sec 419/420 IPC for impersonation/fraud, "
        "Sec 66C/66D IT Act for identity theft, Sec 500 IPC for defamation)\n"
        "8. EVIDENCE ATTACHED — list digital evidence types\n"
        "9. PRAYER / RELIEF SOUGHT\n"
        "10. DECLARATION by complainant\n"
        "Use the analysis data provided to fill in deepfake scores and evidence details. "
        "Add a DISCLAIMER that this is a draft template and must be reviewed by a legal professional."
    ),
    "notice": (
        "You are PersonaShield AI Legal Assistant specializing in legal notices. "
        "Draft a formal legal notice with these sections:\n"
        "1. HEADER — 'LEGAL NOTICE' with date\n"
        "2. FROM — complainant details (use placeholders)\n"
        "3. TO — platform / recipient (use placeholders)\n"
        "4. SUBJECT — Re: Unauthorized use of synthetic likeness / deepfake content\n"
        "5. FACTS — describe the creation and hosting of deepfake content, reference analysis data\n"
        "6. LEGAL BASIS — cite applicable laws (IT Act Sec 66C/66D/66E, Copyright Act, Right to Privacy, "
        "GDPR Art 17 if applicable)\n"
        "7. DEMAND — specific actions demanded (content removal, account disclosure, compensation)\n"
        "8. TIMELINE — deadline for compliance (typically 15-30 days)\n"
        "9. CONSEQUENCES — legal proceedings if demands not met\n"
        "10. CLOSING & SIGNATURE block\n"
        "Use formal legal language. Add a DISCLAIMER that this is a draft and must be reviewed by a licensed attorney."
    ),
    "complaint": (
        "You are PersonaShield AI Legal Assistant specializing in civil complaints. "
        "Draft a civil complaint outline with these sections:\n"
        "1. CAPTION — Court name (placeholder), case number, parties\n"
        "2. JURISDICTION & VENUE — basis for jurisdiction\n"
        "3. PARTIES — plaintiff and defendant descriptions\n"
        "4. FACTUAL ALLEGATIONS — numbered paragraphs describing the deepfake creation, "
        "distribution, and harm caused; reference the analysis scores as evidence\n"
        "5. CAUSES OF ACTION:\n"
        "   - Count I: Right of Publicity / Personality Rights violation\n"
        "   - Count II: Defamation / False Light\n"
        "   - Count III: Intentional Infliction of Emotional Distress\n"
        "   - Count IV: Negligence (if platform)\n"
        "   - Count V: Violation of IT Act / applicable cyber law\n"
        "6. DAMAGES — types of damages sought (compensatory, punitive, injunctive relief)\n"
        "7. PRAYER FOR RELIEF — specific remedies requested\n"
        "8. VERIFICATION\n"
        "Use formal legal pleading style. Add a DISCLAIMER that this is a template outline only."
    ),
    "dmca": (
        "You are PersonaShield AI Legal Assistant specializing in DMCA takedown notices. "
        "Draft a DMCA-style takedown request with these sections:\n"
        "1. HEADER — 'DMCA TAKEDOWN NOTICE UNDER 17 U.S.C. § 512(c)'\n"
        "2. TO — platform's designated DMCA agent (placeholder)\n"
        "3. IDENTIFICATION OF COPYRIGHTED WORK — describe the original likeness/content\n"
        "4. IDENTIFICATION OF INFRINGING MATERIAL — URLs and descriptions of deepfake content\n"
        "5. CONTACT INFORMATION of the complainant\n"
        "6. GOOD FAITH STATEMENT — 'I have a good faith belief that use of the material is not authorized'\n"
        "7. ACCURACY STATEMENT — 'The information in this notification is accurate'\n"
        "8. PERJURY STATEMENT — 'Under penalty of perjury, I am authorized to act on behalf of the owner'\n"
        "9. SIGNATURE — electronic signature and date\n"
        "Also mention platform-specific reporting (if known) and reference analysis evidence. "
        "Add a DISCLAIMER that this is a draft template."
    ),
}

_DEFAULT_SYSTEM = (
    "You are PersonaShield AI Legal Assistant. "
    "Provide helpful legal guidance about deepfake-related issues. "
    "Always include a disclaimer that this is not legal advice."
)

# ---------------------------------------------------------------------------
# Template fallbacks (when LLM API is unavailable)
# ---------------------------------------------------------------------------


def _fir_fallback(context: Optional[str], identity_name: Optional[str]) -> str:
    now = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    name = identity_name or "[COMPLAINANT NAME]"
    ctx = context or "Deepfake analysis performed by PersonaShield AI"
    return f"""======================================================
                  FIRST INFORMATION REPORT (FIR)
======================================================

FIR No.: [TO BE ASSIGNED]
Date: {now}
Police Station: [POLICE STATION NAME & ADDRESS]

------------------------------------------------------
1. COMPLAINANT DETAILS
------------------------------------------------------
Name: {name}
Address: [ADDRESS]
Contact: [PHONE / EMAIL]

------------------------------------------------------
2. ACCUSED
------------------------------------------------------
Name: Unknown person(s)
Description: Individual(s) responsible for creating and/or distributing deepfake content using the complainant's identity.

------------------------------------------------------
3. DATE & TIME OF OCCURRENCE
------------------------------------------------------
Date of discovery: {now}
Approximate period of offence: [SPECIFY]

------------------------------------------------------
4. PLACE OF OCCURRENCE
------------------------------------------------------
Online / Digital platform(s): [SPECIFY PLATFORM URLs]

------------------------------------------------------
5. DESCRIPTION OF OFFENCE
------------------------------------------------------
The complainant states that their facial likeness and/or voice has been used without authorization to create synthetic (deepfake) media. The PersonaShield AI analysis system has confirmed:

{ctx}

This constitutes impersonation, identity theft, and potential fraud using AI-generated synthetic media.

------------------------------------------------------
6. APPLICABLE SECTIONS OF LAW
------------------------------------------------------
- Section 419 IPC — Punishment for cheating by personation
- Section 420 IPC — Cheating and dishonestly inducing delivery of property
- Section 468 IPC — Forgery for purpose of cheating
- Section 500 IPC — Defamation
- Section 66C IT Act, 2000 — Identity theft
- Section 66D IT Act, 2000 — Cheating by personation using computer resource
- Section 66E IT Act, 2000 — Violation of privacy
- Section 67/67A IT Act, 2000 — Publishing obscene material (if applicable)

------------------------------------------------------
7. EVIDENCE ATTACHED
------------------------------------------------------
- PersonaShield AI forensic analysis report
- Screenshots of deepfake content with timestamps
- Original photographs/recordings of complainant
- URL(s) where deepfake content was found
- Digital hash values of evidence files

------------------------------------------------------
8. PRAYER / RELIEF SOUGHT
------------------------------------------------------
The complainant requests:
a) Registration of FIR against the accused
b) Investigation into the creation and distribution of deepfake content
c) Seizure of devices and digital evidence
d) Identification and arrest of the accused
e) Removal of deepfake content from all platforms

------------------------------------------------------
9. DECLARATION
------------------------------------------------------
I, {name}, hereby declare that the information provided above is true and correct to the best of my knowledge and belief.

Signature: _______________
Date: {now}

======================================================
DISCLAIMER: This is a computer-generated draft template prepared by PersonaShield AI. It must be reviewed and customized by a legal professional before filing. This does not constitute legal advice.
======================================================"""


def _notice_fallback(context: Optional[str], identity_name: Optional[str]) -> str:
    now = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    name = identity_name or "[YOUR NAME]"
    ctx = context or "Analysis performed by PersonaShield AI"
    return f"""======================================================
                      LEGAL NOTICE
======================================================

Date: {now}
Ref: PSA/LN/{now}

FROM:
{name}
[YOUR ADDRESS]
[EMAIL / PHONE]

TO:
[PLATFORM NAME / CONTENT HOST]
[REGISTERED ADDRESS]
[COMPLIANCE / LEGAL DEPARTMENT EMAIL]

------------------------------------------------------
SUBJECT: Unauthorized Use of Synthetic Likeness --
         Demand for Immediate Removal and Action
------------------------------------------------------

Dear Sir/Madam,

I, {name}, am issuing this legal notice regarding unauthorized deepfake/synthetic media content hosted on your platform that uses my likeness without consent.

FACTS:
1. It has come to my attention that synthetic media depicting my facial likeness and/or voice has been created and published on your platform.
2. I have NOT authorized, consented to, or permitted the creation or distribution of such content.
3. A forensic analysis by PersonaShield AI confirms: {ctx}

LEGAL BASIS:
- Information Technology Act, 2000: Sections 66C (identity theft), 66D (cheating by personation), 66E (violation of privacy)
- Indian Penal Code: Sections 419, 420, 500
- Right to Privacy (Supreme Court of India, K.S. Puttaswamy v. Union of India)
- Copyright Act, 1957 (if applicable)
- GDPR Article 17 — Right to Erasure (if applicable)

DEMANDS:
1. Immediately remove/disable access to the infringing content within 48 HOURS
2. Provide complete details of the user/account that uploaded the content
3. Preserve all server logs and metadata related to the content
4. Confirm compliance in writing

CONSEQUENCES:
Failure to comply within 15 DAYS of receipt of this notice will compel me to:
a) File a complaint with the Cyber Crime Cell
b) Initiate civil proceedings for damages
c) Report to the appropriate IT/Grievance authority
d) Seek injunctive relief from the court

This notice is issued without prejudice to any other legal rights and remedies available to me.

Yours faithfully,

_______________
{name}
Date: {now}

======================================================
DISCLAIMER: This is a draft template generated by PersonaShield AI. It must be reviewed and customized by a licensed attorney before sending. This does not constitute legal advice.
======================================================"""


def _complaint_fallback(context: Optional[str], identity_name: Optional[str]) -> str:
    now = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    name = identity_name or "[PLAINTIFF NAME]"
    ctx = context or "Forensic analysis by PersonaShield AI"
    return f"""======================================================
         CIVIL COMPLAINT OUTLINE FOR DAMAGES
             FROM DEEPFAKE MISUSE
======================================================

IN THE COURT OF [JURISDICTION]
[DISTRICT / HIGH COURT NAME]

Case No.: [TO BE ASSIGNED]
Date: {now}

------------------------------------------------------
PARTIES
------------------------------------------------------
PLAINTIFF: {name}
           [Address]

DEFENDANT: [DEFENDANT NAME / JOHN DOE]
           [Address / Online Identity]

------------------------------------------------------
I. JURISDICTION & VENUE
------------------------------------------------------
This court has jurisdiction over the subject matter as the cause of action arose within its territorial limits. The defendant's activities have caused harm within this jurisdiction.

------------------------------------------------------
II. FACTUAL ALLEGATIONS
------------------------------------------------------
1. The plaintiff is an individual whose identity has been misused through deepfake technology.
2. The defendant(s) created and/or distributed synthetic media using the plaintiff's likeness without authorization.
3. PersonaShield AI forensic analysis confirms: {ctx}
4. The deepfake content was distributed on [PLATFORM(S)] causing reputational, emotional, and financial harm.
5. The plaintiff discovered the content on or about [DATE] and has preserved digital evidence.

------------------------------------------------------
III. CAUSES OF ACTION
------------------------------------------------------

COUNT I: VIOLATION OF RIGHT OF PUBLICITY / PERSONALITY RIGHTS
- Unauthorized commercial/malicious use of plaintiff's likeness
- Violation of right to control use of one's identity

COUNT II: DEFAMATION / FALSE LIGHT
- The deepfake content falsely portrays the plaintiff in a misleading manner
- The content has been viewed by third parties causing damage to reputation

COUNT III: INTENTIONAL INFLICTION OF EMOTIONAL DISTRESS
- The defendant's conduct was outrageous and beyond all bounds of decency
- The plaintiff has suffered severe emotional distress

COUNT IV: VIOLATION OF INFORMATION TECHNOLOGY ACT
- Section 66C: Identity theft
- Section 66D: Cheating by personation using computer resource
- Section 66E: Violation of privacy

COUNT V: NEGLIGENCE (Against Platform, if applicable)
- The platform failed to implement adequate content moderation
- The platform failed to act on takedown requests in a timely manner

------------------------------------------------------
IV. DAMAGES SOUGHT
------------------------------------------------------
1. Compensatory damages: [AMOUNT] for emotional distress, reputational harm, and financial losses
2. Punitive damages: [AMOUNT] to deter future conduct
3. Injunctive relief: Permanent removal of all deepfake content
4. Court order for disclosure of defendant's identity (if anonymous)
5. Costs of litigation and attorney's fees

------------------------------------------------------
V. PRAYER FOR RELIEF
------------------------------------------------------
WHEREFORE, the plaintiff respectfully requests this court to:
a) Award compensatory and punitive damages as pleaded
b) Grant permanent injunctive relief
c) Order the defendant to destroy all synthetic media of the plaintiff
d) Award costs of suit and attorney's fees
e) Grant such other relief as the court deems just and proper

------------------------------------------------------
VERIFICATION
------------------------------------------------------
I, {name}, verify that the contents of this complaint are true and correct to the best of my knowledge and belief.

Signature: _______________
Date: {now}
Place: [CITY]

======================================================
DISCLAIMER: This is a template outline generated by PersonaShield AI. It is NOT a filed legal document. A qualified attorney must review, customize, and file this complaint. This does not constitute legal advice.
======================================================"""


def _dmca_fallback(context: Optional[str], identity_name: Optional[str]) -> str:
    now = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    name = identity_name or "[YOUR NAME]"
    ctx = context or "Forensic analysis performed by PersonaShield AI"
    return f"""======================================================
   DMCA TAKEDOWN NOTICE UNDER 17 U.S.C. Section 512(c)
======================================================

Date: {now}

TO:
[PLATFORM NAME]
Attn: DMCA Designated Agent
[ADDRESS / EMAIL of DMCA Agent]

------------------------------------------------------
1. IDENTIFICATION OF COPYRIGHTED WORK
------------------------------------------------------
The original work being infringed upon is the likeness, image, and/or voice of the undersigned, {name}. The original authentic media is owned by and depicts the undersigned, who holds exclusive rights to their likeness and identity.

------------------------------------------------------
2. IDENTIFICATION OF INFRINGING MATERIAL
------------------------------------------------------
The following URL(s) contain unauthorized synthetic (deepfake) media created using my likeness without permission:

- URL: [INFRINGING CONTENT URL 1]
- URL: [INFRINGING CONTENT URL 2]
- Description: AI-generated synthetic media falsely depicting {name}

PersonaShield AI forensic analysis confirms: {ctx}

------------------------------------------------------
3. CONTACT INFORMATION
------------------------------------------------------
Name: {name}
Address: [YOUR ADDRESS]
Email: [YOUR EMAIL]
Phone: [YOUR PHONE]

------------------------------------------------------
4. GOOD FAITH STATEMENT
------------------------------------------------------
I have a good faith belief that the use of the material described above is not authorized by the copyright/rights owner, its agent, or the law (e.g., as a fair use).

------------------------------------------------------
5. ACCURACY STATEMENT
------------------------------------------------------
The information in this notification is accurate, and I state that I am the owner of the rights being infringed, or I am authorized to act on behalf of the owner.

------------------------------------------------------
6. PERJURY STATEMENT
------------------------------------------------------
I swear, under penalty of perjury, that I am the person whose likeness is being used without authorization, or I am authorized to act on their behalf, and that the information in this notice is accurate.

------------------------------------------------------
7. ELECTRONIC SIGNATURE
------------------------------------------------------
/s/ {name}
Date: {now}

------------------------------------------------------
ADDITIONAL PLATFORM-SPECIFIC REPORTING
------------------------------------------------------
In addition to this formal DMCA notice, consider:
- YouTube: Use the Copyright Removal Form at youtube.com/copyright_complaint_form
- Facebook/Instagram: Use the IP Reporting Form at facebook.com/help/intellectual_property
- Twitter/X: Submit via help.twitter.com/forms/dmca
- TikTok: Report via tiktok.com/legal/report/Copyright

======================================================
DISCLAIMER: This is a draft template generated by PersonaShield AI. Review by a qualified attorney is recommended before submission. Filing a false DMCA takedown notice may result in legal liability. This does not constitute legal advice.
======================================================"""


def _generic_fallback(user_message: str, context: Optional[str]) -> str:
    parts = [
        "Thank you for your question regarding deepfake-related legal matters.\n",
    ]
    if context:
        parts.append(f"Based on the analysis data provided:\n{context}\n\n")
    parts.append(
        f'Regarding your query: "{user_message}"\n\n'
        "Here are some general considerations:\n"
        "- Deepfake creation and distribution may violate laws related to fraud, identity theft, "
        "defamation, and harassment in many jurisdictions.\n"
        "- Victims of deepfake abuse may have legal remedies including civil lawsuits for damages, "
        "injunctions, and criminal complaints.\n"
        "- Preserving digital evidence (screenshots, URLs, metadata) is critical for any legal action.\n"
        "- Consulting with a qualified attorney in your jurisdiction is strongly recommended.\n\n"
        "DISCLAIMER: This information is for general educational purposes only and does not constitute "
        "legal advice. Please consult a licensed attorney for advice specific to your situation."
    )
    return "".join(parts)


_FALLBACKS = {
    "fir": _fir_fallback,
    "notice": _notice_fallback,
    "complaint": _complaint_fallback,
    "dmca": _dmca_fallback,
}

# ---------------------------------------------------------------------------
# Route
# ---------------------------------------------------------------------------


@router.post("/legal-assistant/chat", response_model=LegalAssistantResponse)
async def legal_assistant_chat(request: LegalAssistantRequest, user_id: str = Depends(get_current_user_id)):
    user_message = ""
    for msg in reversed(request.messages):
        if msg.role == "user":
            user_message = msg.content
            break

    if not user_message:
        return LegalAssistantResponse(reply="Please provide a question or message.")

    # Build context from analysis
    context: Optional[str] = None
    if request.analysis_id:
        db = await get_db()
        try:
            cursor = await db.execute(
                "SELECT deepfake_score, face_match_score, voice_match_score, llm_explanation, report_path FROM analyses WHERE id = ? AND user_id = ?",
                (request.analysis_id, user_id),
            )
            row = await cursor.fetchone()
        finally:
            await db.close()
        if row:
            parts = [f"Deepfake score: {row['deepfake_score']}%"]
            if row["face_match_score"] is not None:
                parts.append(f"Face match: {row['face_match_score']}%")
            if row["voice_match_score"] is not None:
                parts.append(f"Voice match: {row['voice_match_score']}%")
            if row["llm_explanation"]:
                parts.append(f"Analysis explanation: {row['llm_explanation']}")
            if row["report_path"]:
                parts.append(f"Report path: {row['report_path']}")
            context = ", ".join(parts)

    identity_name: Optional[str] = None
    if request.identity_id:
        db = await get_db()
        try:
            cursor = await db.execute(
                "SELECT name FROM identities WHERE id = ? AND user_id = ?",
                (request.identity_id, user_id),
            )
            row = await cursor.fetchone()
        finally:
            await db.close()
        if row:
            identity_name = row["name"]
            if context:
                context += f", Identity: {identity_name}"
            else:
                context = f"Identity: {identity_name}"

    # Detect document type
    doc_type = _detect_doc_type(user_message, request.document_type)

    # Try LLM API
    api_token = settings.HUGGINGFACE_API_TOKEN
    reply: Optional[str] = None

    if HTTPX_AVAILABLE and api_token:
        try:
            system_prompt = _SYSTEM_PROMPTS.get(doc_type, _DEFAULT_SYSTEM) if doc_type else _DEFAULT_SYSTEM
            user_content = user_message
            if doc_type:
                user_content = f"Document type: {doc_type.upper()}\n\n{user_content}"
            if context:
                user_content += f"\n\nAnalysis context: {context}"

            headers = {"Authorization": f"Bearer {api_token}"}
            payload = {
                "model": HF_MODEL,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_content},
                ],
                "max_tokens": 800,
                "temperature": 0.3,
            }
            async with httpx.AsyncClient(timeout=90.0) as client:
                resp = await client.post(HF_API_URL, headers=headers, json=payload)
            if resp.status_code == 200:
                data = resp.json()
                text = data.get("choices", [{}])[0].get("message", {}).get("content", "").strip()
                if text:
                    reply = text
            if reply is None:
                logger.warning("LLM API returned status %d, using template fallback", resp.status_code)
        except Exception as exc:
            logger.error("LLM API call failed: %s", exc)

    # Fallback to templates
    if reply is None:
        if doc_type and doc_type in _FALLBACKS:
            reply = _FALLBACKS[doc_type](context, identity_name)
        else:
            reply = _generic_fallback(user_message, context)

    return LegalAssistantResponse(reply=reply)
