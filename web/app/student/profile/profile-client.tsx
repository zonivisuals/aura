"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

// ───── Types ─────

type ProfileData = {
  user: {
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl: string | null;
  };
  stats: {
    level: number;
    currentXp: number;
    xpForCurrentLevel: number;
    xpForNextLevel: number;
    progressPercent: number;
    lessonsCompleted: number;
    currentStreak: number;
    longestStreak: number;
    lastActivityDate: string | null;
  };
  achievements: {
    name: string;
    description: string | null;
    iconUrl: string | null;
    earnedAt: string;
  }[];
};

// ───── Component ─────

export function StudentProfileClient() {
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch("/api/gamification/profile");
        const json = await res.json();
        if (res.ok) setData(json);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-32 rounded-lg border bg-muted animate-pulse" />
        <div className="h-40 rounded-lg border bg-muted animate-pulse" />
        <div className="h-48 rounded-lg border bg-muted animate-pulse" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
        Failed to load profile.
      </div>
    );
  }

  const { user, stats, achievements } = data;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-2xl font-bold text-blue-600 shrink-0">
          {user.firstName[0]}
          {user.lastName[0]}
        </div>
        <div>
          <h2 className="text-2xl font-semibold">
            {user.firstName} {user.lastName}
          </h2>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
      </div>

      {/* Level & XP Card */}
      <div className="rounded-lg border p-5 bg-card space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Level</p>
            <p className="text-3xl font-bold">{stats.level}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Total XP</p>
            <p className="text-3xl font-bold">{stats.currentXp.toLocaleString()}</p>
          </div>
        </div>
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{stats.xpForCurrentLevel.toLocaleString()} XP</span>
            <span>{stats.xpForNextLevel.toLocaleString()} XP</span>
          </div>
          <div className="h-3 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500"
              style={{ width: `${stats.progressPercent}%` }}
            />
          </div>
          <p className="text-xs text-center text-muted-foreground">
            {stats.progressPercent}% to Level {stats.level + 1}
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Lessons Done" value={stats.lessonsCompleted} icon="📚" />
        <StatCard label="Current Streak" value={`${stats.currentStreak}d`} icon="🔥" />
        <StatCard label="Longest Streak" value={`${stats.longestStreak}d`} icon="⚡" />
        <StatCard
          label="Last Active"
          value={
            stats.lastActivityDate
              ? new Date(stats.lastActivityDate).toLocaleDateString()
              : "—"
          }
          icon="📅"
        />
      </div>

      {/* Achievements */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Achievements</h3>
          <Link
            href="/student/achievements"
            className="text-sm text-blue-600 hover:underline"
          >
            View all
          </Link>
        </div>
        {achievements.length === 0 ? (
          <div className="rounded-lg border border-dashed p-6 text-center text-muted-foreground">
            <p className="text-2xl mb-2">🏅</p>
            <p className="text-sm">No achievements yet. Complete lessons to earn badges!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {achievements.slice(0, 6).map((a) => (
              <div
                key={a.name}
                className="flex items-center gap-3 rounded-lg border p-3 bg-card"
              >
                <span className="text-2xl">{a.iconUrl || "🏅"}</span>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{a.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {a.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon: string;
}) {
  return (
    <div className="rounded-lg border p-3 bg-card text-center">
      <p className="text-lg mb-1">{icon}</p>
      <p className="text-lg font-semibold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
