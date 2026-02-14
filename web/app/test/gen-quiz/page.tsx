"use client";

import { useState } from "react";

export default function TestPage() {
  const [file, setFile] = useState<File | null>(null);
  const [quiz, setQuiz] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/test/quiz-gen", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      setQuiz(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "2rem", maxWidth: 800 }}>
      <h1>Upload PDF to Generate Quiz</h1>

      <input
        type="file"
        accept="application/pdf"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />

      <button onClick={handleUpload} disabled={loading}>
        {loading ? "Generating..." : "Generate Quiz"}
      </button>

      {quiz && (
        <div style={{ marginTop: "2rem" }}>
          <h2>Generated Quiz</h2>
          {quiz.questions?.map((q: any, index: number) => (
            <div key={index} style={{ marginBottom: "1rem" }}>
              <p><strong>{index + 1}. {q.question}</strong></p>
              {q.options?.map((opt: string, i: number) => (
                <p key={i}>- {opt}</p>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
