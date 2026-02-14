"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// ───── Types ─────

type Overview = {
  totalStudents: number;
  totalLessons: number;
  totalAttempts: number;
  correctAttempts: number;
  classAvgScore: number;
  classCompletionRate: number;
  accuracy: number;
};

type StudentRow = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl: string | null;
  totalXp: number;
  level: number;
  lessonsCompleted: number;
  completionPercent: number;
  avgScore: number;
  currentStreak: number;
  lastActivityDate: string | null;
  totalAttempts: number;
};

type AtRiskStudent = StudentRow & { risks: string[] };

type DailyActivity = { date: string; attempts: number; completions: number };

type ScoreDistribution = { range: string; count: number };

type AnalyticsData = {
  className: string;
  overview: Overview;
  students: StudentRow[];
  atRiskStudents: AtRiskStudent[];
  dailyActivity: DailyActivity[];
  scoreDistribution: ScoreDistribution[];
};

// ───── Component ─────

export function TeacherAnalyticsClient({ classId }: { classId: string }) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"xp" | "score" | "completion" | "name">("xp");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const res = await fetch(`/api/analytics/class/${classId}`);
        const json = await res.json();
        if (res.ok) setData(json);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, [classId]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-12 rounded-lg bg-muted animate-pulse" />
        <div className="h-40 rounded-lg bg-muted animate-pulse" />
        <div className="h-64 rounded-lg bg-muted animate-pulse" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
        Could not load analytics.
      </div>
    );
  }

  const { overview, students, atRiskStudents, dailyActivity, scoreDistribution } = data;

  // Sort students
  const sorted = [...students].sort((a, b) => {
    const dir = sortDir === "asc" ? 1 : -1;
    if (sortBy === "name")
      return dir * a.firstName.localeCompare(b.firstName);
    if (sortBy === "score") return dir * (a.avgScore - b.avgScore);
    if (sortBy === "completion")
      return dir * (a.completionPercent - b.completionPercent);
    return dir * (a.totalXp - b.totalXp);
  });

  const toggleSort = (col: typeof sortBy) => {
    if (sortBy === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortBy(col);
      setSortDir("desc");
    }
  };

  const arrow = (col: typeof sortBy) =>
    sortBy === col ? (sortDir === "asc" ? " ↑" : " ↓") : "";

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">{data.className}</h2>
          <p className="text-sm text-muted-foreground">Class Analytics</p>
        </div>
        <Link href={`/teacher/classes/${classId}`}>
          <Button variant="outline" size="sm">
            ← Back to Class
          </Button>
        </Link>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Students", value: overview.totalStudents },
          { label: "Avg Score", value: `${overview.classAvgScore}%` },
          { label: "Accuracy", value: `${overview.accuracy}%` },
          { label: "Completion", value: `${overview.classCompletionRate}%` },
        ].map((s) => (
          <div key={s.label} className="rounded-lg border p-4 text-center bg-card">
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* At-Risk Alert */}
      {atRiskStudents.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 space-y-3">
          <h3 className="text-sm font-semibold text-amber-800">
            ⚠️ At-Risk Students ({atRiskStudents.length})
          </h3>
          <div className="space-y-2">
            {atRiskStudents.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between text-sm"
              >
                <div>
                  <span className="font-medium text-amber-900">
                    {s.firstName} {s.lastName}
                  </span>
                  <span className="ml-2 text-xs text-amber-700">
                    {s.risks.join(" · ")}
                  </span>
                </div>
                <Link
                  href={`/teacher/classes/${classId}/analytics/student/${s.id}`}
                  className="text-xs text-amber-700 hover:text-amber-900 hover:underline"
                >
                  View →
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Activity */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium">Activity (Last 14 Days)</h3>
          <div className="rounded-lg border p-4 bg-card">
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={dailyActivity}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10 }}
                  tickFormatter={(v: string) => v.slice(5)}
                />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ fontSize: 12 }}
                  labelFormatter={(v) => String(v)}
                />
                <Line
                  type="monotone"
                  dataKey="attempts"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  name="Attempts"
                />
                <Line
                  type="monotone"
                  dataKey="completions"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  name="Completions"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Score Distribution */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium">Score Distribution</h3>
          <div className="rounded-lg border p-4 bg-card">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={scoreDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="range" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Attempts" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Student Table */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium">
          Students ({students.length})
        </h3>
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th
                  className="text-left px-4 py-2.5 font-medium cursor-pointer hover:text-foreground"
                  onClick={() => toggleSort("name")}
                >
                  Student{arrow("name")}
                </th>
                <th
                  className="text-center px-3 py-2.5 font-medium cursor-pointer hover:text-foreground"
                  onClick={() => toggleSort("xp")}
                >
                  XP{arrow("xp")}
                </th>
                <th className="text-center px-3 py-2.5 font-medium hidden sm:table-cell">
                  Lvl
                </th>
                <th
                  className="text-center px-3 py-2.5 font-medium cursor-pointer hover:text-foreground"
                  onClick={() => toggleSort("score")}
                >
                  Avg{arrow("score")}
                </th>
                <th
                  className="text-center px-3 py-2.5 font-medium cursor-pointer hover:text-foreground hidden sm:table-cell"
                  onClick={() => toggleSort("completion")}
                >
                  Done{arrow("completion")}
                </th>
                <th className="text-center px-3 py-2.5 font-medium hidden md:table-cell">
                  Streak
                </th>
                <th className="px-3 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {sorted.map((s) => (
                <tr key={s.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-2.5">
                    <p className="font-medium truncate max-w-[180px]">
                      {s.firstName} {s.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">{s.email}</p>
                  </td>
                  <td className="text-center px-3 py-2.5 font-medium">
                    {s.totalXp.toLocaleString()}
                  </td>
                  <td className="text-center px-3 py-2.5 hidden sm:table-cell">
                    {s.level}
                  </td>
                  <td className="text-center px-3 py-2.5">
                    <span
                      className={
                        s.avgScore < 50
                          ? "text-red-600"
                          : s.avgScore < 70
                          ? "text-amber-600"
                          : "text-green-600"
                      }
                    >
                      {s.avgScore}%
                    </span>
                  </td>
                  <td className="text-center px-3 py-2.5 hidden sm:table-cell">
                    {s.completionPercent}%
                  </td>
                  <td className="text-center px-3 py-2.5 hidden md:table-cell">
                    {s.currentStreak > 0 ? `🔥 ${s.currentStreak}d` : "—"}
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <Link
                      href={`/teacher/classes/${classId}/analytics/student/${s.id}`}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Details →
                    </Link>
                  </td>
                </tr>
              ))}
              {sorted.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    No students enrolled yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
