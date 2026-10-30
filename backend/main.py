import os
import json
import fitz  # PyMuPDF
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAI
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()

from payments import router as payments_router
app = FastAPI()
app.include_router(payments_router)

# Allow CORS for local dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
@app.get("/health")
@app.get("/api/health")
def health_check():
    return {"status": "ok", "message": "Shakthi Academy API Backend is running"}


NVIDIA_API_KEY = os.getenv("NVIDIA_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

# Keep the API server online even before an AI key is configured. The extraction
# endpoints return a clear configuration error instead of crashing at startup.
client = (
    OpenAI(base_url="https://integrate.api.nvidia.com/v1", api_key=NVIDIA_API_KEY)
    if NVIDIA_API_KEY
    else None
)

SYSTEM_PROMPT = """
You are a strict data extraction AI for Bank and competitive exams. You MUST output ONLY valid JSON. DO NOT output any markdown, explanations, or conversational text.
Extract: question number, question text, section ("English Language" | "Reasoning Ability" | "Quantitative Aptitude"), options (A, B, C, D, and E if present), source answer, page number, and any associated passage/directions.
If the question is part of a reading comprehension, para jumble, cloze test, puzzle, seating arrangement, or data interpretation chart/table, include the full passage/directions text in the 'passage' field. Otherwise, 'passage': null.
If there are tabular data or data interpretation tables in the passage or question, format them precisely as Markdown tables in the 'passage' or 'question_text' field.

CRITICAL — Preserve ALL mathematical notation precisely:
- Squares: use ² (e.g. 15² not 15^2 or 152)
- Cubes: use ³ (e.g. 27³ not 27^3 or 273)
- Higher powers: use ⁴ ⁵ ⁶ ⁷ ⁸ ⁹ (e.g. x⁴ not x^4)
- Fractional exponents: write as ^(1/2), ^(1/3), ^(2/3), ^(1/4) etc. (e.g. (1681)^(1/2) not 1681 1/2)
- Fractions in text: use Unicode vulgar fractions where possible: ½ ⅓ ¼ ⅔ ¾ ⅕ ⅖ ⅗ ⅘ ⅙ ⅚ ⅛ ⅜ ⅝ ⅞. For other fractions like 11/7, keep as 11/7.
- Square root: use √ symbol (e.g. √25)
- Cube root: use ∛ symbol (e.g. ∛27)
- Multiplication: use × (not x or *)
- Division: use ÷ (not /)
- Do NOT drop or flatten exponents. (803.63)² must stay as (803.63)², NOT (803.63)2 or 803.632.

Return ONLY JSON matching this schema:
{
  "questions": [
    {
      "passage": "Directions (1-5): Study the following information carefully...\n\n| Months | Visitors |\n|---|---|\n| Jan | 20 |",
      "question_number": 1,
      "section": "Quantitative Aptitude",
      "question_text": "...",
      "options": { "A": "...", "B": "...", "C": "...", "D": "...", "E": "..." },
      "source_answer": null,
      "page_number": 1
    }
  ]
}
Never invent missing information. If the answer key is not present: "source_answer": null
"""

def extract_text_from_pdf(file_content: bytes):
    doc = fitz.open(stream=file_content, filetype="pdf")
    pages = []
    for page_num in range(len(doc)):
        page = doc.load_page(page_num)
        text = page.get_text("text")
        pages.append({"page_number": page_num + 1, "text": text})
    return pages

def regex_extract_questions(pages):
    """Best-effort, layout-tolerant MCQ parser for selectable-text Bank PDFs."""
    import re
    found, seen = [], set()
    option_start = r"(?:\(?[A-Fa-f1-5]\)?\s*[.)\]:-])"
    question_re = re.compile(
        r"(?ms)^\s*(?:Q(?:uestion)?\s*)?(\d{1,3})(?:\s*[.)\]:-]|\s{2,})(.*?)(?=^\s*(?:Q(?:uestion)?\s*)?\d{1,3}(?:\s*[.)\]:-]|\s{2,})|\Z)"
    )
    option_re = re.compile(r"(?m)^\s*\(?([A-Ea-e1-5])\)?\s*[.)\]:-]\s*(.*)$")
    answer_re = re.compile(r"(?im)(?:answer|ans)\s*[:\-]?\s*\(?([A-E1-5])\)?")

    def infer_sec(num, text):
        t = text.lower()
        if any(w in t for w in ["passage", "reading comprehension", "antonym", "synonym", "cloze", "para jumble", "parajumble", "grammat", "spelt"]):
            return "English Language"
        if any(w in t for w in ["puzzle", "seating arrangement", "circular table", "linear row", "syllogism", "blood relation", "direction sense"]):
            return "Reasoning Ability"
        if any(w in t for w in ["data interpretation", "bar graph", "pie chart", "simplification", "approximation", "number series", "quadratic"]):
            return "Quantitative Aptitude"
        if num <= 30: return "English Language"
        if num <= 65: return "Reasoning Ability"
        return "Quantitative Aptitude"

    for page in pages:
        text = page["text"].replace("\r", "\n")
        text = re.sub(r"(?<!^)(?<!\n)\s+(?=" + option_start + r")", "\n", text)
        for number, block in question_re.findall(text):
            options = {}
            for letter, value in option_re.findall(block):
                value = re.sub(r"\s+", " ", value).strip()
                if value:
                    key = letter.upper()
                    if key in "12345":
                        key = chr(64 + int(key))
                    options[key] = value
            if len(options) < 2: continue
            question = re.sub(r"\s+", " ", option_re.split(block, maxsplit=1)[0]).strip()
            identity = (question.lower(), tuple(sorted(options.items())))
            if not question or identity in seen: continue
            seen.add(identity)
            answer = answer_re.search(block)
            raw_ans = answer.group(1).upper() if answer else None
            if raw_ans and raw_ans in "12345":
                raw_ans = chr(64 + int(raw_ans))
            q_num = int(number)
            found.append({
                "question_number": q_num,
                "section": infer_sec(q_num, question),
                "question_text": question,
                "options": {key: options[key] for key in sorted(options)},
                "source_answer": raw_ans,
                "page_number": page["page_number"],
                "extraction_method": "offline-parser"
            })
    return found

def chunk_pages(pages):
    chunks = []
    current_chunk = []
    current_length = 0
    MAX_LEN = 20000

    for p in pages:
        if current_length + len(p["text"]) > MAX_LEN and current_chunk:
            chunks.append(current_chunk)
            current_chunk = []
            current_length = 0
        current_chunk.append(p)
        current_length += len(p["text"])
        
    if current_chunk:
        chunks.append(current_chunk)
    return chunks

@app.post("/api/ai/extract-questions")
async def extract_questions(file: UploadFile = File(...)):
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Must be a PDF file")

    try:
        content = await file.read()
        pages = extract_text_from_pdf(content)
        
        # Check if PDF contains selectable text
        total_text = sum(len(p["text"].strip()) for p in pages)
        if total_text < 50:
            raise HTTPException(status_code=400, detail="PDF_EXTRACTION_ERROR: No selectable text found (Scanned PDFs not supported yet).")

        # Allow basic MCQ extraction even when no AI key is configured.
        if not NVIDIA_API_KEY:
            offline_questions = regex_extract_questions(pages)
            if offline_questions:
                return {"success": True, "questions": offline_questions, "warning": "Extracted with offline parser; review all questions and answers before publishing."}
            raise HTTPException(status_code=503, detail="AI extraction is not configured and this PDF could not be parsed offline.")

        chunks = chunk_pages(pages)
        all_questions = []

        for chunk in chunks:
            chunk_text = ""
            for p in chunk:
                chunk_text += f"\n--- PAGE {p['page_number']} ---\n{p['text']}\n"
            
            try:
                response = client.chat.completions.create(
                    model=os.getenv("NVIDIA_MODEL", "nvidia/nemotron-3-ultra-550b-a55b"),
                    messages=[
                        {"role": "system", "content": SYSTEM_PROMPT},
                        {"role": "user", "content": chunk_text}
                    ],
                    temperature=0.3,
                    max_tokens=8000,
                    response_format={"type": "json_object"},
                )
                
                output = response.choices[0].message.content
                
                # Clean markdown fences
                cleaned = output.replace("```json", "").replace("```", "").strip()
                
                start_obj = cleaned.find("{")
                start_arr = cleaned.find("[")
                
                json_str = ""
                if start_arr != -1 and (start_obj == -1 or start_arr < start_obj):
                    json_str = cleaned[start_arr:]
                elif start_obj != -1:
                    json_str = cleaned[start_obj:]
                        
                if not json_str:
                    raise Exception("No JSON array or object found in AI response")
                    
                decoder = json.JSONDecoder()
                try:
                    data, _ = decoder.raw_decode(json_str)
                except json.JSONDecodeError as e:
                    raise Exception(f"JSON Parsing Error: {str(e)}. Response snippet: {json_str[:100]}")
                    
                if isinstance(data, dict) and "questions" in data:
                    all_questions.extend(data["questions"])
                elif isinstance(data, list):
                    all_questions.extend(data)
                
            except Exception as e:
                # Network/provider errors should not prevent simple text-based
                # question papers from being converted into a reviewable draft.
                offline_questions = regex_extract_questions(pages)
                if offline_questions:
                    return {"success": True, "questions": offline_questions, "warning": "AI unavailable; extracted with offline parser. Review before publishing."}
                err_str = str(e).lower()
                if "429" in err_str or "rate limit" in err_str:
                    raise HTTPException(status_code=429, detail="NVIDIA_RATE_LIMIT")
                raise HTTPException(status_code=500, detail=f"NVIDIA_API_ERROR: {str(e)}")

        if not all_questions:
            raise HTTPException(status_code=400, detail="NO_QUESTIONS_FOUND: AI failed to extract valid questions.")
            
        return {"success": True, "questions": all_questions}

    except HTTPException:
        raise
    except Exception as e:
        # If the provider times out or is unreachable, still try the offline
        # parser rather than failing immediately.
        try:
            fallback = regex_extract_questions(pages)
            if fallback:
                return {"success": True, "questions": fallback, "warning": "AI unavailable; extracted with offline parser. Review before publishing."}
        except Exception:
            pass
        raise HTTPException(status_code=500, detail=f"PDF_EXTRACTION_ERROR: {str(e)}")

from pydantic import BaseModel

class ChatRequest(BaseModel):
    prompt: str

class GenerateQuestionsRequest(BaseModel):
    text: str
    subject: str
    questionCount: int

@app.post("/api/ai/generate-questions")
async def generate_questions_endpoint(req: GenerateQuestionsRequest):
    key_configured = bool(GEMINI_API_KEY)
    key_prefix = GEMINI_API_KEY[:6] if GEMINI_API_KEY else "None"
    key_length = len(GEMINI_API_KEY) if GEMINI_API_KEY else 0

    print("--- DIAGNOSTICS ---")
    print(f"GEMINI CONFIGURED: {key_configured}")
    print(f"KEY PREFIX: {key_prefix}")
    print(f"KEY LENGTH: {key_length}")
    print(f"KEY SOURCE: backend (from os.getenv('GEMINI_API_KEY'))")
    print("-------------------")

    if not GEMINI_API_KEY:
        return {"error": "GEMINI_API_KEY is not configured on the backend"}

    prompt = f"""You are a highly accurate Indian Banking/Competitive Exam Question Extractor.
Extract exactly {req.questionCount} questions for the subject/category: {req.subject}.
Extract from this text chunk:
\"\"\"
{req.text}
\"\"\"

Return ONLY a JSON object matching this exact format, with no markdown fences, no backticks, and no extra text.
{{
  "questions": [
    {{
      "question": "Question text...",
      "section": "English Language",
      "options": ["Option A", "Option B", "Option C", "Option D", "Option E"],
      "correctAnswer": 0,
      "explanation": "..."
    }}
  ]
}}
"""
    try:
        model = genai.GenerativeModel("gemini-1.5-flash")
        response = model.generate_content(prompt)
        output = response.text

        # Clean markdown fences
        cleaned = output.replace("```json", "").replace("```", "").strip()
        
        start_obj = cleaned.find("{")
        if start_obj != -1:
            json_str = cleaned[start_obj:]
            data = json.loads(json_str)
            if "questions" not in data:
                return {"error": "Gemini response did not contain 'questions' array"}
            
            # Validation
            valid_questions = []
            seen_qs = set()
            for q in data["questions"]:
                if "question" not in q or not q["question"].strip():
                    continue
                if q["question"] in seen_qs:
                    continue
                if "options" not in q or not isinstance(q["options"], list) or not (4 <= len(q["options"]) <= 5):
                    continue
                if "correctAnswer" not in q or not isinstance(q["correctAnswer"], int) or not (0 <= q["correctAnswer"] < len(q["options"])):
                    continue
                seen_qs.add(q["question"])
                valid_questions.append(q)
            
            if not valid_questions:
                return {"error": "No valid questions were extracted"}
                
            return {"questions": valid_questions}
        else:
            return {"error": "Failed to parse JSON from AI response"}
    except Exception as e:
        return {
            "error": f"AI generation error: {str(e)}",
            "diagnostics": {
                "configured": key_configured,
                "prefix": key_prefix,
                "length": key_length,
                "source": "backend (from os.getenv('GEMINI_API_KEY'))"
            }
        }


@app.post("/api/ai/chat")
async def ai_chat(req: ChatRequest):
    if GEMINI_API_KEY:
        try:
            model = genai.GenerativeModel("gemini-1.5-flash")
            response = model.generate_content(req.prompt)
            return {"success": True, "text": response.text}
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"GEMINI_API_ERROR: {str(e)}")
    elif NVIDIA_API_KEY:
        try:
            response = client.chat.completions.create(
                model="nvidia/nemotron-3.5-lightning-30b-a3b",
                messages=[{"role": "user", "content": req.prompt}],
                temperature=0.1,
                max_tokens=2000,
                response_format={"type": "json_object"},
            )
            
            output = response.choices[0].message.content
            return {"success": True, "text": output}
        except Exception as e:
            err_str = str(e).lower()
            if "429" in err_str or "rate limit" in err_str:
                raise HTTPException(status_code=429, detail="NVIDIA_RATE_LIMIT")
            raise HTTPException(status_code=500, detail=f"NVIDIA_API_ERROR: {str(e)}")
    else:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY or NVIDIA_API_KEY is missing on backend")
