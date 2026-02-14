"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Star,
  Lock,
  Check,
  Play,
  ArrowLeft,
  Trophy,
  BookOpen,
  BrainCircuit,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ───── Types ───── */

type LessonItem = {
  id: string;
  position: number;
  title: string;
  description: string | null;
  lessonType: "QUIZ" | "YES_NO" | "SHORT_ANSWER";
  difficulty: number;
  xpReward: number;
  targetAttributes: string[];
  isCompleted: boolean;
  finalScore: number | null;
};

type TrackInfo = {
  id: string;
  name: string;
  description: string | null;
};

/* ───── Constants ───── */

const DIFFICULTY_LABELS = ["", "Easy", "Medium", "Hard"];

/* ───── Level Node Component ───── */

function LevelNode({
  lesson,
  x,
  y,
  unlocked,
  onClick,
  index,
}: {
  lesson: LessonItem;
  x: number;
  y: number;
  unlocked: boolean;
  onClick: () => void;
  index: number;
}) {
  const isLocked = !unlocked && !lesson.isCompleted;
  const isCompleted = lesson.isCompleted;
  const isCurrent = unlocked && !isCompleted;

  // Stars based on score
  const stars = isCompleted && lesson.finalScore !== null
    ? lesson.finalScore >= 90 ? 3 : lesson.finalScore >= 60 ? 2 : 1
    : 0;

  // Icon based on lesson type
  const Icon = lesson.lessonType === "QUIZ"
    ? BrainCircuit
    : lesson.lessonType === "YES_NO"
      ? Trophy
      : BookOpen;

  // Small rotation for hand-drawn wobble
  const wobbleRotate = index % 3 === 0 ? -2 : index % 3 === 1 ? 1 : -1;

  return (
    <div
      className="absolute flex flex-col items-center w-28 md:w-36 transform -translate-x-1/2 -translate-y-1/2 z-10"
      style={{ left: `${x}%`, top: y }}
    >
      {/* The Node Button */}
      <motion.button
        initial={{ scale: 0, rotate: wobbleRotate * 3 }}
        animate={{ scale: 1, rotate: wobbleRotate }}
        transition={{ delay: index * 0.08, type: "spring", stiffness: 200, damping: 15 }}
        whileHover={{ scale: isLocked ? 1 : 1.15, rotate: isLocked ? wobbleRotate : wobbleRotate - 4 }}
        whileTap={{ scale: isLocked ? 1 : 0.9 }}
        onClick={() => !isLocked && onClick()}
        className={cn(
          "relative flex items-center justify-center w-16 h-16 md:w-20 md:h-20 transition-all duration-100",
          // Wobbly shape + borders
          "border-[3px] border-foreground",

          isCompleted && "bg-primary text-primary-foreground shadow-[4px_4px_0px_0px_#2d2d2d] hover:shadow-[2px_2px_0px_0px_#2d2d2d] hover:translate-x-[2px] hover:translate-y-[2px]",
          isCurrent && "bg-accent text-accent-foreground shadow-[6px_6px_0px_0px_#2d2d2d] hover:shadow-[3px_3px_0px_0px_#2d2d2d] hover:translate-x-[3px] hover:translate-y-[3px] ring-4 ring-accent/20",
          isLocked && "bg-muted text-muted-foreground border-dashed cursor-not-allowed opacity-70 border-2"
        )}
        style={{
          borderRadius:
            index % 2 === 0
              ? "255px 15px 225px 15px / 15px 225px 15px 255px"
              : "15px 255px 15px 225px / 225px 15px 255px 15px",
        }}
      >
        {isLocked ? (
          <Lock size={22} strokeWidth={2.5} />
        ) : isCompleted ? (
          <Check size={28} strokeWidth={3} />
        ) : (
          <Play size={24} fill="currentColor" className="ml-0.5" strokeWidth={2.5} />
        )}

        {/* Pulsing ring for current level */}
        {isCurrent && (
          <span className="absolute inset-0 rounded-full border-2 border-accent animate-ping opacity-30" />
        )}

        {/* Stars for completed levels */}
        {isCompleted && stars > 0 && (
          <div className="absolute -bottom-3 flex gap-0.5 z-20">
            {[0, 1, 2].map((i) => (
              <Star
                key={i}
                size={13}
                strokeWidth={2.5}
                className={cn(
                  i < stars
                    ? "text-yellow-500 fill-yellow-400 drop-shadow-sm"
                    : "text-muted-foreground/30 fill-muted/30"
                )}
              />
            ))}
          </div>
        )}
      </motion.button>

      {/* Label */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.08 + 0.15 }}
        className={cn(
          "mt-4 px-2.5 py-1 text-[11px] md:text-xs font-heading font-bold text-center border-2 border-foreground bg-background shadow-[2px_2px_0px_0px_#2d2d2d] z-20 max-w-[120px] leading-tight",
          isLocked && "opacity-50",
        )}
        style={{
          borderRadius: "25px 50px 25px 50px / 50px 25px 50px 25px",
          transform: `rotate(${wobbleRotate}deg)`,
        }}
      >
        {lesson.title}
      </motion.div>

      {/* XP & Difficulty Pill (non-locked only) */}
      {!isLocked && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: index * 0.08 + 0.3 }}
          className="mt-1.5 text-[10px] font-body text-muted-foreground flex items-center gap-1.5"
        >
          <span>{lesson.xpReward} XP</span>
          <span>·</span>
          <span>{DIFFICULTY_LABELS[lesson.difficulty]}</span>
        </motion.div>
      )}
    </div>
  );
}

