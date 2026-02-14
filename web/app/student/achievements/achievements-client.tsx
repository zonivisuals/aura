"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type AchievementItem = {
  id: string;
  name: string;
  description: string | null;
  iconUrl: string | null;
  isEarned: boolean;
  earnedAt: string | null;
};

export function AchievementsClient() {
  const [achievements, setAchievements] = useState<AchievementItem[]>([]);
  const [earnedCount, setEarnedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAchievements() {
      try {
        const res = await fetch("/api/gamification/achievements");
        const data = await res.json();
        if (res.ok) {
          setAchievements(data.achievements);
          setEarnedCount(data.earnedCount);
          setTotalCount(data.totalCount);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    fetchAchievements();
  }, []);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-16 rounded-lg border bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  const earned = achievements.filter((a) => a.isEarned);
  const locked = achievements.filter((a) => !a.isEarned);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Achievements</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {earnedCount} of {totalCount} earned
          </p>
        </div>
        <Link
          href="/student/profile"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Profile
        </Link>
      </div>

      {/* Progress */}
      <div className="space-y-1">
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-amber-500 transition-all duration-500"
            style={{
              width: `${totalCount > 0 ? Math.round((earnedCount / totalCount) * 100) : 0}%`,
            }}
          />
        </div>
      </div>

      {/* Earned */}
      {earned.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Earned ({earned.length})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {earned.map((a) => (
              <div
                key={a.id}
                className="flex items-center gap-3 rounded-lg border p-3 bg-card"
              >
                <span className="text-2xl">{a.iconUrl || "🏅"}</span>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{a.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {a.description}
                  </p>
                  {a.earnedAt && (
                    <p className="text-[10px] text-muted-foreground">
                      Earned {new Date(a.earnedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Locked */}
      {locked.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Locked ({locked.length})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {locked.map((a) => (
              <div
                key={a.id}
                className="flex items-center gap-3 rounded-lg border p-3 bg-card opacity-50"
              >
                <span className="text-2xl grayscale">{a.iconUrl || "🔒"}</span>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{a.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {a.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
