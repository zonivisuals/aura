import os
import io
import json
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pypdf import PdfReader
import google.generativeai as genai

# Configure Gemini
genai.configure(api_key="AIzaSyAaVBQOzQLVYl8rwuPdPIMOIWYIW-SAuBs")

model = genai.GenerativeModel("gemini-2.5-flash")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def extract_text_from_pdf(file_bytes):
    pdf = PdfReader(io.BytesIO(file_bytes))
    text = ""
    for page in pdf.pages:
        text += page.extract_text() + "\n"
    return text

def chunk_text(text, chunk_size=2000):
    return [text[i:i+chunk_size] for i in range(0, len(text), chunk_size)]

@app.post("/generate-quiz")
async def generate_quiz(file: UploadFile = File(...)):
    contents = await file.read()

    # 1️⃣ Extract text
    text = extract_text_from_pdf(contents)

    # 2️⃣ Chunk text
    chunks = chunk_text(text)

    # 3️⃣ Use first chunk for quiz (MVP)
    context = chunks

    prompt = f"""
    Based on the following content, generate 5 multiple choice questions.

    Return STRICT JSON in this format:
    {{
      "questions": [
        {{
          "question": "Question text",
          "options": ["A", "B", "C", "D"],
          "correctAnswer": 0
        }}
      ]
    }}

    Content:
    {context}
    """

    response = model.generate_content(prompt)

    try:
        quiz_json = json.loads(response.text)
    except:
        # fallback if Gemini wraps JSON
        cleaned = response.text.strip().replace("```json", "").replace("```", "")
        quiz_json = json.loads(cleaned)

    return quiz_json


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