/* ───── Main Track Client ───── */

export function StudentTrackClient({ trackId }: { trackId: string }) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  const [track, setTrack] = useState<TrackInfo | null>(null);
  const [lessons, setLessons] = useState<LessonItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLessons = useCallback(async () => {
    try {
      const res = await fetch(`/api/tracks/${trackId}/lessons`);
      const data = await res.json();
      if (res.ok) {
        setTrack(data.track);
        setLessons(data.lessons);
      } else {
        setError(data.error || "Failed to load track");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [trackId]);

  useEffect(() => {
    fetchLessons();
  }, [fetchLessons]);

  // Unlock logic: sequential — position 1 or all prior completed
  const isUnlocked = useCallback(
    (lesson: LessonItem): boolean => {
      if (lesson.position === 1) return true;
      return lessons
        .filter((l) => l.position < lesson.position)
        .every((l) => l.isCompleted);
    },
    [lessons]
  );

  // Layout parameters (matching trackUIExample pattern)
  const nodeSpacing = 170;
  const amplitude = 30;
  const frequency = 0.55;
  const verticalPadding = 130;

  // Calculate node positions (winding path)
  const trackData = useMemo(() => {
    return lessons.map((lesson, index) => {
      const y = index * nodeSpacing + verticalPadding;
      const xNorm = Math.sin(index * frequency);
      const x = 50 + xNorm * amplitude;
      return { lesson, x, y, unlocked: isUnlocked(lesson) };
    });
  }, [lessons, isUnlocked]);

  const totalHeight = Math.max(500, trackData.length * nodeSpacing + verticalPadding * 2);

  // SVG path connecting nodes
  const pathString = useMemo(() => {
    if (trackData.length === 0) return "";
    let path = `M ${trackData[0].x * 10} ${trackData[0].y}`;
    for (let i = 0; i < trackData.length - 1; i++) {
      const curr = trackData[i];
      const next = trackData[i + 1];
      const cX = curr.x * 10;
      const cY = curr.y;
      const nX = next.x * 10;
      const nY = next.y;
      const cp1y = cY + nodeSpacing / 2;
      const cp2y = nY - nodeSpacing / 2;
      path += ` C ${cX} ${cp1y}, ${nX} ${cp2y}, ${nX} ${nY}`;
    }
    return path;
  }, [trackData]);

  // Progress line: path up to the last completed node
  const progressPath = useMemo(() => {
    const completedNodes = trackData.filter((d) => d.lesson.isCompleted);
    if (completedNodes.length === 0) return "";
    let path = `M ${trackData[0].x * 10} ${trackData[0].y}`;
    for (let i = 0; i < completedNodes.length; i++) {
      if (i === 0) continue;
      const prev = trackData[trackData.indexOf(completedNodes[i]) - 1] || completedNodes[i - 1];
      const curr = completedNodes[i];
      const pX = prev.x * 10;
      const pY = prev.y;
      const cX = curr.x * 10;
      const cY = curr.y;
      const cp1y = pY + nodeSpacing / 2;
      const cp2y = cY - nodeSpacing / 2;
      path += ` C ${pX} ${cp1y}, ${cX} ${cp2y}, ${cX} ${cY}`;
    }
    return path;
  }, [trackData]);

  const completedCount = lessons.filter((l) => l.isCompleted).length;
  const progressPercent = lessons.length > 0 ? Math.round((completedCount / lessons.length) * 100) : 0;

  /* ───── Loading ───── */

  if (loading) {
    return (
      <div className="space-y-4 py-8">
        <div className="h-16 bg-muted animate-pulse border-2 border-dashed border-muted-foreground/20" style={{ borderRadius: "255px 15px 225px 15px / 15px 225px 15px 255px" }} />
        <div className="h-[500px] bg-muted/50 animate-pulse border-2 border-dashed border-muted-foreground/20" style={{ borderRadius: "25px 50px 25px 50px / 50px 25px 50px 25px" }} />
      </div>
    );
  }

  /* ───── Error ───── */

  if (error || !track) {
    return (
      <div
        className="p-10 text-center border-[3px] border-dashed border-foreground bg-secondary font-heading text-xl text-muted-foreground"
        style={{ borderRadius: "255px 15px 225px 15px / 15px 225px 15px 255px" }}
      >
        {error || "Track not found"} 😕
      </div>
    );
  }

  /* ───── Empty ───── */

  if (lessons.length === 0) {
    return (
      <div className="space-y-6">
        <TrackHeader track={track} completedCount={0} totalCount={0} progressPercent={0} />
        <div
          className="p-16 text-center border-[3px] border-dashed border-foreground bg-secondary font-heading"
          style={{ borderRadius: "25px 50px 25px 50px / 50px 25px 50px 25px" }}
        >
          <p className="text-2xl mb-2">🏗️</p>
          <p className="text-lg text-muted-foreground">No lessons yet — ask your teacher!</p>
        </div>
      </div>
    );
  }

  /* ───── Render ───── */

  return (
    <div className="space-y-6">
      <TrackHeader
        track={track}
        completedCount={completedCount}
        totalCount={lessons.length}
        progressPercent={progressPercent}
      />

      {/* The Map */}
      <div
        className="relative w-full overflow-hidden border-[3px] border-foreground bg-background shadow-[6px_6px_0px_0px_#2d2d2d]"
        style={{
          height: totalHeight,
          borderRadius: "25px 50px 25px 50px / 50px 25px 50px 25px",
        }}
        ref={containerRef}
      >
        {/* Dot background texture */}
        <div className="absolute inset-0 pointer-events-none opacity-15 bg-[radial-gradient(#2d2d2d_1px,transparent_1px)] [background-size:20px_20px]" />

        {/* SVG Path Layer */}
        <svg
          className="absolute top-0 left-0 w-full h-full pointer-events-none z-0"
          viewBox={`0 0 1000 ${totalHeight}`}
          preserveAspectRatio="none"
        >
          {/* Background path (full trail) — dashed */}
          <path
            d={pathString}
            fill="none"
            stroke="#2d2d2d"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray="16 16"
            opacity={0.12}
          />
          {/* Progress path (completed trail) — solid */}
          {progressPath && (
            <path
              d={progressPath}
              fill="none"
              stroke="#2d5da1"
              strokeWidth="8"
              strokeLinecap="round"
              opacity={0.35}
            />
          )}
        </svg>

        {/* "Start" indicator */}
        <div
          className="absolute top-8 left-1/2 -translate-x-1/2 font-heading text-xl md:text-2xl text-muted-foreground/40 select-none -rotate-2 z-0"
        >
          ✏️ Start here
        </div>

        {/* Nodes */}
        {trackData.map((node, index) => (
          <LevelNode
            key={node.lesson.id}
            lesson={node.lesson}
            x={node.x}
            y={node.y}
            unlocked={node.unlocked}
            index={index}
            onClick={() => router.push(`/student/lessons/${node.lesson.id}`)}
          />
        ))}

        {/* "Finish" indicator at bottom */}
        {trackData.length > 0 && (
          <div
            className="absolute left-1/2 -translate-x-1/2 font-heading text-xl text-muted-foreground/40 select-none rotate-1 z-0"
            style={{ top: trackData[trackData.length - 1].y + 90 }}
          >
            🏁 Finish
          </div>
        )}
      </div>
    </div>
  );
}

/* ───── Track Header ───── */

function TrackHeader({
  track,
  completedCount,
  totalCount,
  progressPercent,
}: {
  track: TrackInfo;
  completedCount: number;
  totalCount: number;
  progressPercent: number;
}) {
  return (
    <div className="space-y-4">
      {/* Back + Title */}
      <div className="flex items-center gap-3">
        <Link
          href="/student"
          className="p-2 -ml-2 border-2 border-transparent hover:border-foreground hover:bg-secondary hover:shadow-[2px_2px_0px_0px_#2d2d2d] transition-all duration-100"
          style={{ borderRadius: "255px 15px 225px 15px / 15px 225px 15px 255px" }}
        >
          <ArrowLeft className="h-5 w-5" strokeWidth={2.5} />
        </Link>
        <div>
          <h1 className="font-heading text-2xl md:text-3xl text-foreground">{track.name}</h1>
          {track.description && (
            <p className="text-sm font-body text-muted-foreground mt-0.5">{track.description}</p>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div
        className="flex items-center gap-4 px-4 py-3 border-[3px] border-foreground bg-secondary shadow-[3px_3px_0px_0px_#2d2d2d]"
        style={{ borderRadius: "25px 50px 25px 50px / 50px 25px 50px 25px" }}
      >
        <div className="flex-1 space-y-1">
          <div className="flex justify-between text-sm font-heading font-bold">
            <span>Progress</span>
            <span>
              {completedCount}/{totalCount} · {progressPercent}%
            </span>
          </div>
          <div
            className="h-3 border-2 border-foreground bg-background overflow-hidden"
            style={{ borderRadius: "255px 15px 225px 15px / 15px 225px 15px 255px" }}
          >
            <div
              className="h-full bg-primary transition-all duration-700 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
