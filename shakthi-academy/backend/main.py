import os
import json
import fitz  # PyMuPDF
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

# Allow CORS for local dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

NVIDIA_API_KEY = os.getenv("NVIDIA_API_KEY")
client = OpenAI(
    base_url="https://integrate.api.nvidia.com/v1",
    api_key=NVIDIA_API_KEY
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

    if not NVIDIA_API_KEY:
        raise HTTPException(status_code=500, detail="NVIDIA_AUTH_ERROR: API key missing")

    try:
        content = await file.read()
        pages = extract_text_from_pdf(content)
        
        # Check if PDF contains selectable text
        total_text = sum(len(p["text"].strip()) for p in pages)
        if total_text < 50:
            raise HTTPException(status_code=400, detail="PDF_EXTRACTION_ERROR: No selectable text found (Scanned PDFs not supported yet).")

        chunks = chunk_pages(pages)
        all_questions = []

        for chunk in chunks:
            chunk_text = ""
            for p in chunk:
                chunk_text += f"\n--- PAGE {p['page_number']} ---\n{p['text']}\n"
            
            try:
                response = client.chat.completions.create(
                    model="meta/llama-3.1-70b-instruct",
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
            model="meta/llama-3.1-70b-instruct",
            messages=[{"role": "user", "content": req.prompt}],
            temperature=0.3,
            max_tokens=2000,
        )
        
        output = response.choices[0].message.content
        return {"success": True, "text": output}
    except Exception as e:
        err_str = str(e).lower()
        if "429" in err_str or "rate limit" in err_str:
            raise HTTPException(status_code=429, detail="NVIDIA_RATE_LIMIT")
        raise HTTPException(status_code=500, detail=f"NVIDIA_API_ERROR: {str(e)}")
