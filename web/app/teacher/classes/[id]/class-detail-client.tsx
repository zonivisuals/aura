"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

// ───── Types ─────

type SubjectItem = {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  _count: { courses: number; tracks: number };
};

type CourseItem = {
  id: string;
  title: string;
  pdfUrl: string;
  pdfFilename: string | null;
  fileSize: number | null;
  uploadedAt: string;
};

type TrackItem = {
  id: string;
  name: string;
  description: string | null;
  isPublished: boolean;
  createdAt: string;
  _count: { lessons: number };
};

type ClassInfo = {
  id: string;
  name: string;
  description: string | null;
  inviteCode: string;
  isActive: boolean;
};

// ───── Helpers ─────

function formatFileSize(bytes: number | null): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ───── Component ─────

export function ClassDetailClient({ classId }: { classId: string }) {
  // Class info
  const [classInfo, setClassInfo] = useState<ClassInfo | null>(null);
  const [loadingClass, setLoadingClass] = useState(true);

  // Subjects
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [showSubjectForm, setShowSubjectForm] = useState(false);
  const [subjectName, setSubjectName] = useState("");
  const [subjectDesc, setSubjectDesc] = useState("");
  const [creatingSubject, setCreatingSubject] = useState(false);
  const [subjectError, setSubjectError] = useState<string | null>(null);

  // Expanded subject → courses
  const [expandedSubjectId, setExpandedSubjectId] = useState<string | null>(null);
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);

  // Upload state
  const [uploadingSubjectId, setUploadingSubjectId] = useState<string | null>(null);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Deleting course
  const [deletingCourseId, setDeletingCourseId] = useState<string | null>(null);

  // Subject editing
  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null);
  const [editSubjectName, setEditSubjectName] = useState("");
  const [editSubjectDesc, setEditSubjectDesc] = useState("");
  const [savingSubject, setSavingSubject] = useState(false);
  const [editSubjectError, setEditSubjectError] = useState<string | null>(null);
  const [deletingSubjectId, setDeletingSubjectId] = useState<string | null>(null);

  // Course editing
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [editCourseTitle, setEditCourseTitle] = useState("");
  const [savingCourse, setSavingCourse] = useState(false);
  const [editCourseError, setEditCourseError] = useState<string | null>(null);

  // Tracks state
  const [expandedPanel, setExpandedPanel] = useState<"courses" | "tracks" | null>(null);
  const [tracks, setTracks] = useState<TrackItem[]>([]);
  const [loadingTracks, setLoadingTracks] = useState(false);
  const [showTrackForm, setShowTrackForm] = useState(false);
  const [trackName, setTrackName] = useState("");
  const [trackDesc, setTrackDesc] = useState("");
  const [creatingTrack, setCreatingTrack] = useState(false);
  const [trackError, setTrackError] = useState<string | null>(null);
  const [editingTrackId, setEditingTrackId] = useState<string | null>(null);
  const [editTrackName, setEditTrackName] = useState("");
  const [editTrackDesc, setEditTrackDesc] = useState("");
  const [savingTrack, setSavingTrack] = useState(false);
  const [editTrackError, setEditTrackError] = useState<string | null>(null);
  const [deletingTrackId, setDeletingTrackId] = useState<string | null>(null);

  // ───── Fetch class info ─────

  useEffect(() => {
    async function fetchClass() {
      try {
        const res = await fetch(`/api/classes/${classId}`);
        const data = await res.json();
        if (res.ok) setClassInfo(data.class);
      } catch {
        // ignore
      } finally {
        setLoadingClass(false);
      }
    }
    fetchClass();
  }, [classId]);

  // ───── Fetch subjects ─────

  const fetchSubjects = useCallback(async () => {
    try {
      const res = await fetch(`/api/classes/${classId}/subjects`);
      const data = await res.json();
      if (res.ok) setSubjects(data.subjects);
    } catch {
      // ignore
    } finally {
      setLoadingSubjects(false);
    }
  }, [classId]);

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  // ───── Create subject ─────

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingSubject(true);
    setSubjectError(null);

    try {
      const res = await fetch(`/api/classes/${classId}/subjects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: subjectName.trim(),
          description: subjectDesc.trim() || null,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setSubjectError(data.error || "Failed to create subject");
        return;
      }

      setSubjectName("");
      setSubjectDesc("");
      setShowSubjectForm(false);
      fetchSubjects();
    } catch {
      setSubjectError("Something went wrong");
    } finally {
      setCreatingSubject(false);
    }
  };

  // ───── Fetch courses for a subject ─────

  const fetchCourses = useCallback(async (subjectId: string) => {
    setLoadingCourses(true);
    try {
      const res = await fetch(`/api/subjects/${subjectId}/courses`);
      const data = await res.json();
      if (res.ok) setCourses(data.courses);
    } catch {
      // ignore
    } finally {
      setLoadingCourses(false);
    }
  }, []);

  const toggleSubject = (subjectId: string) => {
    if (expandedSubjectId === subjectId) {
      setExpandedSubjectId(null);
      setUploadingSubjectId(null);
      setExpandedPanel(null);
      return;
    }
    setExpandedSubjectId(subjectId);
    setUploadingSubjectId(null);
    setExpandedPanel("courses");
    fetchCourses(subjectId);
  };

  const togglePanel = (subjectId: string, panel: "courses" | "tracks") => {
    if (expandedSubjectId === subjectId && expandedPanel === panel) {
      setExpandedSubjectId(null);
      setExpandedPanel(null);
      return;
    }
    setExpandedSubjectId(subjectId);
    setExpandedPanel(panel);
    if (panel === "courses") fetchCourses(subjectId);
    if (panel === "tracks") fetchTracks(subjectId);
  };

  // ───── Upload course PDF ─────

  const startUpload = (subjectId: string) => {
    setUploadingSubjectId(subjectId);
    setUploadTitle("");
    setUploadFile(null);
    setUploadError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const cancelUpload = () => {
    setUploadingSubjectId(null);
    setUploadError(null);
  };

  const handleUpload = async (e: React.FormEvent, subjectId: string) => {
    e.preventDefault();
    if (!uploadFile || !uploadTitle.trim()) return;

    setUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append("file", uploadFile);
      formData.append("title", uploadTitle.trim());

      const res = await fetch(`/api/subjects/${subjectId}/courses`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        setUploadError(data.error || "Upload failed");
        return;
      }

      setUploadingSubjectId(null);
      setUploadTitle("");
      setUploadFile(null);
      fetchCourses(subjectId);
      fetchSubjects(); // refresh counts
    } catch {
      setUploadError("Something went wrong");
    } finally {
      setUploading(false);
    }
  };

  // ───── Delete course ─────

  const handleDeleteCourse = async (subjectId: string, courseId: string) => {
    setDeletingCourseId(courseId);
    try {
      const res = await fetch(`/api/subjects/${subjectId}/courses/${courseId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setCourses((prev) => prev.filter((c) => c.id !== courseId));
        fetchSubjects(); // refresh counts
      }
    } catch {
      // ignore
    } finally {
      setDeletingCourseId(null);
    }
  };

  // ───── Edit subject ─────

  const startEditingSubject = (subject: SubjectItem) => {
    setEditingSubjectId(subject.id);
    setEditSubjectName(subject.name);
    setEditSubjectDesc(subject.description ?? "");
    setEditSubjectError(null);
  };

  const cancelEditingSubject = () => {
    setEditingSubjectId(null);
    setEditSubjectError(null);
  };

  const handleSaveSubject = async (subjectId: string) => {
    setSavingSubject(true);
    setEditSubjectError(null);

    try {
      const res = await fetch(`/api/subjects/${subjectId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editSubjectName.trim(),
          description: editSubjectDesc.trim() || null,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setEditSubjectError(data.error || "Failed to update");
        return;
      }

      setEditingSubjectId(null);
      fetchSubjects();
    } catch {
      setEditSubjectError("Something went wrong");
    } finally {
      setSavingSubject(false);
    }
  };

  // ───── Delete subject ─────

  const handleDeleteSubject = async (subjectId: string) => {
    if (!confirm("Delete this subject and all its courses? This cannot be undone.")) return;

    setDeletingSubjectId(subjectId);
    try {
      const res = await fetch(`/api/subjects/${subjectId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        if (expandedSubjectId === subjectId) setExpandedSubjectId(null);
        fetchSubjects();
      }
    } catch {
      // ignore
    } finally {
      setDeletingSubjectId(null);
    }
  };

  // ───── Edit course ─────

  const startEditingCourse = (course: CourseItem) => {
    setEditingCourseId(course.id);
    setEditCourseTitle(course.title);
    setEditCourseError(null);
  };

  const cancelEditingCourse = () => {
    setEditingCourseId(null);
    setEditCourseError(null);
  };

  const handleSaveCourse = async (subjectId: string, courseId: string) => {
    setSavingCourse(true);
    setEditCourseError(null);

    try {
      const res = await fetch(`/api/subjects/${subjectId}/courses/${courseId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editCourseTitle.trim() }),
      });
      const data = await res.json();

      if (!res.ok) {
        setEditCourseError(data.error || "Failed to update");
        return;
      }

      setEditingCourseId(null);
      fetchCourses(subjectId);
    } catch {
      setEditCourseError("Something went wrong");
    } finally {
      setSavingCourse(false);
    }
  };

  // ───── Track CRUD ─────

  const fetchTracks = useCallback(async (subjectId: string) => {
    setLoadingTracks(true);
    try {
      const res = await fetch(`/api/subjects/${subjectId}/tracks`);
      const data = await res.json();
      if (res.ok) setTracks(data.tracks);
    } catch {
      // ignore
    } finally {
      setLoadingTracks(false);
    }
  }, []);

  const handleCreateTrack = async (e: React.FormEvent, subjectId: string) => {
    e.preventDefault();
    setCreatingTrack(true);
    setTrackError(null);

    try {
      const res = await fetch(`/api/subjects/${subjectId}/tracks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trackName.trim(),
          description: trackDesc.trim() || null,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setTrackError(data.error || "Failed to create track");
        return;
      }

      setTrackName("");
      setTrackDesc("");
      setShowTrackForm(false);
      fetchTracks(subjectId);
      fetchSubjects();
    } catch {
      setTrackError("Something went wrong");
    } finally {
      setCreatingTrack(false);
    }
  };

  const startEditingTrack = (track: TrackItem) => {
    setEditingTrackId(track.id);
    setEditTrackName(track.name);
    setEditTrackDesc(track.description ?? "");
    setEditTrackError(null);
  };

  const cancelEditingTrack = () => {
    setEditingTrackId(null);
    setEditTrackError(null);
  };

  const handleSaveTrack = async (subjectId: string, trackId: string) => {
    setSavingTrack(true);
    setEditTrackError(null);

    try {
      const res = await fetch(`/api/subjects/${subjectId}/tracks/${trackId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editTrackName.trim(),
          description: editTrackDesc.trim() || null,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setEditTrackError(data.error || "Failed to update");
        return;
      }

      setEditingTrackId(null);
      fetchTracks(subjectId);
    } catch {
      setEditTrackError("Something went wrong");
    } finally {
      setSavingTrack(false);
    }
  };

  const handleTogglePublish = async (subjectId: string, trackId: string, isPublished: boolean) => {
    try {
      await fetch(`/api/subjects/${subjectId}/tracks/${trackId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished: !isPublished }),
      });
      fetchTracks(subjectId);
    } catch {
      // ignore
    }
  };

  const handleDeleteTrack = async (subjectId: string, trackId: string) => {
    if (!confirm("Delete this track and all its lessons? This cannot be undone.")) return;

    setDeletingTrackId(trackId);
    try {
      const res = await fetch(`/api/subjects/${subjectId}/tracks/${trackId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchTracks(subjectId);
        fetchSubjects();
      }
    } catch {
      // ignore
    } finally {
      setDeletingTrackId(null);
    }
  };

  // ───── Render ─────

  if (loadingClass) {
    return (
      <div className="space-y-3">
        <div className="h-16 rounded-lg border bg-muted animate-pulse" />
        <div className="h-40 rounded-lg border bg-muted animate-pulse" />
      </div>
    );
  }

  if (!classInfo) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
        Class not found or you don&apos;t have access.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Class Header */}
      <div>
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-semibold">{classInfo.name}</h2>
          {!classInfo.isActive && (
            <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded">
              Inactive
            </span>
          )}
        </div>
        {classInfo.description && (
          <p className="text-muted-foreground mt-1">{classInfo.description}</p>
        )}
        <div className="flex items-center gap-3 mt-2">
          <p className="text-xs text-muted-foreground">
            Invite code:{" "}
            <code className="bg-muted px-2 py-0.5 rounded font-mono tracking-wider">
              {classInfo.inviteCode}
            </code>
          </p>
          <Link href={`/teacher/classes/${classId}/analytics`}>
            <Button variant="outline" size="sm">
              Analytics
            </Button>
          </Link>
        </div>
      </div>

      {/* Subjects Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Subjects</h3>
          <Button
            onClick={() => setShowSubjectForm(!showSubjectForm)}
            variant={showSubjectForm ? "outline" : "default"}
            size="sm"
          >
            {showSubjectForm ? "Cancel" : "Add Subject"}
          </Button>
        </div>

        {/* Create Subject Form */}
        {showSubjectForm && (
          <form
            onSubmit={handleCreateSubject}
            className="rounded-lg border p-4 space-y-4 bg-card"
          >
            <div className="space-y-2">
              <Label htmlFor="subject-name">Subject Name</Label>
              <Input
                id="subject-name"
                placeholder="e.g. Calculus, Linear Algebra"
                value={subjectName}
                onChange={(e) => setSubjectName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject-desc">Description (optional)</Label>
              <Input
                id="subject-desc"
                placeholder="Brief description"
                value={subjectDesc}
                onChange={(e) => setSubjectDesc(e.target.value)}
              />
            </div>
            {subjectError && (
              <p className="text-sm text-red-500">{subjectError}</p>
            )}
            <Button type="submit" disabled={creatingSubject || !subjectName.trim()}>
              {creatingSubject ? "Creating..." : "Create Subject"}
            </Button>
          </form>
        )}

        {/* Subject List */}
        {loadingSubjects ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="h-16 rounded-lg border bg-muted animate-pulse"
              />
            ))}
          </div>
        ) : subjects.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
            No subjects yet. Add your first subject to start organizing course
            material.
          </div>
        ) : (
          <div className="space-y-3">
            {subjects.map((subject) => (
              <div key={subject.id} className="rounded-lg border overflow-hidden">
                {/* Subject Row */}
                {editingSubjectId === subject.id ? (
                  /* --- Subject Editing Mode --- */
                  <div className="p-4 space-y-3 bg-card">
                    <div className="space-y-2">
                      <Label>Subject Name</Label>
                      <Input
                        value={editSubjectName}
                        onChange={(e) => setEditSubjectName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Input
                        value={editSubjectDesc}
                        onChange={(e) => setEditSubjectDesc(e.target.value)}
                        placeholder="Optional description"
                      />
                    </div>
                    {editSubjectError && (
                      <p className="text-sm text-red-500">{editSubjectError}</p>
                    )}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleSaveSubject(subject.id)}
                        disabled={savingSubject || !editSubjectName.trim()}
                      >
                        {savingSubject ? "Saving..." : "Save"}
                      </Button>
                      <Button size="sm" variant="outline" onClick={cancelEditingSubject}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  /* --- Subject Display Mode --- */
                  <div className="p-4 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <h4 className="font-medium truncate">{subject.name}</h4>
                      {subject.description && (
                        <p className="text-sm text-muted-foreground truncate">
                          {subject.description}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {subject._count.courses} course
                        {subject._count.courses !== 1 ? "s" : ""} ·{" "}
                        {subject._count.tracks} track
                        {subject._count.tracks !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => startEditingSubject(subject)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant={expandedSubjectId === subject.id && expandedPanel === "courses" ? "default" : "outline"}
                        size="sm"
                        onClick={() => togglePanel(subject.id, "courses")}
                      >
                        Courses
                      </Button>
                      <Button
                        variant={expandedSubjectId === subject.id && expandedPanel === "tracks" ? "default" : "outline"}
                        size="sm"
                        onClick={() => togglePanel(subject.id, "tracks")}
                      >
                        Tracks
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => handleDeleteSubject(subject.id)}
                        disabled={deletingSubjectId === subject.id}
                      >
                        {deletingSubjectId === subject.id ? "Deleting..." : "Delete"}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Expanded: Courses Panel */}
                {expandedSubjectId === subject.id && expandedPanel === "courses" && (
                  <div className="border-t px-4 py-4 bg-muted/30 space-y-4">
                    {/* Upload Button / Form */}
                    {uploadingSubjectId === subject.id ? (
                      <form
                        onSubmit={(e) => handleUpload(e, subject.id)}
                        className="rounded-lg border p-4 space-y-3 bg-card"
                      >
                        <div className="space-y-2">
                          <Label htmlFor="course-title">Course Title</Label>
                          <Input
                            id="course-title"
                            placeholder="e.g. Chapter 1 - Introduction"
                            value={uploadTitle}
                            onChange={(e) => setUploadTitle(e.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="course-file">PDF File</Label>
                          <Input
                            id="course-file"
                            type="file"
                            accept="application/pdf"
                            ref={fileInputRef}
                            onChange={(e) =>
                              setUploadFile(e.target.files?.[0] ?? null)
                            }
                            required
                          />
                          <p className="text-xs text-muted-foreground">
                            Max 10 MB, PDF only
                          </p>
                        </div>
                        {uploadError && (
                          <p className="text-sm text-red-500">{uploadError}</p>
                        )}
                        <div className="flex gap-2">
                          <Button
                            type="submit"
                            size="sm"
                            disabled={
                              uploading || !uploadTitle.trim() || !uploadFile
                            }
                          >
                            {uploading ? "Uploading..." : "Upload"}
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={cancelUpload}
                          >
                            Cancel
                          </Button>
                        </div>
                      </form>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => startUpload(subject.id)}
                      >
                        Upload PDF
                      </Button>
                    )}

                    {/* Course List */}
                    {loadingCourses ? (
                      <p className="text-sm text-muted-foreground">
                        Loading courses...
                      </p>
                    ) : courses.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No courses uploaded yet.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Uploaded Courses ({courses.length})
                        </p>
                        {courses.map((course) => (
                          <div
                            key={course.id}
                            className="flex items-center justify-between py-2 px-3 rounded-md border bg-card"
                          >
                            {editingCourseId === course.id ? (
                              /* --- Course Editing Mode --- */
                              <div className="flex-1 space-y-2">
                                <div className="flex gap-2">
                                  <Input
                                    value={editCourseTitle}
                                    onChange={(e) => setEditCourseTitle(e.target.value)}
                                    className="text-sm h-8"
                                  />
                                  <Button
                                    size="sm"
                                    className="h-8"
                                    onClick={() => handleSaveCourse(subject.id, course.id)}
                                    disabled={savingCourse || !editCourseTitle.trim()}
                                  >
                                    {savingCourse ? "Saving..." : "Save"}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8"
                                    onClick={cancelEditingCourse}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                                {editCourseError && (
                                  <p className="text-xs text-red-500">{editCourseError}</p>
                                )}
                              </div>
                            ) : (
                              /* --- Course Display Mode --- */
                              <>
                                <div className="min-w-0">
                                  <p className="text-sm font-medium truncate">
                                    {course.title}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {course.pdfFilename ?? "Unknown file"} ·{" "}
                                    {formatFileSize(course.fileSize)} ·{" "}
                                    {new Date(course.uploadedAt).toLocaleDateString()}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <a
                                    href={course.pdfUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-blue-600 hover:underline"
                                  >
                                    View
                                  </a>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-xs"
                                    onClick={() => startEditingCourse(course)}
                                  >
                                    Edit
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-xs text-red-500 hover:text-red-600 hover:bg-red-50"
                                    onClick={() =>
                                      handleDeleteCourse(subject.id, course.id)
                                    }
                                    disabled={deletingCourseId === course.id}
                                  >
                                    {deletingCourseId === course.id
                                      ? "Deleting..."
                                      : "Delete"}
                                  </Button>
                                </div>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Expanded: Tracks Panel */}
                {expandedSubjectId === subject.id && expandedPanel === "tracks" && (
                  <div className="border-t px-4 py-4 bg-muted/30 space-y-4">
                    {/* Create Track Form / Button */}
                    {showTrackForm ? (
                      <form
                        onSubmit={(e) => handleCreateTrack(e, subject.id)}
                        className="rounded-lg border p-4 space-y-3 bg-card"
                      >
                        <div className="space-y-2">
                          <Label htmlFor="track-name">Track Name</Label>
                          <Input
                            id="track-name"
                            placeholder="e.g. Week 1 - Basics"
                            value={trackName}
                            onChange={(e) => setTrackName(e.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="track-desc">Description (optional)</Label>
                          <Input
                            id="track-desc"
                            placeholder="Brief description"
                            value={trackDesc}
                            onChange={(e) => setTrackDesc(e.target.value)}
                          />
                        </div>
                        {trackError && (
                          <p className="text-sm text-red-500">{trackError}</p>
                        )}
                        <div className="flex gap-2">
                          <Button
                            type="submit"
                            size="sm"
                            disabled={creatingTrack || !trackName.trim()}
                          >
                            {creatingTrack ? "Creating..." : "Create Track"}
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => { setShowTrackForm(false); setTrackError(null); }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </form>
                    ) : (
                      <Button size="sm" onClick={() => setShowTrackForm(true)}>
                        Add Track
                      </Button>
                    )}

                    {/* Track List */}
                    {loadingTracks ? (
                      <p className="text-sm text-muted-foreground">Loading tracks...</p>
                    ) : tracks.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No tracks yet.</p>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Tracks ({tracks.length})
                        </p>
                        {tracks.map((track) => (
                          <div
                            key={track.id}
                            className="py-2 px-3 rounded-md border bg-card"
                          >
                            {editingTrackId === track.id ? (
                              /* --- Track Editing Mode --- */
                              <div className="space-y-2">
                                <Input
                                  value={editTrackName}
                                  onChange={(e) => setEditTrackName(e.target.value)}
                                  className="text-sm h-8"
                                  placeholder="Track name"
                                />
                                <Input
                                  value={editTrackDesc}
                                  onChange={(e) => setEditTrackDesc(e.target.value)}
                                  className="text-sm h-8"
                                  placeholder="Description (optional)"
                                />
                                {editTrackError && (
                                  <p className="text-xs text-red-500">{editTrackError}</p>
                                )}
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    className="h-8"
                                    onClick={() => handleSaveTrack(subject.id, track.id)}
                                    disabled={savingTrack || !editTrackName.trim()}
                                  >
                                    {savingTrack ? "Saving..." : "Save"}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8"
                                    onClick={cancelEditingTrack}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              /* --- Track Display Mode --- */
                              <div className="flex items-center justify-between gap-3">
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <p className="text-sm font-medium truncate">{track.name}</p>
                                    <span
                                      className={`text-[10px] px-1.5 py-0.5 rounded ${
                                        track.isPublished
                                          ? "bg-green-100 text-green-700"
                                          : "bg-amber-100 text-amber-700"
                                      }`}
                                    >
                                      {track.isPublished ? "Published" : "Draft"}
                                    </span>
                                  </div>
                                  {track.description && (
                                    <p className="text-xs text-muted-foreground truncate">
                                      {track.description}
                                    </p>
                                  )}
                                  <p className="text-xs text-muted-foreground mt-0.5">
                                    {track._count.lessons} lesson{track._count.lessons !== 1 ? "s" : ""}
                                  </p>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <a
                                    href={`/teacher/tracks/${track.id}`}
                                    className="inline-flex items-center justify-center rounded-md text-xs font-medium h-8 px-3 border hover:bg-accent"
                                  >
                                    Manage Lessons
                                  </a>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-xs h-8"
                                    onClick={() => handleTogglePublish(subject.id, track.id, track.isPublished)}
                                  >
                                    {track.isPublished ? "Unpublish" : "Publish"}
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-xs h-8"
                                    onClick={() => startEditingTrack(track)}
                                  >
                                    Edit
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-xs text-red-500 hover:text-red-600 hover:bg-red-50 h-8"
                                    onClick={() => handleDeleteTrack(subject.id, track.id)}
                                    disabled={deletingTrackId === track.id}
                                  >
                                    {deletingTrackId === track.id ? "..." : "Delete"}
                                  </Button>
                                </div>
                              </div>
                            )}
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
    </div>
  );
}
