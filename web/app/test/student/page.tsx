"use client";
import { useState } from "react";

export default function StudentTutor() {
  const [subject, setSubject] = useState("");
  const [quiz, setQuiz] = useState<any>(null);

  const generateQuiz = async () => {
    const res = await fetch("/api/test/student-tutor", {
      method: "POST",
      body: JSON.stringify({
        userId: "PUT-REAL-UUID",
        subject,
      }),
    });
    
    const data = await res.json();
    console.log(data);
    setQuiz(data);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">AI Private Tutor</h1>

      <input
        className="border p-2 mt-4"
        placeholder="Enter subject"
        onChange={(e) => setSubject(e.target.value)}
      />

      <button
        onClick={generateQuiz}
        className="bg-blue-500 text-white px-4 py-2 mt-4"
      >
        Generate Quiz
      </button>

      {quiz && (
        <div className="mt-6">
          <h2 className="text-xl font-bold">{quiz.title}</h2>

          {quiz.questions.map((q: any, i: number) => (
            <div key={i} className="mt-4 border p-4">
              <p>{q.question}</p>
              {q.options.map((opt: string, idx: number) => (
                <p key={idx}>• {opt}</p>
              ))}
              <p className="text-sm text-gray-500">
                Difficulty: {q.difficulty}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
