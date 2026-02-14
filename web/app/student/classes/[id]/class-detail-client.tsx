"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
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

export function StudentClassDetailClient({ classId }: { classId: string }) {
  // Class info
  const [classInfo, setClassInfo] = useState<ClassInfo | null>(null);
  const [loadingClass, setLoadingClass] = useState(true);

  // Subjects
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(true);

  // Expanded subject → courses
  const [expandedSubjectId, setExpandedSubjectId] = useState<string | null>(null);
  const [expandedPanel, setExpandedPanel] = useState<"courses" | "tracks" | null>(null);
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [tracks, setTracks] = useState<TrackItem[]>([]);
  const [loadingTracks, setLoadingTracks] = useState(false);

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
        <h2 className="text-2xl font-semibold">{classInfo.name}</h2>
        {classInfo.description && (
          <p className="text-muted-foreground mt-1">{classInfo.description}</p>
        )}
      </div>

      {/* Subjects Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Subjects</h3>

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
            No subjects available yet. Your teacher hasn&apos;t added any
            subjects to this class.
          </div>
        ) : (
          <div className="space-y-3">
            {subjects.map((subject) => (
              <div key={subject.id} className="rounded-lg border overflow-hidden">
                {/* Subject Row */}
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
                  </div>
                </div>

                {/* Expanded: Courses Panel */}
                {expandedSubjectId === subject.id && expandedPanel === "courses" && (
                  <div className="border-t px-4 py-4 bg-muted/30 space-y-3">
                    {loadingCourses ? (
                      <p className="text-sm text-muted-foreground">
                        Loading courses...
                      </p>
                    ) : courses.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No course materials uploaded yet.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Course Materials ({courses.length})
                        </p>
                        {courses.map((course) => (
                          <div
                            key={course.id}
                            className="flex items-center justify-between py-2 px-3 rounded-md border bg-card"
                          >
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">
                                {course.title}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {course.pdfFilename ?? "PDF"} ·{" "}
                                {formatFileSize(course.fileSize)} ·{" "}
                                {new Date(
                                  course.uploadedAt
                                ).toLocaleDateString()}
                              </p>
                            </div>
                            <a
                              href={course.pdfUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="shrink-0 ml-3 text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
                            >
                              Open PDF
                            </a>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Expanded: Tracks Panel */}
                {expandedSubjectId === subject.id && expandedPanel === "tracks" && (
                  <div className="border-t px-4 py-4 bg-muted/30 space-y-3">
                    {loadingTracks ? (
                      <p className="text-sm text-muted-foreground">
                        Loading tracks...
                      </p>
                    ) : tracks.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No learning tracks available yet.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Learning Tracks ({tracks.length})
                        </p>
                        {tracks.map((track) => (
                          <div
                            key={track.id}
                            className="flex items-center justify-between py-2 px-3 rounded-md border bg-card"
                          >
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">
                                {track.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {track._count.lessons} lesson
                                {track._count.lessons !== 1 ? "s" : ""}
                              </p>
                            </div>
                            <Link
                              href={`/student/tracks/${track.id}`}
                              className="shrink-0 ml-3 inline-flex items-center justify-center rounded-md text-sm font-medium h-8 px-4 bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                            >
                              Open Track
                            </Link>
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
