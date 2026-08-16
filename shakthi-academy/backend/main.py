import os
import json
import fitz  # PyMuPDF
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAI
from dotenv import load_dotenv
from payments import router as payments_router

load_dotenv()

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

NVIDIA_API_KEY = os.getenv("NVIDIA_API_KEY")
# Keep the API server online even before an AI key is configured. The extraction
# endpoints return a clear configuration error instead of crashing at startup.
client = (
    OpenAI(base_url="https://integrate.api.nvidia.com/v1", api_key=NVIDIA_API_KEY)
    if NVIDIA_API_KEY
    else None
)

SYSTEM_PROMPT = """
You are a strict data extraction AI. You MUST output ONLY valid JSON. DO NOT output any markdown, explanations, or conversational text.
Extract: question number, question text, A, B, C, D, source answer, page number.
Return ONLY JSON matching this schema:
{
  "questions": [
    {
      "question_number": 1,
      "question_text": "...",
      "options": { "A": "...", "B": "...", "C": "...", "D": "..." },
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
    """Best-effort, layout-tolerant MCQ parser for selectable-text PDFs."""
    import re
    found, seen = [], set()
    option_start = r"(?:\(?[A-Fa-f]\)?\s*[.)\]:-])"
    question_re = re.compile(
        r"(?ms)^\s*(?:Q(?:uestion)?\s*)?(\d{1,3})(?:\s*[.)\]:-]|\s{2,})(.*?)(?=^\s*(?:Q(?:uestion)?\s*)?\d{1,3}(?:\s*[.)\]:-]|\s{2,})|\Z)"
    )
    option_re = re.compile(r"(?m)^\s*\(?([A-Fa-f])\)?\s*[.)\]:-]\s*(.*)$")
    answer_re = re.compile(r"(?im)(?:answer|ans)\s*[:\-]?\s*\(?([A-F])\)?")
    for page in pages:
        text = page["text"].replace("\r", "\n")
        text = re.sub(r"(?<!^)(?<!\n)\s+(?=" + option_start + r")", "\n", text)
        for number, block in question_re.findall(text):
            options = {}
            for letter, value in option_re.findall(block):
                value = re.sub(r"\s+", " ", value).strip()
                if value: options[letter.upper()] = value
            if len(options) < 2: continue
            question = re.sub(r"\s+", " ", option_re.split(block, maxsplit=1)[0]).strip()
            identity = (question.lower(), tuple(options.items()))
            if not question or identity in seen: continue
            seen.add(identity)
            answer = answer_re.search(block)
            found.append({"question_number": int(number), "question_text": question, "options": {key: options[key] for key in sorted(options)}, "source_answer": answer.group(1) if answer else None, "page_number": page["page_number"], "extraction_method": "offline-parser"})
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
                    model="nvidia/nemotron-3.5-lightning-30b-a3b",
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

@app.post("/api/ai/chat")
async def ai_chat(req: ChatRequest):
    if not NVIDIA_API_KEY:
        raise HTTPException(status_code=500, detail="NVIDIA_AUTH_ERROR: API key missing")
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
