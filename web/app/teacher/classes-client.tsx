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

type Member = {
  id: string;
  enrollmentType: string;
  joinedAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
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

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editError, setEditError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Members panel state
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [removingUserId, setRemovingUserId] = useState<string | null>(null);

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

  // --- Edit handlers ---

  const startEditing = (c: ClassItem) => {
    setEditingId(c.id);
    setEditName(c.name);
    setEditDescription(c.description ?? "");
    setEditError(null);
    // Close members panel if open on another class
    if (expandedId !== c.id) setExpandedId(null);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditError(null);
  };

  const handleSave = async (classId: string) => {
    setSaving(true);
    setEditError(null);

    try {
      const res = await fetch(`/api/classes/${classId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName.trim(),
          description: editDescription.trim() || null,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setEditError(data.error || "Failed to update");
        return;
      }

      setEditingId(null);
      fetchClasses();
    } catch {
      setEditError("Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (c: ClassItem) => {
    try {
      const res = await fetch(`/api/classes/${c.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !c.isActive }),
      });
      if (res.ok) fetchClasses();
    } catch {
      // ignore
    }
  };

  // --- Members handlers ---

  const toggleMembers = async (classId: string) => {
    if (expandedId === classId) {
      setExpandedId(null);
      return;
    }

    setExpandedId(classId);
    setLoadingMembers(true);

    try {
      const res = await fetch(`/api/classes/${classId}`);
      const data = await res.json();
      if (res.ok) {
        setMembers(data.class.enrollments ?? []);
      }
    } catch {
      // ignore
    } finally {
      setLoadingMembers(false);
    }
  };

  const removeMember = async (classId: string, userId: string) => {
    setRemovingUserId(userId);

    try {
      const res = await fetch(`/api/classes/${classId}/members/${userId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setMembers((prev) => prev.filter((m) => m.user.id !== userId));
        fetchClasses(); // refresh counts
      }
    } catch {
      // ignore
    } finally {
      setRemovingUserId(null);
    }
  };

  // --- Render ---

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
            <div key={c.id} className="rounded-lg border overflow-hidden">
              {/* Class Row */}
              {editingId === c.id ? (
                /* --- Editing Mode --- */
                <div className="p-4 space-y-3 bg-card">
                  <div className="space-y-2">
                    <Label>Class Name</Label>
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Input
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      placeholder="Optional description"
                    />
                  </div>
                  {editError && <p className="text-sm text-red-500">{editError}</p>}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleSave(c.id)}
                      disabled={saving || !editName.trim()}
                    >
                      {saving ? "Saving..." : "Save"}
                    </Button>
                    <Button size="sm" variant="outline" onClick={cancelEditing}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                /* --- Display Mode --- */
                <div className="p-4 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium truncate">{c.name}</h3>
                      {!c.isActive && (
                        <span className="text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
                          Inactive
                        </span>
                      )}
                    </div>
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
                    <Button variant="outline" size="sm" onClick={() => startEditing(c)}>
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleMembers(c.id)}
                    >
                      {expandedId === c.id ? "Hide" : "Members"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleActive(c)}
                      className="text-xs"
                    >
                      {c.isActive ? "Deactivate" : "Activate"}
                    </Button>
                  </div>
                </div>
              )}

              {/* Members Panel */}
              {expandedId === c.id && (
                <div className="border-t px-4 py-3 bg-muted/30">
                  {loadingMembers ? (
                    <p className="text-sm text-muted-foreground">Loading members...</p>
                  ) : members.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No students enrolled yet.</p>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Enrolled Students ({members.length})
                      </p>
                      {members.map((m) => (
                        <div
                          key={m.user.id}
                          className="flex items-center justify-between py-1.5"
                        >
                          <div>
                            <span className="text-sm font-medium">
                              {m.user.firstName} {m.user.lastName}
                            </span>
                            <span className="text-xs text-muted-foreground ml-2">
                              {m.user.email}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs text-red-500 hover:text-red-600 hover:bg-red-50"
                            onClick={() => removeMember(c.id, m.user.id)}
                            disabled={removingUserId === m.user.id}
                          >
                            {removingUserId === m.user.id ? "Removing..." : "Remove"}
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
