"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// ───── Types ─────

type LessonData = {
  id: string;
  position: number;
  title: string;
  description: string | null;
  lessonType: "QUIZ" | "YES_NO" | "SHORT_ANSWER";
  difficulty: number;
  xpReward: number;
};

type LessonContent = {
  question: string;
  options?: string[];
  // Note: correctAnswer is NOT sent to students via GET
  keywords?: string[];
};

type AchievementInfo = {
  id: string;
  name: string;
  description: string;
  iconUrl: string | null;
};

type GamificationResult = {
  newLevel: number;
  previousLevel: number;
  leveledUp: boolean;
  currentStreak: number;
  longestStreak: number;
  newAchievements: AchievementInfo[];
};

type AttemptResult = {
  attempt: {
    id: string;
    isCorrect: boolean;
    score: number;
    identifiedWeaknesses: string[];
  };
  completion: { id: string; xpAwarded: number } | null;
  gamification: GamificationResult | null;
  explanation: string | null;
};

const DIFFICULTY_LABELS = ["", "Easy", "Medium", "Hard"];

// ───── Component ─────

export function LessonAttemptClient({ lessonId }: { lessonId: string }) {
  const [lesson, setLesson] = useState<LessonData | null>(null);
  const [content, setContent] = useState<LessonContent | null>(null);
  const [trackId, setTrackId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Answer state
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [yesNoAnswer, setYesNoAnswer] = useState<boolean | null>(null);
  const [shortAnswer, setShortAnswer] = useState("");

  // Submission
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<AttemptResult | null>(null);

  // ───── Fetch lesson ─────

  useEffect(() => {
    async function fetchLesson() {
      try {
        // We need to find which track this lesson belongs to.
        // The lesson API requires trackId. We'll use a search approach:
        // Try fetching from the attempt API info — actually, the GET lessons endpoint
        // requires trackId. Let's work around this by having an API that returns
        // lesson data given just lessonId.
        //
        // For now, we'll fetch the lesson content by looking it up from the attempts API.
        // Actually the GET /api/tracks/[trackId]/lessons already includes content for students
        // (without answers). But we don't have trackId here.
        //
        // Let's add a simple fetch: the student can get lesson info from the attempt endpoint.
        // We need a dedicated GET endpoint. Let's just call the attempts endpoint
        // which will validate access. But we need content to display.
        //
        // WORKAROUND: Call GET /api/lessons/[lessonId] which we'll create as a simple getter.
        const res = await fetch(`/api/lessons/${lessonId}`);
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Failed to load lesson");
          return;
        }

        setLesson(data.lesson);
        setContent(data.content);
        setTrackId(data.trackId);
      } catch {
        setError("Something went wrong");
      } finally {
        setLoading(false);
      }
    }
    fetchLesson();
  }, [lessonId]);

  // ───── Submit answer ─────

  const handleSubmit = async () => {
    let userAnswer: unknown;

    if (lesson?.lessonType === "QUIZ") {
      if (selectedOption === null) return;
      userAnswer = selectedOption;
    } else if (lesson?.lessonType === "YES_NO") {
      if (yesNoAnswer === null) return;
      userAnswer = yesNoAnswer;
    } else if (lesson?.lessonType === "SHORT_ANSWER") {
      if (!shortAnswer.trim()) return;
      userAnswer = shortAnswer.trim();
    }

    setSubmitting(true);

    try {
      const res = await fetch(`/api/lessons/${lessonId}/attempts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userAnswer }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to submit");
        return;
      }

      setResult(data);
    } catch {
      setError("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  // ───── Try again ─────

  const handleTryAgain = () => {
    setResult(null);
    setSelectedOption(null);
    setYesNoAnswer(null);
    setShortAnswer("");
    setError(null);
  };

  // ───── Render ─────

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-12 rounded-lg border bg-muted animate-pulse" />
        <div className="h-60 rounded-lg border bg-muted animate-pulse" />
      </div>
    );
  }

  if (error && !result) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center space-y-3">
        <p className="text-muted-foreground">{error}</p>
        <Button variant="outline" size="sm" onClick={() => window.history.back()}>
          Go Back
        </Button>
      </div>
    );
  }

  if (!lesson || !content) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
        Lesson not found.
      </div>
    );
  }

  // ───── Result View ─────

  if (result) {
    const { attempt, completion, gamification, explanation } = result;

    return (
      <div className="space-y-6">
        {/* Result card */}
        <div
          className={`rounded-lg border-2 p-6 text-center space-y-3 ${
            attempt.isCorrect
              ? "border-green-300 bg-green-50"
              : "border-red-300 bg-red-50"
          }`}
        >
          <p className="text-3xl">{attempt.isCorrect ? "🎉" : "❌"}</p>
          <h3 className="text-xl font-semibold">
            {attempt.isCorrect ? "Correct!" : "Not quite right"}
          </h3>
          <p className="text-sm text-muted-foreground">
            Score: {attempt.score}%
          </p>
          {completion && (
            <p className="text-sm font-medium text-green-600">
              +{completion.xpAwarded} XP earned!
            </p>
          )}
        </div>

        {/* Level Up Celebration */}
        {gamification?.leveledUp && (
          <div className="rounded-lg border-2 border-amber-300 bg-amber-50 p-5 text-center space-y-2">
            <p className="text-3xl">🏆</p>
            <h3 className="text-lg font-bold text-amber-800">Level Up!</h3>
            <p className="text-sm text-amber-700">
              Level {gamification.previousLevel} → Level {gamification.newLevel}
            </p>
          </div>
        )}

        {/* Streak */}
        {gamification && gamification.currentStreak > 0 && (
          <div className="flex items-center justify-center gap-2 py-2">
            <span className="text-lg">🔥</span>
            <span className="text-sm font-medium">
              {gamification.currentStreak} day streak
              {gamification.currentStreak >= gamification.longestStreak &&
                gamification.currentStreak > 1 &&
                " — New record!"}
            </span>
          </div>
        )}

        {/* New Achievements */}
        {gamification?.newAchievements && gamification.newAchievements.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide text-center">
              New Achievements Unlocked
            </p>
            <div className="space-y-2">
              {gamification.newAchievements.map((ach) => (
                <div
                  key={ach.id}
                  className="flex items-center gap-3 rounded-lg border border-purple-200 bg-purple-50 px-4 py-3"
                >
                  <span className="text-2xl shrink-0">{ach.iconUrl ?? "🏅"}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-purple-900">{ach.name}</p>
                    <p className="text-xs text-purple-700">{ach.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Explanation */}
        {explanation && (
          <div className="rounded-lg border p-4 bg-card">
            <p className="text-sm font-medium mb-1">Explanation</p>
            <p className="text-sm text-muted-foreground">{explanation}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          {!attempt.isCorrect && (
            <Button onClick={handleTryAgain}>Try Again</Button>
          )}
          {trackId && (
            <Button
              variant={attempt.isCorrect ? "default" : "outline"}
              onClick={() => (window.location.href = `/student/tracks/${trackId}`)}
            >
              {attempt.isCorrect ? "Back to Track" : "Return to Track"}
            </Button>
          )}
        </div>
      </div>
    );
  }

  // ───── Question View ─────

  return (
    <div className="space-y-6">
      {/* Lesson header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">
            Lesson {lesson.position}
          </span>
          <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">
            {DIFFICULTY_LABELS[lesson.difficulty]}
          </span>
          <span className="text-xs text-muted-foreground">
            {lesson.xpReward} XP
          </span>
        </div>
        <h2 className="text-xl font-semibold">{lesson.title}</h2>
        {lesson.description && (
          <p className="text-muted-foreground mt-1 text-sm">{lesson.description}</p>
        )}
      </div>

      {/* Question */}
      <div className="rounded-lg border p-5 bg-card space-y-5">
        <p className="font-medium">{content.question}</p>

        {/* Quiz options */}
        {lesson.lessonType === "QUIZ" && content.options && (
          <div className="space-y-2">
            {content.options.map((opt, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setSelectedOption(i)}
                className={`w-full text-left px-4 py-3 rounded-md border text-sm transition-colors ${
                  selectedOption === i
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "hover:bg-muted/50"
                }`}
              >
                <span className="font-medium mr-2">
                  {String.fromCharCode(65 + i)}.
                </span>
                {opt}
              </button>
            ))}
          </div>
        )}

        {/* Yes/No */}
        {lesson.lessonType === "YES_NO" && (
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setYesNoAnswer(true)}
              className={`flex-1 py-3 rounded-md border text-sm font-medium transition-colors ${
                yesNoAnswer === true
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "hover:bg-muted/50"
              }`}
            >
              Yes
            </button>
            <button
              type="button"
              onClick={() => setYesNoAnswer(false)}
              className={`flex-1 py-3 rounded-md border text-sm font-medium transition-colors ${
                yesNoAnswer === false
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "hover:bg-muted/50"
              }`}
            >
              No
            </button>
          </div>
        )}

        {/* Short Answer */}
        {lesson.lessonType === "SHORT_ANSWER" && (
          <div className="space-y-2">
            <textarea
              className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
              placeholder="Type your answer here..."
              value={shortAnswer}
              onChange={(e) => setShortAnswer(e.target.value)}
            />
          </div>
        )}
      </div>

      {/* Submit */}
      <Button
        onClick={handleSubmit}
        disabled={
          submitting ||
          (lesson.lessonType === "QUIZ" && selectedOption === null) ||
          (lesson.lessonType === "YES_NO" && yesNoAnswer === null) ||
          (lesson.lessonType === "SHORT_ANSWER" && !shortAnswer.trim())
        }
        className="w-full"
        size="lg"
      >
        {submitting ? "Submitting..." : "Submit Answer"}
      </Button>
    </div>
  );
}
