"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

// ───── Types ─────

type Stats = {
  totalAttempts: number;
  correctAttempts: number;
  totalCompletions: number;
  avgScore: number;
  level: number;
  currentXp: number;
  xpForCurrentLevel: number;
  xpForNextLevel: number;
  progressPercent: number;
  currentStreak: number;
  longestStreak: number;
};

type ScorePoint = {
  date: string;
  score: number;
  isCorrect: boolean | null;
  lessonTitle: string;
};

type Weakness = { attribute: string; occurrences: number };

type LessonScore = {
  lessonId: string;
  title: string;
  avgScore: number;
  attempts: number;
};

type AttemptHistoryItem = {
  id: string;
  lessonId: string;
  lessonTitle: string;
  trackName: string;
  subjectName: string;
  lessonType: string;
  difficulty: number;
  question: string;
  userAnswer: unknown;
  isCorrect: boolean | null;
  score: number | null;
  timeSpentSeconds: number | null;
  identifiedWeaknesses: string[];
  attemptedAt: string;
};

type PerformanceData = {
  stats: Stats;
  scoreTimeline: ScorePoint[];
  weaknesses: Weakness[];
  perLessonScores: LessonScore[];
  attemptHistory: AttemptHistoryItem[];
};

const DIFF_LABELS = ["", "Easy", "Medium", "Hard"];
const TYPE_LABELS: Record<string, string> = {
  QUIZ: "Quiz",
  YES_NO: "Yes/No",
  SHORT_ANSWER: "Short Answer",
};

// ───── Component ─────

