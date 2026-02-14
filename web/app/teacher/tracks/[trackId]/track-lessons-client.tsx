"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// ───── Types ─────

type LessonItem = {
  id: string;
  position: number;
  title: string;
  description: string | null;
  lessonType: "QUIZ" | "YES_NO" | "SHORT_ANSWER";
  difficulty: number;
  xpReward: number;
  content: QuizContent | YesNoContent | ShortAnswerContent;
  targetAttributes: string[];
  createdAt: string;
};

type QuizContent = {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
};

type YesNoContent = {
  question: string;
  correctAnswer: boolean;
  explanation?: string;
};

type ShortAnswerContent = {
  question: string;
  sampleAnswers?: string[];
  keywords: string[];
  explanation?: string;
};

type TrackInfo = {
  id: string;
  name: string;
  description: string | null;
};

const LESSON_TYPES = [
  { value: "QUIZ", label: "Multiple Choice" },
  { value: "YES_NO", label: "Yes / No" },
  { value: "SHORT_ANSWER", label: "Short Answer" },
] as const;

const DIFFICULTY_LABELS = ["", "Easy", "Medium", "Hard"];

// ───── Component ─────

export function TrackLessonsClient({ trackId }: { trackId: string }) {
  const [track, setTrack] = useState<TrackInfo | null>(null);
  const [lessons, setLessons] = useState<LessonItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Create lesson form
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState<"QUIZ" | "YES_NO" | "SHORT_ANSWER">("QUIZ");
  const [formTitle, setFormTitle] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formDifficulty, setFormDifficulty] = useState(1);
  const [formQuestion, setFormQuestion] = useState("");
  const [formExplanation, setFormExplanation] = useState("");
  const [formTargetAttrs, setFormTargetAttrs] = useState("");

  // Quiz-specific
  const [formOptions, setFormOptions] = useState(["", "", "", ""]);
  const [formCorrectIndex, setFormCorrectIndex] = useState(0);

  // Yes/No-specific
  const [formCorrectBool, setFormCorrectBool] = useState(true);

  // Short answer-specific
  const [formKeywords, setFormKeywords] = useState("");
  const [formSampleAnswer, setFormSampleAnswer] = useState("");

  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Editing
  const [expandedLessonId, setExpandedLessonId] = useState<string | null>(null);
  const [deletingLessonId, setDeletingLessonId] = useState<string | null>(null);

  // AI Generation
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [aiFile, setAiFile] = useState<File | null>(null);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiQuestions, setAiQuestions] = useState<
    { question: string; options: string[]; correctAnswer: number }[]
  >([]);
  const [aiSelected, setAiSelected] = useState<Set<number>>(new Set());
  const [aiBulkCreating, setAiBulkCreating] = useState(false);

  // ───── Fetch ─────

  const fetchLessons = useCallback(async () => {
    try {
      const res = await fetch(`/api/tracks/${trackId}/lessons`);
      const data = await res.json();
      if (res.ok) {
        setLessons(data.lessons);
        setTrack(data.track);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [trackId]);

  useEffect(() => {
    fetchLessons();
  }, [fetchLessons]);

  // ───── Create lesson ─────

  const resetForm = () => {
    setFormTitle("");
    setFormDesc("");
    setFormDifficulty(1);
    setFormQuestion("");
    setFormExplanation("");
    setFormTargetAttrs("");
    setFormOptions(["", "", "", ""]);
    setFormCorrectIndex(0);
    setFormCorrectBool(true);
    setFormKeywords("");
    setFormSampleAnswer("");
    setFormError(null);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setFormError(null);

    // Build content based on type
    let content: Record<string, unknown> = {};

    if (formType === "QUIZ") {
      const filledOptions = formOptions.map((o) => o.trim()).filter(Boolean);
      if (filledOptions.length < 2) {
        setFormError("At least 2 options are required");
        setCreating(false);
        return;
      }
      content = {
        question: formQuestion.trim(),
        options: filledOptions,
        correctAnswer: formCorrectIndex,
        ...(formExplanation.trim() && { explanation: formExplanation.trim() }),
      };
    } else if (formType === "YES_NO") {
      content = {
        question: formQuestion.trim(),
        correctAnswer: formCorrectBool,
        ...(formExplanation.trim() && { explanation: formExplanation.trim() }),
      };
    } else if (formType === "SHORT_ANSWER") {
      const kws = formKeywords
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean);
      if (kws.length === 0) {
        setFormError("At least 1 keyword is required");
        setCreating(false);
        return;
      }
      content = {
        question: formQuestion.trim(),
        keywords: kws,
        ...(formSampleAnswer.trim() && {
          sampleAnswers: [formSampleAnswer.trim()],
        }),
        ...(formExplanation.trim() && { explanation: formExplanation.trim() }),
      };
    }

    const targetAttributes = formTargetAttrs
      .split(",")
      .map((a) => a.trim())
      .filter(Boolean);

    try {
      const res = await fetch(`/api/tracks/${trackId}/lessons`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formTitle.trim(),
          description: formDesc.trim() || null,
          lessonType: formType,
          difficulty: formDifficulty,
          content,
          targetAttributes,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setFormError(data.error || "Failed to create lesson");
        return;
      }

      resetForm();
      setShowForm(false);
      fetchLessons();
    } catch {
      setFormError("Something went wrong");
    } finally {
      setCreating(false);
    }
  };

  // ───── Delete lesson ─────

  const handleDelete = async (lessonId: string) => {
    if (!confirm("Delete this lesson? This cannot be undone.")) return;

    setDeletingLessonId(lessonId);
    try {
      const res = await fetch(
        `/api/tracks/${trackId}/lessons/${lessonId}`,
        { method: "DELETE" }
      );
      if (res.ok) fetchLessons();
    } catch {
      // ignore
    } finally {
      setDeletingLessonId(null);
    }
  };

  // ───── AI Quiz Generation ─────

  const handleAIGenerate = async () => {
    if (!aiFile) return;
    setAiGenerating(true);
    setAiError(null);
    setAiQuestions([]);
    setAiSelected(new Set());

    try {
      const formData = new FormData();
      formData.append("file", aiFile);

      const res = await fetch("/api/ai/generate-quiz", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        setAiError(data.error || "Failed to generate quiz");
        return;
      }

      const questions = data.questions ?? [];
      if (questions.length === 0) {
        setAiError("No questions were generated. Try a different PDF.");
        return;
      }

      setAiQuestions(questions);
      // Select all by default
      setAiSelected(new Set(questions.map((_: unknown, i: number) => i)));
    } catch {
      setAiError("Could not reach the AI service. Make sure the backend is running.");
    } finally {
      setAiGenerating(false);
    }
  };

  const handleAIBulkCreate = async () => {
    const selectedQuestions = aiQuestions.filter((_, i) => aiSelected.has(i));
    if (selectedQuestions.length === 0) return;

    setAiBulkCreating(true);
    setAiError(null);

    let created = 0;
    for (const q of selectedQuestions) {
      try {
        const res = await fetch(`/api/tracks/${trackId}/lessons`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: q.question.slice(0, 60) + (q.question.length > 60 ? "…" : ""),
            description: null,
            lessonType: "QUIZ",
            difficulty: 1,
            content: {
              question: q.question,
              options: q.options,
              correctAnswer: q.correctAnswer,
            },
            targetAttributes: [],
          }),
        });
        if (res.ok) created++;
      } catch {
        // continue with the rest
      }
    }

    if (created > 0) {
      fetchLessons();
      setAiQuestions([]);
      setAiSelected(new Set());
      setAiFile(null);
      setShowAIPanel(false);
    } else {
      setAiError("Failed to create lessons. Please try again.");
    }

    setAiBulkCreating(false);
  };

  const toggleAISelect = (index: number) => {
    setAiSelected((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  // ───── Render helpers ─────

  const renderContentPreview = (lesson: LessonItem) => {
    const c = lesson.content;

    if (lesson.lessonType === "QUIZ") {
      const quiz = c as QuizContent;
      return (
        <div className="space-y-2 text-sm">
          <p className="font-medium">{quiz.question}</p>
          <div className="space-y-1 ml-2">
            {quiz.options.map((opt, i) => (
              <p key={i} className={i === quiz.correctAnswer ? "text-green-600 font-medium" : "text-muted-foreground"}>
                {i === quiz.correctAnswer ? "✓" : "○"} {opt}
              </p>
            ))}
          </div>
          {quiz.explanation && (
            <p className="text-xs text-muted-foreground italic">Explanation: {quiz.explanation}</p>
          )}
        </div>
      );
    }

    if (lesson.lessonType === "YES_NO") {
      const yn = c as YesNoContent;
      return (
        <div className="space-y-1 text-sm">
          <p className="font-medium">{yn.question}</p>
          <p className="text-green-600 text-xs">
            Correct answer: {yn.correctAnswer ? "Yes" : "No"}
          </p>
          {yn.explanation && (
            <p className="text-xs text-muted-foreground italic">Explanation: {yn.explanation}</p>
          )}
        </div>
      );
    }

    if (lesson.lessonType === "SHORT_ANSWER") {
      const sa = c as ShortAnswerContent;
      return (
        <div className="space-y-1 text-sm">
          <p className="font-medium">{sa.question}</p>
          <p className="text-xs text-muted-foreground">
            Keywords: {sa.keywords.join(", ")}
          </p>
          {sa.sampleAnswers?.[0] && (
            <p className="text-xs text-muted-foreground italic">Sample: {sa.sampleAnswers[0]}</p>
          )}
          {sa.explanation && (
            <p className="text-xs text-muted-foreground italic">Explanation: {sa.explanation}</p>
          )}
        </div>
      );
    }

    return null;
  };

  // ───── Render ─────

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-12 rounded-lg border bg-muted animate-pulse" />
        <div className="h-40 rounded-lg border bg-muted animate-pulse" />
      </div>
    );
  }

  if (!track) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
        Track not found or you don&apos;t have access.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Track Header */}
      <div>
        <h2 className="text-2xl font-semibold">{track.name}</h2>
        {track.description && (
          <p className="text-muted-foreground mt-1">{track.description}</p>
        )}
        <p className="text-xs text-muted-foreground mt-2">
          {lessons.length} lesson{lessons.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Lessons</h3>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => {
              setShowAIPanel(!showAIPanel);
              if (showForm) { resetForm(); setShowForm(false); }
            }}
            variant={showAIPanel ? "outline" : "default"}
            size="sm"
            className={!showAIPanel ? "bg-purple-600 hover:bg-purple-700 text-white" : ""}
          >
            {showAIPanel ? "Cancel AI" : "✨ Generate with AI"}
          </Button>
          <Button
            onClick={() => {
              if (showForm) {
                resetForm();
                setShowForm(false);
              } else {
                setShowForm(true);
                if (showAIPanel) setShowAIPanel(false);
              }
            }}
            variant={showForm ? "outline" : "default"}
            size="sm"
          >
            {showForm ? "Cancel" : "Add Lesson"}
          </Button>
        </div>
      </div>

      {/* AI Generation Panel */}
      {showAIPanel && (
        <div className="rounded-lg border-2 border-purple-200 bg-purple-50/50 p-5 space-y-4">
          <div>
            <h4 className="font-medium text-purple-900">Generate Lessons from PDF</h4>
            <p className="text-sm text-purple-700 mt-1">
              Upload a course PDF and AI will generate multiple-choice questions automatically.
            </p>
          </div>

          {/* File upload & generate */}
          {aiQuestions.length === 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => {
                    setAiFile(e.target.files?.[0] ?? null);
                    setAiError(null);
                  }}
                  className="text-sm file:mr-3 file:px-3 file:py-1.5 file:rounded-md file:border file:border-purple-300 file:bg-purple-100 file:text-purple-700 file:text-sm file:font-medium hover:file:bg-purple-200 file:cursor-pointer"
                />
                <Button
                  onClick={handleAIGenerate}
                  disabled={!aiFile || aiGenerating}
                  size="sm"
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  {aiGenerating ? "Generating…" : "Generate"}
                </Button>
              </div>
              {aiGenerating && (
                <p className="text-sm text-purple-600 animate-pulse">
                  🤖 AI is reading your PDF and generating questions… this may take a moment.
                </p>
              )}
            </div>
          )}

          {aiError && (
            <p className="text-sm text-red-600">{aiError}</p>
          )}

          {/* Generated questions review */}
          {aiQuestions.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-purple-900">
                  {aiQuestions.length} questions generated — review &amp; select which to add:
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (aiSelected.size === aiQuestions.length) setAiSelected(new Set());
                      else setAiSelected(new Set(aiQuestions.map((_, i) => i)));
                    }}
                    className="text-xs text-purple-600 hover:text-purple-800 underline"
                  >
                    {aiSelected.size === aiQuestions.length ? "Deselect All" : "Select All"}
                  </button>
                </div>
              </div>

              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                {aiQuestions.map((q, i) => (
                  <div
                    key={i}
                    className={`rounded-md border p-3 cursor-pointer transition-colors ${
                      aiSelected.has(i)
                        ? "border-purple-400 bg-white"
                        : "border-gray-200 bg-gray-50 opacity-60"
                    }`}
                    onClick={() => toggleAISelect(i)}
                  >
                    <div className="flex items-start gap-2">
                      <input
                        type="checkbox"
                        checked={aiSelected.has(i)}
                        onChange={() => toggleAISelect(i)}
                        className="mt-1 accent-purple-600"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="flex-1 min-w-0 text-sm">
                        <p className="font-medium">{q.question}</p>
                        <div className="mt-1 space-y-0.5 ml-2">
                          {q.options.map((opt, j) => (
                            <p
                              key={j}
                              className={j === q.correctAnswer ? "text-green-700 font-medium" : "text-muted-foreground"}
                            >
                              {j === q.correctAnswer ? "✓" : "○"} {opt}
                            </p>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Button
                  onClick={handleAIBulkCreate}
                  disabled={aiSelected.size === 0 || aiBulkCreating}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  {aiBulkCreating
                    ? "Creating…"
                    : `Add ${aiSelected.size} Lesson${aiSelected.size !== 1 ? "s" : ""} to Track`}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setAiQuestions([]); setAiSelected(new Set()); }}
                >
                  Discard
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create Lesson Form */}
      {showForm && (
        <form onSubmit={handleCreate} className="rounded-lg border p-5 space-y-4 bg-card">
          {/* Title & Description */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Lesson Title</Label>
              <Input
                placeholder="e.g. What is a derivative?"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Description (optional)</Label>
              <Input
                placeholder="Brief description"
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
              />
            </div>
          </div>

          {/* Type & Difficulty */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Question Type</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                value={formType}
                onChange={(e) => setFormType(e.target.value as typeof formType)}
              >
                {LESSON_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Difficulty</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                value={formDifficulty}
                onChange={(e) => setFormDifficulty(Number(e.target.value))}
              >
                <option value={1}>Easy (10 XP)</option>
                <option value={2}>Medium (20 XP)</option>
                <option value={3}>Hard (30 XP)</option>
              </select>
            </div>
          </div>

          {/* Question */}
          <div className="space-y-2">
            <Label>Question</Label>
            <textarea
              className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
              placeholder="Enter the question..."
              value={formQuestion}
              onChange={(e) => setFormQuestion(e.target.value)}
              required
            />
          </div>

          {/* Type-specific fields */}
          {formType === "QUIZ" && (
            <div className="space-y-3">
              <Label>Options</Label>
              {formOptions.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="correct"
                    checked={formCorrectIndex === i}
                    onChange={() => setFormCorrectIndex(i)}
                    className="accent-green-600"
                  />
                  <Input
                    placeholder={`Option ${i + 1}`}
                    value={opt}
                    onChange={(e) => {
                      const next = [...formOptions];
                      next[i] = e.target.value;
                      setFormOptions(next);
                    }}
                    className="text-sm h-8"
                  />
                  {formOptions.length > 2 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-xs text-red-500 h-8 px-2"
                      onClick={() => {
                        const next = formOptions.filter((_, j) => j !== i);
                        setFormOptions(next);
                        if (formCorrectIndex >= next.length) setFormCorrectIndex(0);
                      }}
                    >
                      ×
                    </Button>
                  )}
                </div>
              ))}
              {formOptions.length < 6 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => setFormOptions([...formOptions, ""])}
                >
                  + Add Option
                </Button>
              )}
              <p className="text-xs text-muted-foreground">
                Select the radio button next to the correct answer
              </p>
            </div>
          )}

          {formType === "YES_NO" && (
            <div className="space-y-2">
              <Label>Correct Answer</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="yesno"
                    checked={formCorrectBool === true}
                    onChange={() => setFormCorrectBool(true)}
                    className="accent-green-600"
                  />
                  Yes
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="yesno"
                    checked={formCorrectBool === false}
                    onChange={() => setFormCorrectBool(false)}
                    className="accent-green-600"
                  />
                  No
                </label>
              </div>
            </div>
          )}

          {formType === "SHORT_ANSWER" && (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Keywords (comma separated)</Label>
                <Input
                  placeholder="e.g. photosynthesis, chlorophyll, sunlight"
                  value={formKeywords}
                  onChange={(e) => setFormKeywords(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Student&apos;s answer is correct if 50%+ of keywords are present
                </p>
              </div>
              <div className="space-y-2">
                <Label>Sample Answer (optional)</Label>
                <textarea
                  className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                  placeholder="A complete sample answer for reference"
                  value={formSampleAnswer}
                  onChange={(e) => setFormSampleAnswer(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Explanation */}
          <div className="space-y-2">
            <Label>Explanation (optional)</Label>
            <textarea
              className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
              placeholder="Shown to the student after answering"
              value={formExplanation}
              onChange={(e) => setFormExplanation(e.target.value)}
            />
          </div>

          {/* Target Attributes */}
          <div className="space-y-2">
            <Label>Target Attributes (optional, comma separated)</Label>
            <Input
              placeholder="e.g. algebra, derivatives"
              value={formTargetAttrs}
              onChange={(e) => setFormTargetAttrs(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Used to identify student weaknesses when they answer incorrectly
            </p>
          </div>

          {formError && <p className="text-sm text-red-500">{formError}</p>}

          <Button
            type="submit"
            disabled={creating || !formTitle.trim() || !formQuestion.trim()}
          >
            {creating ? "Creating..." : "Create Lesson"}
          </Button>
        </form>
      )}

      {/* Lesson List */}
      {lessons.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          No lessons yet. Add your first lesson to this track.
        </div>
      ) : (
        <div className="space-y-2">
          {lessons.map((lesson) => (
            <div key={lesson.id} className="rounded-lg border overflow-hidden">
              {/* Lesson row */}
              <div
                className="p-4 flex items-center justify-between gap-4 cursor-pointer hover:bg-muted/40 transition-colors"
                onClick={() =>
                  setExpandedLessonId(
                    expandedLessonId === lesson.id ? null : lesson.id
                  )
                }
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xs font-mono text-muted-foreground w-6 text-center shrink-0">
                    {lesson.position}
                  </span>
                  <div className="min-w-0">
                    <p className="font-medium truncate text-sm">{lesson.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                        {LESSON_TYPES.find((t) => t.value === lesson.lessonType)?.label}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                        {DIFFICULTY_LABELS[lesson.difficulty]}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {lesson.xpReward} XP
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-red-500 hover:text-red-600 hover:bg-red-50"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(lesson.id);
                    }}
                    disabled={deletingLessonId === lesson.id}
                  >
                    {deletingLessonId === lesson.id ? "..." : "Delete"}
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    {expandedLessonId === lesson.id ? "▲" : "▼"}
                  </span>
                </div>
              </div>

              {/* Expanded content preview */}
              {expandedLessonId === lesson.id && (
                <div className="border-t px-4 py-4 bg-muted/30 space-y-3">
                  {lesson.description && (
                    <p className="text-sm text-muted-foreground">{lesson.description}</p>
                  )}
                  {renderContentPreview(lesson)}
                  {lesson.targetAttributes.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Target attributes: {lesson.targetAttributes.join(", ")}
                    </p>
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
