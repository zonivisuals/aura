"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ClassItem = {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  enrollmentType: string;
  joinedAt: string;
  teacher: { firstName: string; lastName: string };
  _count: { enrollments: number };
};

type RecommendedTrack = {
  id: string;
  name: string;
  completions: number;
};

export function StudentClassesClient() {
  const router = useRouter();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteCode, setInviteCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // AI Recommendations
  const [recommendations, setRecommendations] = useState<RecommendedTrack[]>([]);
  const [recsLoading, setRecsLoading] = useState(true);

  const fetchClasses = useCallback(async () => {
    try {
      const res = await fetch("/api/classes");
      const data = await res.json();
      if (res.ok) setClasses(data.classes);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  // Fetch AI recommendations
  useEffect(() => {
    async function fetchRecs() {
      try {
        const res = await fetch("/api/ai/recommendations");
        const data = await res.json();
        if (res.ok && data.recommendations) {
          setRecommendations(data.recommendations);
        }
      } catch {
        // silently ignore — recommendations are non-critical
      } finally {
        setRecsLoading(false);
      }
    }
    fetchRecs();
  }, []);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setJoining(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/classes/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteCode: inviteCode.trim() }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to join class");
        return;
      }

      setSuccess(`Joined "${data.class.name}" successfully!`);
      setInviteCode("");
      fetchClasses();
    } catch {
      setError("Something went wrong");
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="h-20 rounded-lg border bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Join Class */}
      <div className="rounded-lg border p-4 bg-card">
        <h2 className="text-lg font-medium mb-3">Join a Class</h2>
        <form onSubmit={handleJoin} className="flex gap-2 max-w-md">
          <div className="flex-1 space-y-1">
            <Label htmlFor="invite-code" className="sr-only">
              Invite Code
            </Label>
            <Input
              id="invite-code"
              placeholder="Enter invite code (e.g. ABC123)"
              value={inviteCode}
              onChange={(e) => {
                setInviteCode(e.target.value.toUpperCase());
                setError(null);
                setSuccess(null);
              }}
              maxLength={8}
              className="font-mono tracking-wider uppercase"
              required
            />
          </div>
          <Button type="submit" disabled={joining || !inviteCode.trim()}>
            {joining ? "Joining..." : "Join"}
          </Button>
        </form>
        {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
        {success && <p className="text-sm text-green-600 mt-2">{success}</p>}
      </div>

      {/* Enrolled Classes */}
      <div>
        <h2 className="text-lg font-medium mb-3">My Classes</h2>
        {classes.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
            <p>You haven&apos;t joined any classes yet.</p>
            <p className="text-sm mt-1">Enter an invite code above to get started.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {classes.map((c) => (
              <div key={c.id} className="rounded-lg border p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="font-medium truncate">{c.name}</h3>
                    {c.description && (
                      <p className="text-sm text-muted-foreground truncate">{c.description}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      Teacher: {c.teacher.firstName} {c.teacher.lastName}
                      {" · "}
                      {c._count.enrollments} student{c._count.enrollments !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/student/classes/${c.id}`)}
                  >
                    View
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* AI Recommendations */}
      {!recsLoading && recommendations.length > 0 && (
        <div>
          <h2 className="text-lg font-medium mb-3">✨ Recommended for You</h2>
          <p className="text-sm text-muted-foreground mb-3">
            Based on what your classmates are learning
          </p>
          <div className="space-y-2">
            {recommendations.map((rec) => (
              <div key={rec.id} className="rounded-lg border border-purple-200 bg-purple-50/50 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="font-medium truncate text-purple-900">{rec.name}</h3>
                    <p className="text-xs text-purple-600 mt-0.5">
                      {rec.completions} classmate{rec.completions !== 1 ? "s" : ""} completed this
                    </p>
                  </div>
                  <Button
                    size="sm"
                    className="bg-purple-600 hover:bg-purple-700 text-white shrink-0"
                    onClick={() => router.push(`/student/tracks/${rec.id}`)}
                  >
                    Start Track
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
