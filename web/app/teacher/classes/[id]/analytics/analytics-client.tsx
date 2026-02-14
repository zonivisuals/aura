"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-6 space-y-4">
          <div className="flex items-center gap-2 text-destructive">
            <h3 className="text-lg font-semibold">
              ⚠️ Students Needing Attention ({atRiskStudents.length})
            </h3>
          </div>
          
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {atRiskStudents.map((s) => (
              <Link
                key={s.id}
                href={`/teacher/classes/${classId}/analytics/student/${s.id}`}
                className="block group"
              >
                <div className="bg-background rounded-lg border p-4 shadow-sm transition-all hover:shadow-md hover:border-destructive/40 group-hover:scale-[1.02]">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium truncate group-hover:text-primary transition-colors">
                      {s.firstName} {s.lastName}
                    </div>
                    <Badge variant="outline" className="text-[10px] h-5 bg-background">
                      High Risk
                    </Badge>
                  </div>
                  
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {s.risks.map((risk, i) => (
                      <Badge 
                        key={i} 
                        variant="destructive" 
                        className="text-[10px] px-1.5 py-0.5 h-auto font-normal opacity-90"
                      >
                        {risk}
                      </Badge>
                    ))}
                  </div>
                  
                  <div className="mt-3 text-xs text-muted-foreground flex items-center justify-between">
                    <span>Last active: {s.lastActivityDate ? new Date(s.lastActivityDate).toLocaleDateString() : 'Never'}</span>
                    <span className="text-primary group-hover:underline">View Details →</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Activity */}
        <div className="space-y-4">
          <h3 className="text-xl font-bold tracking-tight">Activity (Last 14 Days)</h3>
          <div className="rounded-xl border shadow-sm p-6 bg-white">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyActivity}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12, fill: "#6B7280" }}
                  tickFormatter={(v: string) => v.slice(5)}
                  axisLine={false}
                  tickLine={false}
                  padding={{ left: 10, right: 10 }}
                />
                <YAxis 
                  tick={{ fontSize: 12, fill: "#6B7280" }} 
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{ 
                    borderRadius: "8px", 
                    border: "none", 
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    fontSize: "12px"
                  }}
                  labelFormatter={(v) => String(v)}
                />
                <Line
                  type="monotone"
                  dataKey="attempts"
                  stroke="var(--chart-1)"
                  strokeWidth={3}
                  dot={{ r: 4, fill: "var(--chart-1)", strokeWidth: 2, stroke: "#fff" }}
                  activeDot={{ r: 6 }}
                  name="Attempts"
                />
                <Line
                  type="monotone"
                  dataKey="completions"
                  stroke="var(--chart-2)"
                  strokeWidth={3}
                  dot={{ r: 4, fill: "var(--chart-2)", strokeWidth: 2, stroke: "#fff" }}
                  activeDot={{ r: 6 }}
                  name="Completions"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Score Distribution */}
        <div className="space-y-4">
          <h3 className="text-xl font-bold tracking-tight">Score Distribution</h3>
          <div className="rounded-xl border shadow-sm p-6 bg-white">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={scoreDistribution}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis 
                  dataKey="range" 
                  tick={{ fontSize: 12, fill: "#6B7280" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 12, fill: "#6B7280" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: "8px", 
                    border: "none", 
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    fontSize: "12px"
                  }}
                  cursor={{ fill: 'transparent' }} 
                />
                <Bar 
                  dataKey="count" 
                  fill="var(--chart-4)" 
                  radius={[6, 6, 0, 0]} 
                  name="Attempts"
                  barSize={40} 
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Student Table */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold tracking-tight">
            Student Roster ({students.length})
          </h3>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setSortBy("name")}>
              Reset Sort
            </Button>
          </div>
        </div>
        
        <div className="rounded-xl border shadow-sm overflow-hidden bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/30">
                <tr className="border-b">
                  <th
                    className="text-left px-6 py-4 font-semibold text-muted-foreground cursor-pointer hover:text-foreground transition-colors uppercase text-xs tracking-wider"
                    onClick={() => handleSort("name")}
                  >
                    Student {sortBy === "name" && (sortDir === "asc" ? "↑" : "↓")}
                  </th>
                  <th
                    className="text-center px-4 py-4 font-semibold text-muted-foreground cursor-pointer hover:text-foreground transition-colors uppercase text-xs tracking-wider"
                    onClick={() => handleSort("xp")}
                  >
                    XP {sortBy === "xp" && (sortDir === "asc" ? "↑" : "↓")}
                  </th>
                  <th
                    className="text-center px-4 py-4 font-semibold text-muted-foreground cursor-pointer hover:text-foreground transition-colors uppercase text-xs tracking-wider"
                    onClick={() => handleSort("score")}
                  >
                    Avg Score {sortBy === "score" && (sortDir === "asc" ? "↑" : "↓")}
                  </th>
                  <th
                    className="text-center px-4 py-4 font-semibold text-muted-foreground cursor-pointer hover:text-foreground transition-colors uppercase text-xs tracking-wider"
                    onClick={() => handleSort("completion")}
                  >
                    Completion {sortBy === "completion" && (sortDir === "asc" ? "↑" : "↓")}
                  </th>
                  <th className="text-center px-4 py-4 font-semibold text-muted-foreground uppercase text-xs tracking-wider">
                    Risk Level
                  </th>
                  <th className="px-4 py-4" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {sortedStudents.map((s) => {
                  const isAtRisk = atRiskStudents.some(r => r.id === s.id);
                  return (
                    <tr key={s.id} className="hover:bg-muted/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                            {s.firstName[0]}{s.lastName[0]}
                          </div>
                          <div>
                            <div className="font-medium text-foreground">
                              {s.firstName} {s.lastName}
                            </div>
                            <div className="text-xs text-muted-foreground">{s.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="text-center px-4 py-4 font-medium text-foreground">
                        <Badge variant="secondary" className="font-mono">
                          {s.totalXp.toLocaleString()} XP
                        </Badge>
                      </td>
                      <td className="text-center px-4 py-4">
                        <Badge 
                          variant={s.avgScore >= 80 ? "success" : s.avgScore >= 60 ? "warning" : "destructive"}
                          className="font-bold"
                        >
                          {s.avgScore.toFixed(1)}%
                        </Badge>
                      </td>
                      <td className="text-center px-4 py-4">
                        <div className="w-full max-w-[100px] mx-auto h-2 bg-secondary rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary rounded-full" 
                            style={{ width: `${s.completionPercent}%` }}
                          />
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {s.completionPercent.toFixed(0)}%
                        </div>
                      </td>
                      <td className="text-center px-4 py-4">
                        {isAtRisk ? (
                          <Badge variant="destructive" className="animate-pulse">At Risk</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-muted-foreground">On Track</Badge>
                        )}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/teacher/classes/${classId}/analytics/student/${s.id}`}>
                            Details
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