export function StudentPerformanceClient() {
  const [data, setData] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"charts" | "history">("charts");

  useEffect(() => {
    async function fetchPerformance() {
      try {
        const res = await fetch("/api/analytics/student/performance");
        const json = await res.json();
        if (res.ok) setData(json);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    fetchPerformance();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-32 rounded-lg bg-muted animate-pulse" />
        <div className="h-64 rounded-lg bg-muted animate-pulse" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
        Could not load performance data.
      </div>
    );
  }

  const { stats, scoreTimeline, weaknesses, perLessonScores, attemptHistory } = data;
  const accuracy =
    stats.totalAttempts > 0
      ? Math.round((stats.correctAttempts / stats.totalAttempts) * 100)
      : 0;

  return (
    <div className="space-y-8">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Avg Score", value: `${stats.avgScore}%` },
          { label: "Accuracy", value: `${accuracy}%` },
          { label: "Completed", value: stats.totalCompletions },
          { label: "Streak", value: stats.currentStreak > 0 ? `🔥 ${stats.currentStreak}d` : "—" },
        ].map((s) => (
          <div key={s.label} className="rounded-lg border p-4 text-center bg-card">
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b pb-px">
        <button
          onClick={() => setTab("charts")}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            tab === "charts"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Charts
        </button>
        <button
          onClick={() => setTab("history")}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            tab === "history"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Attempt History
        </button>
      </div>

      {tab === "charts" ? (
        <ChartsView
          scoreTimeline={scoreTimeline}
          weaknesses={weaknesses}
          perLessonScores={perLessonScores}
        />
      ) : (
        <AttemptHistoryView attempts={attemptHistory} />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════
// CHARTS TAB
// ═══════════════════════════════════════════

function ChartsView({
  scoreTimeline,
  weaknesses,
  perLessonScores,
}: {
  scoreTimeline: ScorePoint[];
  weaknesses: Weakness[];
  perLessonScores: LessonScore[];
}) {
  return (
    <div className="space-y-8">
      {/* Score Timeline */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium">Score Over Time</h3>
        <div className="rounded-lg border p-4 bg-card">
          {scoreTimeline.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={scoreTimeline}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10 }}
                  tickFormatter={(v: string) => v.slice(5, 10)}
                />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ fontSize: 12 }}
                  labelFormatter={(v) =>
                    new Date(String(v)).toLocaleDateString()
                  }
                  formatter={(value) => [`${value}%`, "Score"]}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  name="Score"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-10">
              Complete some lessons to see your progress chart.
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Per-Lesson Scores */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium">Score by Lesson</h3>
          <div className="rounded-lg border p-4 bg-card">
            {perLessonScores.length > 0 ? (
              <ResponsiveContainer
                width="100%"
                height={Math.max(180, perLessonScores.length * 30)}
              >
                <BarChart data={perLessonScores} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <YAxis
                    dataKey="title"
                    type="category"
                    width={120}
                    tick={{ fontSize: 10 }}
                  />
                  <Tooltip
                    contentStyle={{ fontSize: 12 }}
                    formatter={(value) => [`${value}%`, "Avg Score"]}
                  />
                  <Bar dataKey="avgScore" name="Avg Score" radius={[0, 4, 4, 0]}>
                    {perLessonScores.map((entry, i) => (
                      <Cell
                        key={i}
                        fill={
                          entry.avgScore >= 70
                            ? "#10b981"
                            : entry.avgScore >= 50
                            ? "#f59e0b"
                            : "#ef4444"
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                No lesson data yet.
              </p>
            )}
          </div>
        </div>

        {/* Weakness Heatmap */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium">Weak Areas</h3>
          <div className="rounded-lg border p-4 bg-card">
            {weaknesses.length > 0 ? (
              <div className="space-y-2">
                {weaknesses.map((w) => {
                  const maxOcc = Math.max(...weaknesses.map((x) => x.occurrences));
                  const pct = Math.round((w.occurrences / maxOcc) * 100);
                  return (
                    <div key={w.attribute} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-medium capitalize">
                          {w.attribute}
                        </span>
                        <span className="text-muted-foreground">
                          {w.occurrences} miss{w.occurrences !== 1 ? "es" : ""}
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-red-400 transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                No weaknesses identified yet. Keep it up! 💪
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// ATTEMPT HISTORY TAB
// ═══════════════════════════════════════════

function AttemptHistoryView({
  attempts,
}: {
  attempts: AttemptHistoryItem[];
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (attempts.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
        No attempts yet. Start a lesson to see your history!
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {attempts.map((a) => {
        const expanded = expandedId === a.id;

        return (
          <div
            key={a.id}
            className="rounded-lg border overflow-hidden bg-card"
          >
            {/* Summary Row */}
            <button
              onClick={() => setExpandedId(expanded ? null : a.id)}
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/30 transition-colors"
            >
              <span className="text-lg shrink-0">
                {a.isCorrect ? "✅" : "❌"}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {a.lessonTitle}
                </p>
                <p className="text-xs text-muted-foreground">
                  {a.subjectName} · {a.trackName} ·{" "}
                  {TYPE_LABELS[a.lessonType] ?? a.lessonType} ·{" "}
                  {DIFF_LABELS[a.difficulty]}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p
                  className={`text-sm font-semibold ${
                    (a.score ?? 0) >= 70
                      ? "text-green-600"
                      : (a.score ?? 0) >= 50
                      ? "text-amber-600"
                      : "text-red-600"
                  }`}
                >
                  {a.score ?? 0}%
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {new Date(a.attemptedAt).toLocaleDateString()}
                </p>
              </div>
              <span className="text-muted-foreground text-xs shrink-0">
                {expanded ? "▲" : "▼"}
              </span>
            </button>

            {/* Expanded Details */}
            {expanded && (
              <div className="border-t px-4 py-3 bg-muted/20 space-y-3 text-sm">
                {/* Question */}
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                    Question
                  </p>
                  <p>{a.question || "—"}</p>
                </div>

                {/* Your Answer */}
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                    Your Answer
                  </p>
                  <p className="font-mono text-xs bg-muted rounded px-2 py-1 inline-block">
                    {formatAnswer(a.userAnswer, a.lessonType)}
                  </p>
                </div>

                {/* Meta row */}
                <div className="flex gap-4 text-xs text-muted-foreground">
                  {a.timeSpentSeconds != null && (
                    <span>⏱ {a.timeSpentSeconds}s</span>
                  )}
                  {a.identifiedWeaknesses.length > 0 && (
                    <span>
                      Weaknesses: {a.identifiedWeaknesses.join(", ")}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ───── Helpers ─────

function formatAnswer(answer: unknown, lessonType: string): string {
  if (answer === null || answer === undefined) return "—";
  if (lessonType === "QUIZ") return `Option ${(answer as number) + 1}`;
  if (lessonType === "YES_NO") return answer ? "Yes" : "No";
  return String(answer);
}
