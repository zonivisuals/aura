"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

// ───── Types ─────

type LessonItem = {
  id: string;
  position: number;
  title: string;
  description: string | null;
  lessonType: "QUIZ" | "YES_NO" | "SHORT_ANSWER";
  difficulty: number;
  xpReward: number;
  targetAttributes: string[];
  isCompleted: boolean;
  finalScore: number | null;
};

type TrackInfo = {
  id: string;
  name: string;
  description: string | null;
};

const TYPE_LABELS: Record<string, string> = {
  QUIZ: "Multiple Choice",
  YES_NO: "Yes / No",
  SHORT_ANSWER: "Short Answer",
};

const DIFFICULTY_LABELS = ["", "Easy", "Medium", "Hard"];
const DIFFICULTY_COLORS = [
  "",
  "bg-green-100 text-green-700",
  "bg-amber-100 text-amber-700",
  "bg-red-100 text-red-700",
];

// ───── Component ─────

export function StudentTrackClient({ trackId }: { trackId: string }) {
  const [track, setTrack] = useState<TrackInfo | null>(null);
  const [lessons, setLessons] = useState<LessonItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLessons = useCallback(async () => {
    try {
      const res = await fetch(`/api/tracks/${trackId}/lessons`);
      const data = await res.json();
      if (res.ok) {
        setTrack(data.track);
        setLessons(data.lessons);
      } else {
        setError(data.error || "Failed to load track");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [trackId]);

  useEffect(() => {
    fetchLessons();
  }, [fetchLessons]);

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-12 rounded-lg border bg-muted animate-pulse" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 rounded-lg border bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  if (error || !track) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
        {error || "Track not found"}
      </div>
    );
  }

  // Determine which lessons are unlocked
  // Lesson is unlocked if it's position 1 or all previous lessons are completed
  const isUnlocked = (lesson: LessonItem): boolean => {
    if (lesson.position === 1) return true;
    // Check all lessons with lower position are completed
    return lessons
      .filter((l) => l.position < lesson.position)
      .every((l) => l.isCompleted);
  };

  const completedCount = lessons.filter((l) => l.isCompleted).length;
  const progressPercent = lessons.length > 0 ? Math.round((completedCount / lessons.length) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Track Header */}
      <div>
        <h2 className="text-2xl font-semibold">{track.name}</h2>
        {track.description && (
          <p className="text-muted-foreground mt-1">{track.description}</p>
        )}
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Progress</span>
          <span className="font-medium">
            {completedCount}/{lessons.length} lessons · {progressPercent}%
          </span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-blue-500 transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Lesson List */}
      {lessons.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          No lessons available yet.
        </div>
      ) : (
        <div className="space-y-2">
          {lessons.map((lesson) => {
            const unlocked = isUnlocked(lesson);
            const completed = lesson.isCompleted;

            return (
              <div
                key={lesson.id}
                className={`rounded-lg border p-4 transition-colors ${
                  completed
                    ? "border-green-200 bg-green-50/50"
                    : unlocked
                      ? "hover:bg-muted/40 cursor-pointer"
                      : "opacity-50"
                }`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Status icon */}
                    <span className="w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 border">
                      {completed ? (
                        <span className="text-green-600">✓</span>
                      ) : unlocked ? (
                        <span className="text-blue-600 font-medium">{lesson.position}</span>
                      ) : (
                        <span className="text-muted-foreground">🔒</span>
                      )}
                    </span>

                    <div className="min-w-0">
                      <p className={`font-medium truncate text-sm ${!unlocked ? "text-muted-foreground" : ""}`}>
                        {lesson.title}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                          {TYPE_LABELS[lesson.lessonType]}
                        </span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${DIFFICULTY_COLORS[lesson.difficulty]}`}>
                          {DIFFICULTY_LABELS[lesson.difficulty]}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {lesson.xpReward} XP
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0">
                    {completed ? (
                      <div className="text-right">
                        <p className="text-xs text-green-600 font-medium">
                          Completed
                        </p>
                        {lesson.finalScore !== null && (
                          <p className="text-[10px] text-muted-foreground">
                            Score: {lesson.finalScore}%
                          </p>
                        )}
                      </div>
                    ) : unlocked ? (
                      <Link
                        href={`/student/lessons/${lesson.id}`}
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium h-8 px-4 bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                      >
                        Start
                      </Link>
                    ) : (
                      <span className="text-xs text-muted-foreground">Locked</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
