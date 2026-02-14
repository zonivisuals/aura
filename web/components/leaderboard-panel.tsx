"use client";

import { useState, useEffect } from "react";

type LeaderboardEntry = {
  rank: number;
  userId: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  totalXp: number;
  level: number;
  lessonsCompleted: number;
  currentStreak: number;
  isCurrentUser: boolean;
};

export function LeaderboardPanel({ classId }: { classId: string }) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        const res = await fetch(`/api/gamification/leaderboard?classId=${classId}`);
        const data = await res.json();
        if (res.ok) setEntries(data.leaderboard);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    fetchLeaderboard();
  }, [classId]);

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-12 rounded-lg bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        No activity yet.
      </p>
    );
  }

  const RANK_STYLES: Record<number, string> = {
    1: "text-amber-500",
    2: "text-gray-400",
    3: "text-amber-700",
  };

  const RANK_BADGES: Record<number, string> = {
    1: "🥇",
    2: "🥈",
    3: "🥉",
  };

  return (
    <div className="space-y-1">
      {entries.map((entry) => (
        <div
          key={entry.userId}
          className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors ${
            entry.isCurrentUser
              ? "bg-blue-50 border border-blue-200"
              : "hover:bg-muted/50"
          }`}
        >
          {/* Rank */}
          <span
            className={`w-8 text-center text-sm font-bold shrink-0 ${
              RANK_STYLES[entry.rank] ?? "text-muted-foreground"
            }`}
          >
            {RANK_BADGES[entry.rank] ?? `#${entry.rank}`}
          </span>

          {/* Avatar */}
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold shrink-0">
            {entry.firstName[0]}
            {entry.lastName[0]}
          </div>

          {/* Name & Stats */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {entry.firstName} {entry.lastName}
              {entry.isCurrentUser && (
                <span className="text-xs text-blue-600 ml-1">(you)</span>
              )}
            </p>
            <p className="text-xs text-muted-foreground">
              Lvl {entry.level} · {entry.lessonsCompleted} lessons
              {entry.currentStreak > 0 && ` · 🔥 ${entry.currentStreak}d`}
            </p>
          </div>

          {/* XP */}
          <div className="text-right shrink-0">
            <p className="text-sm font-semibold">{entry.totalXp.toLocaleString()}</p>
            <p className="text-[10px] text-muted-foreground">XP</p>
          </div>
        </div>
      ))}
    </div>
  );
}
