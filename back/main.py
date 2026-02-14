import os
import io
import json
import logging
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pypdf import PdfReader
import google.generativeai as genai
import asyncpg
from pydantic import BaseModel
from uuid import UUID

# Configure Gemini
genai.configure(api_key="AIzaSyAaVBQOzQLVYl8rwuPdPIMOIWYIW-SAuBs")
model = genai.GenerativeModel("gemini-2.5-flash")

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

DATABASE_URL = "postgresql://postgres.haoyirmwykxakfinfmvv:Jupiter%40aura123@aws-1-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- PDF Quiz Generation ---
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

    # 3️⃣ Use all chunks for context (MVP)
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
    except Exception as e:
        logger.error(f"Error parsing JSON from Gemini response: {e}")
        cleaned = response.text.strip().replace("```json", "").replace("```", "")
        quiz_json = json.loads(cleaned)

    return quiz_json

# --- Database Connection ---
@app.on_event("startup")
async def startup():
    app.state.pool = await asyncpg.create_pool(
        DATABASE_URL,
        statement_cache_size=0
    )

# --- Recommendation Endpoint ---
@app.get("/recommendations/{user_id}")
async def recommend_tracks(user_id: UUID):
    pool = app.state.pool
    async with pool.acquire() as conn:

        # 1️⃣ Get user classes
        classes = await conn.fetch("""
            SELECT class_id
            FROM enrollments
            WHERE user_id = $1
        """, user_id)

        class_ids = [r["class_id"] for r in classes]
        if not class_ids:
            logger.info(f"No classes found for user {user_id}")
            return []

        # 2️⃣ Find students in same classes
        similar_students = await conn.fetch("""
            SELECT DISTINCT user_id
            FROM enrollments
            WHERE class_id = ANY($1::uuid[])
              AND user_id != $2
        """, class_ids, user_id)

        student_ids = [r["user_id"] for r in similar_students]
        if not student_ids:
            logger.info(f"No similar students found for user {user_id}")
            return []

        # 3️⃣ Get popular tracks among them
        tracks = await conn.fetch("""
            SELECT t.id, t.title, COUNT(*) as completions
            FROM lesson_completions lc
            JOIN lessons l ON lc.lesson_id = l.id
            JOIN tracks t ON l.track_id = t.id
            WHERE lc.user_id = ANY($1::uuid[])
              AND t.id NOT IN (
                  SELECT DISTINCT t2.id
                  FROM lesson_completions lc2
                  JOIN lessons l2 ON lc2.lesson_id = l2.id
                  JOIN tracks t2 ON l2.track_id = t2.id
                  WHERE lc2.user_id = $2
              )
            GROUP BY t.id, t.title
            ORDER BY completions DESC
            LIMIT 5
        """, student_ids, user_id)

        return [dict(r) for r in tracks]

# --- AI Student Tutor ---
class TutorRequest(BaseModel):
    subject: str

@app.post("/ai/student-tutor/{user_id}")
async def student_tutor(user_id: UUID, body: TutorRequest):
    pool = app.state.pool
    async with pool.acquire() as conn:
        attempts = await conn.fetch("""
            SELECT identified_weaknesses
            FROM lesson_attempts
            WHERE user_id = $1
        """, user_id)

    if not attempts:
        logger.warning(f"No lesson attempts found for user {user_id}")
        return {"error": "No lesson attempts found for this student"}
    logger.info(attempts)
    # Collect all weaknesses into a single string, ignoring empty/null values
    weaknesses_list = []

    for attempt in attempts:
        w = attempt["identified_weaknesses"]
        if w:
            # If it's a list, extend; if it's a string, append
            if isinstance(w, list):
                weaknesses_list.extend([str(item) for item in w])
            else:
                weaknesses_list.append(str(w))

    weaknesses = "\n".join(weaknesses_list)
    logger.info(f"Found weaknesses for user {user_id}: {weaknesses}")

    prompt = f"""
    You are a private tutor.

    Student weaknesses:
    {weaknesses}

    Subject: {body.subject}

    Generate a quiz in STRICT JSON format:

    {{
      "title": string,
      "questions": [
        {{
          "question": string,
          "options": ["A", "B", "C", "D"],
          "correctIndex": number,
          "explanation": string,
          "difficulty": "easy|medium|hard"
        }}
      ]
    }}

    Return ONLY JSON.
    """

    try:
        response = model.generate_content(prompt)
        raw_text = response.text.strip()
        logger.info(f"Raw Gemini response: {raw_text}")

        # Clean potential markdown or code fences
        cleaned = raw_text.replace("```json", "").replace("```", "").strip()
        quiz_json = json.loads(cleaned)

    except json.JSONDecodeError as e:
        logger.error(f"JSON decoding error: {e}")
        return {
            "error": "Failed to parse quiz JSON",
            "raw_response": raw_text  # return raw response for debugging
        }
    except Exception as e:
        logger.error(f"Error generating quiz: {e}")
        return {"error": "Failed to generate quiz"}

    return quiz_json

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
