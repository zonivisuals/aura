"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ClassItem = {
  id: string;
  name: string;
  description: string | null;
  inviteCode: string;
  isActive: boolean;
  createdAt: string;
  _count: { enrollments: number };
};

export function TeacherClassesClient() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError(null);

    try {
      const res = await fetch("/api/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), description: description.trim() || null }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create class");
        return;
      }

      setName("");
      setDescription("");
      setShowForm(false);
      fetchClasses();
    } catch {
      setError("Something went wrong");
    } finally {
      setCreating(false);
    }
  };

  const copyCode = (code: string, classId: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(classId);
    setTimeout(() => setCopiedId(null), 2000);
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">My Classes</h2>
        <Button onClick={() => setShowForm(!showForm)} variant={showForm ? "outline" : "default"}>
          {showForm ? "Cancel" : "Create Class"}
        </Button>
      </div>

      {/* Create Form */}
      {showForm && (
        <form onSubmit={handleCreate} className="rounded-lg border p-4 space-y-4 bg-card">
          <div className="space-y-2">
            <Label htmlFor="class-name">Class Name</Label>
            <Input
              id="class-name"
              placeholder="e.g. Calculus I - Fall 2026"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="class-desc">Description (optional)</Label>
            <Input
              id="class-desc"
              placeholder="Brief description of the class"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button type="submit" disabled={creating || !name.trim()}>
            {creating ? "Creating..." : "Create"}
          </Button>
        </form>
      )}

      {/* Class List */}
      {classes.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          <p>No classes yet. Create your first class to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {classes.map((c) => (
            <div key={c.id} className="rounded-lg border p-4 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <h3 className="font-medium truncate">{c.name}</h3>
                {c.description && (
                  <p className="text-sm text-muted-foreground truncate">{c.description}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  {c._count.enrollments} student{c._count.enrollments !== 1 ? "s" : ""} enrolled
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <code className="bg-muted px-3 py-1.5 rounded text-sm font-mono tracking-wider">
                  {c.inviteCode}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyCode(c.inviteCode, c.id)}
                >
                  {copiedId === c.id ? "Copied!" : "Copy"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
