"use client";

import { useEffect, useState } from "react";

export default function RecommendationsPage() {
  const [lessons, setLessons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
    
  useEffect(() => {
    const fetchRecommendations = async () => {
      const res = await fetch("/api/test/rec");
      const data = await res.json();
      setLessons(data);
      setLoading(false);
    };

    fetchRecommendations();
  }, []);

  return (
    <div style={{ padding: "2rem", maxWidth: 800 }}>
      <h1>Recommended Lessons</h1>

      {loading && <p>Loading...</p>}

      {lessons.map((lesson) => (
        <div key={lesson.id} style={{ marginBottom: "1rem" }}>
          <h3>{lesson.title}</h3>
          <p>Difficulty: {lesson.difficulty}</p>
        </div>
      ))}
    </div>
  );
}
