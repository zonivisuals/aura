"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type ClassSummary = {
  id: string;
  name: string;
  studentCount: number;
  isActive: boolean;
};

type ProfileData = {
  user: {
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl: string | null;
    createdAt: string;
  };
  classes: ClassSummary[];
  totals: {
    totalClasses: number;
    totalStudents: number;
    activeClasses: number;
  };
};

export function TeacherProfileClient() {
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch("/api/gamification/profile");
        const json = await res.json();

        // Also fetch classes for teacher summary
        const classRes = await fetch("/api/classes");
        const classJson = await classRes.json();

        const classes: ClassSummary[] = (classJson.classes ?? []).map(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (c: any) => ({
            id: c.id,
            name: c.name,
            studentCount: c._count?.enrollments ?? 0,
            isActive: c.isActive,
          })
        );

        setData({
          user: json.user ?? {
            firstName: "",
            lastName: "",
            email: "",
            avatarUrl: null,
            createdAt: new Date().toISOString(),
          },
          classes,
          totals: {
            totalClasses: classes.length,
            totalStudents: classes.reduce((s, c) => s + c.studentCount, 0),
            activeClasses: classes.filter((c) => c.isActive).length,
          },
        });
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
        <div className="h-32 rounded-lg bg-muted animate-pulse" />
        <div className="h-48 rounded-lg bg-muted animate-pulse" />
      </div>
    );
  }

  if (!data) {
    return (
      <p className="text-muted-foreground text-center py-8">
        Could not load profile.
      </p>
    );
  }

  const { user, classes, totals } = data;
  const initials = `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`;

  return (
    <div className="space-y-8">
      {/* Avatar & Identity */}
      <div className="flex items-center gap-5">
        <div className="w-20 h-20 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-2xl font-bold shrink-0">
          {initials}
        </div>
        <div>
          <h2 className="text-2xl font-semibold">
            {user.firstName} {user.lastName}
          </h2>
          <p className="text-muted-foreground text-sm">{user.email}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Teacher · Joined{" "}
            {user.createdAt
              ? new Date(user.createdAt).toLocaleDateString()
              : "—"}
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Classes", value: totals.totalClasses },
          { label: "Active", value: totals.activeClasses },
          { label: "Total Students", value: totals.totalStudents },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-lg border p-4 text-center bg-card"
          >
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Classes List */}
      <div className="space-y-3">
        <h3 className="text-lg font-medium">My Classes</h3>
        {classes.length === 0 ? (
          <p className="text-sm text-muted-foreground">No classes yet.</p>
        ) : (
          <div className="space-y-2">
            {classes.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between rounded-lg border px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium">{c.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {c.studentCount} student{c.studentCount !== 1 ? "s" : ""}
                    {!c.isActive && " · Inactive"}
                  </p>
                </div>
                <Link
                  href={`/teacher/classes/${c.id}`}
                  className="text-sm text-blue-600 hover:underline"
                >
                  Manage
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
