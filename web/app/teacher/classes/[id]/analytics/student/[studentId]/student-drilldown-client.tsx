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

type StudentInfo = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl: string | null;
};

type Stats = {
  totalXp: number;
  level: number;
  lessonsCompleted: number;
  totalLessons: number;
  completionPercent: number;
  totalAttempts: number;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string | null;
  avgScore: number;
};

type LessonPerf = {
  lessonId: string;
  title: string;
  trackName: string;
  difficulty: number;
  lessonType: string;
  attempts: number;
  avgScore: number | null;
  finalScore: number | null;
  completed: boolean;
};

type ScorePoint = {
  date: string;
  score: number;
  isCorrect: boolean | null;
};

type Weakness = { attribute: string; occurrences: number };

type RecentAttempt = {
  id: string;
  lessonTitle: string;
  trackName: string;
  score: number | null;
  isCorrect: boolean | null;
  timeSpentSeconds: number | null;
  attemptedAt: string;
};

type DrilldownData = {
  student: StudentInfo;
  stats: Stats;
  lessonPerformance: LessonPerf[];
  scoreTimeline: ScorePoint[];
  weaknesses: Weakness[];
  recentAttempts: RecentAttempt[];
};

const DIFF_LABELS = ["", "Easy", "Medium", "Hard"];

// ───── Component ─────

export function StudentDrilldownClient({
  classId,
  studentId,
}: {
  classId: string;
  studentId: string;
}) {
  const [data, setData] = useState<DrilldownData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch_() {
      try {
        const res = await fetch(
          `/api/analytics/class/${classId}/student/${studentId}`
        );
        const json = await res.json();
        if (res.ok) setData(json);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    fetch_();
  }, [classId, studentId]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-12 rounded-lg bg-muted animate-pulse" />
        <div className="h-64 rounded-lg bg-muted animate-pulse" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
        Student not found.
      </div>
    );
  }

  const { student, stats, lessonPerformance, scoreTimeline, weaknesses, recentAttempts } = data;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xl font-bold shrink-0">
            {student.firstName[0]}
            {student.lastName[0]}
          </div>
          <div>
            <h2 className="text-xl font-semibold">
              {student.firstName} {student.lastName}
            </h2>
            <p className="text-sm text-muted-foreground">{student.email}</p>
          </div>
        </div>
        <Link href={`/teacher/classes/${classId}/analytics`}>
          <Button variant="outline" size="sm">
            ← Back
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Level", value: stats.level },
          { label: "XP", value: stats.totalXp.toLocaleString() },
          { label: "Avg Score", value: `${stats.avgScore}%` },
          { label: "Completed", value: `${stats.completionPercent}%` },
        ].map((s) => (
          <div key={s.label} className="rounded-lg border p-4 text-center bg-card">
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Score Timeline */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium">Score Timeline</h3>
          <div className="rounded-lg border p-4 bg-card">
            {scoreTimeline.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
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
              <p className="text-sm text-muted-foreground text-center py-8">
                No attempts yet.
              </p>
            )}
          </div>
        </div>

        {/* Weaknesses Bar */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium">Weak Areas</h3>
          <div className="rounded-lg border p-4 bg-card">
            {weaknesses.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={weaknesses} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis
                    dataKey="attribute"
                    type="category"
                    width={90}
                    tick={{ fontSize: 10 }}
                  />
                  <Tooltip contentStyle={{ fontSize: 12 }} />
                  <Bar
                    dataKey="occurrences"
                    fill="#ef4444"
                    radius={[0, 4, 4, 0]}
                    name="Occurrences"
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                No weaknesses identified yet.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Per-lesson Performance */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium">
          Lesson Performance ({lessonPerformance.length} lessons)
        </h3>
        {lessonPerformance.length > 0 ? (
          <div className="rounded-lg border p-4 bg-card">
            <ResponsiveContainer width="100%" height={Math.max(200, lessonPerformance.length * 32)}>
              <BarChart data={lessonPerformance} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} />
                <YAxis
                  dataKey="title"
                  type="category"
                  width={140}
                  tick={{ fontSize: 10 }}
                />
                <Tooltip
                  contentStyle={{ fontSize: 12 }}
                  formatter={(value) => [`${value}%`, "Avg Score"]}
                />
                <Bar dataKey="avgScore" name="Avg Score" radius={[0, 4, 4, 0]}>
                  {lessonPerformance.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={
                        (entry.avgScore ?? 0) >= 70
                          ? "#10b981"
                          : (entry.avgScore ?? 0) >= 50
                          ? "#f59e0b"
                          : "#ef4444"
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No lesson data available.
          </p>
        )}
      </div>

      {/* Recent Attempts Table */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium">
          Recent Attempts ({recentAttempts.length})
        </h3>
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left px-4 py-2 font-medium">Lesson</th>
                <th className="text-left px-3 py-2 font-medium hidden sm:table-cell">
                  Track
                </th>
                <th className="text-center px-3 py-2 font-medium">Score</th>
                <th className="text-center px-3 py-2 font-medium">Result</th>
                <th className="text-right px-4 py-2 font-medium hidden sm:table-cell">
                  When
                </th>
              </tr>
            </thead>
            <tbody>
              {recentAttempts.map((a) => (
                <tr key={a.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-2 truncate max-w-[200px]">
                    {a.lessonTitle}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground text-xs hidden sm:table-cell">
                    {a.trackName}
                  </td>
                  <td className="text-center px-3 py-2">
                    {a.score ?? "—"}%
                  </td>
                  <td className="text-center px-3 py-2">
                    {a.isCorrect ? "✅" : "❌"}
                  </td>
                  <td className="text-right px-4 py-2 text-xs text-muted-foreground hidden sm:table-cell">
                    {new Date(a.attemptedAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {recentAttempts.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    No attempts recorded.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Extra Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          {
            label: "Total Attempts",
            value: stats.totalAttempts,
          },
          {
            label: "Current Streak",
            value: stats.currentStreak > 0 ? `🔥 ${stats.currentStreak}d` : "—",
          },
          {
            label: "Lessons Done",
            value: `${stats.lessonsCompleted} / ${stats.totalLessons}`,
          },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-lg border p-3 text-center bg-card"
          >
            <p className="text-lg font-bold">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
