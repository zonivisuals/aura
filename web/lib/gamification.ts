import { prismaClient } from "@/lib/prisma/prisma";
import { randomUUID } from "crypto";

// ═══════════════════════════════════════════
// XP & LEVEL SYSTEM
// ═══════════════════════════════════════════

/**
 * Level thresholds: level N requires LEVEL_THRESHOLDS[N-1] total XP.
 * Level 1 = 0 XP, Level 2 = 100 XP, etc.
 * Follows a quadratic curve for increasing difficulty.
 */
const LEVEL_THRESHOLDS = [
  0,     // Level 1
  100,   // Level 2
  250,   // Level 3
  500,   // Level 4
  800,   // Level 5
  1200,  // Level 6
  1700,  // Level 7
  2300,  // Level 8
  3000,  // Level 9
  4000,  // Level 10
  5200,  // Level 11
  6600,  // Level 12
  8200,  // Level 13
  10000, // Level 14
  12500, // Level 15
  15500, // Level 16
  19000, // Level 17
  23000, // Level 18
  28000, // Level 19
  35000, // Level 20
];

export function calculateLevel(totalXp: number): number {
  let level = 1;
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (totalXp >= LEVEL_THRESHOLDS[i]) {
      level = i + 1;
      break;
    }
  }
  return level;
}

export function getXpForNextLevel(currentLevel: number): number {
  if (currentLevel >= LEVEL_THRESHOLDS.length) return Infinity;
  return LEVEL_THRESHOLDS[currentLevel]; // next level threshold
}

export function getLevelProgress(totalXp: number): {
  level: number;
  currentXp: number;
  xpForCurrentLevel: number;
  xpForNextLevel: number;
  progressPercent: number;
} {
  const level = calculateLevel(totalXp);
  const xpForCurrentLevel = LEVEL_THRESHOLDS[level - 1] ?? 0;
  const xpForNextLevel = LEVEL_THRESHOLDS[level] ?? xpForCurrentLevel;
  const xpIntoLevel = totalXp - xpForCurrentLevel;
  const xpNeeded = xpForNextLevel - xpForCurrentLevel;
  const progressPercent = xpNeeded > 0 ? Math.min(Math.round((xpIntoLevel / xpNeeded) * 100), 100) : 100;

  return {
    level,
    currentXp: totalXp,
    xpForCurrentLevel,
    xpForNextLevel,
    progressPercent,
  };
}

// ═══════════════════════════════════════════
// STREAK SYSTEM
// ═══════════════════════════════════════════

/**
 * Updates streak based on lastActivityDate.
 * - Same day: no change
 * - Yesterday: increment streak
 * - Older: reset streak to 1
 */
export function calculateStreak(
  currentStreak: number,
  longestStreak: number,
  lastActivityDate: Date | null
): { currentStreak: number; longestStreak: number } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (!lastActivityDate) {
    return { currentStreak: 1, longestStreak: Math.max(longestStreak, 1) };
  }

  const lastDate = new Date(lastActivityDate);
  const lastDay = new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate());
  const diffDays = Math.floor((today.getTime() - lastDay.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    // Same day — no streak change
    return { currentStreak, longestStreak };
  } else if (diffDays === 1) {
    // Consecutive day — increment
    const newStreak = currentStreak + 1;
    return {
      currentStreak: newStreak,
      longestStreak: Math.max(longestStreak, newStreak),
    };
  } else {
    // Streak broken — reset to 1
    return { currentStreak: 1, longestStreak };
  }
}

// ═══════════════════════════════════════════
// ACHIEVEMENT SYSTEM
// ═══════════════════════════════════════════

/**
 * Achievement definitions — these match the seeded Achievement records.
 * The `key` matches the Achievement.name for lookup.
 * The `check` function determines if the achievement should be awarded.
 */
export type AchievementContext = {
  totalXp: number;
  lessonsCompleted: number;
  currentStreak: number;
  longestStreak: number;
  currentLevel: number;
  isPerfectScore: boolean; // current attempt scored 100
  firstCompletion: boolean; // first-ever lesson completion
  totalAttempts: number; // total attempts across all lessons
  uniqueTracksCompleted: number; // tracks where all lessons are done
};

type AchievementDef = {
  key: string;
  check: (ctx: AchievementContext) => boolean;
};

export const ACHIEVEMENT_DEFINITIONS: AchievementDef[] = [
  // Milestone achievements
  { key: "First Steps", check: (ctx) => ctx.firstCompletion },
  { key: "Getting Started", check: (ctx) => ctx.lessonsCompleted >= 5 },
  { key: "Dedicated Learner", check: (ctx) => ctx.lessonsCompleted >= 25 },
  { key: "Knowledge Seeker", check: (ctx) => ctx.lessonsCompleted >= 50 },
  { key: "Century", check: (ctx) => ctx.lessonsCompleted >= 100 },

  // XP achievements
  { key: "XP Collector", check: (ctx) => ctx.totalXp >= 100 },
  { key: "XP Hunter", check: (ctx) => ctx.totalXp >= 500 },
  { key: "XP Master", check: (ctx) => ctx.totalXp >= 2000 },
  { key: "XP Legend", check: (ctx) => ctx.totalXp >= 5000 },

  // Level achievements
  { key: "Level 5", check: (ctx) => ctx.currentLevel >= 5 },
  { key: "Level 10", check: (ctx) => ctx.currentLevel >= 10 },
  { key: "Level 20", check: (ctx) => ctx.currentLevel >= 20 },

  // Streak achievements
  { key: "On Fire", check: (ctx) => ctx.currentStreak >= 3 },
  { key: "Week Warrior", check: (ctx) => ctx.currentStreak >= 7 },
  { key: "Unstoppable", check: (ctx) => ctx.longestStreak >= 14 },
  { key: "Month Master", check: (ctx) => ctx.longestStreak >= 30 },

  // Performance achievements
  { key: "Perfect Score", check: (ctx) => ctx.isPerfectScore },
  { key: "Persistent", check: (ctx) => ctx.totalAttempts >= 50 },

  // Track achievements
  { key: "Track Complete", check: (ctx) => ctx.uniqueTracksCompleted >= 1 },
  { key: "Track Master", check: (ctx) => ctx.uniqueTracksCompleted >= 5 },
];

/**
 * Seed data for achievements — used by the seed script.
 */
export const ACHIEVEMENT_SEED_DATA = [
  { name: "First Steps", description: "Complete your first lesson", iconUrl: "🐣" },
  { name: "Getting Started", description: "Complete 5 lessons", iconUrl: "📚" },
  { name: "Dedicated Learner", description: "Complete 25 lessons", iconUrl: "🎓" },
  { name: "Knowledge Seeker", description: "Complete 50 lessons", iconUrl: "🔬" },
  { name: "Century", description: "Complete 100 lessons", iconUrl: "💯" },

  { name: "XP Collector", description: "Earn 100 XP", iconUrl: "⭐", xpRequirement: 100 },
  { name: "XP Hunter", description: "Earn 500 XP", iconUrl: "🌟", xpRequirement: 500 },
  { name: "XP Master", description: "Earn 2,000 XP", iconUrl: "💫", xpRequirement: 2000 },
  { name: "XP Legend", description: "Earn 5,000 XP", iconUrl: "🏆", xpRequirement: 5000 },

  { name: "Level 5", description: "Reach Level 5", iconUrl: "🔥" },
  { name: "Level 10", description: "Reach Level 10", iconUrl: "⚡" },
  { name: "Level 20", description: "Reach Level 20", iconUrl: "👑" },

  { name: "On Fire", description: "3-day streak", iconUrl: "🔥" },
  { name: "Week Warrior", description: "7-day streak", iconUrl: "⚔️" },
  { name: "Unstoppable", description: "14-day longest streak", iconUrl: "🚀" },
  { name: "Month Master", description: "30-day longest streak", iconUrl: "🏅" },

  { name: "Perfect Score", description: "Score 100% on a lesson", iconUrl: "💎" },
  { name: "Persistent", description: "Make 50 total attempts", iconUrl: "🔁" },

  { name: "Track Complete", description: "Complete all lessons in a track", iconUrl: "🗺️" },
  { name: "Track Master", description: "Complete 5 tracks", iconUrl: "🌍" },
];

// ═══════════════════════════════════════════
// MAIN GAMIFICATION UPDATE FUNCTION
// ═══════════════════════════════════════════

export type GamificationResult = {
  xpAwarded: number;
  newLevel: number;
  previousLevel: number;
  leveledUp: boolean;
  currentStreak: number;
  longestStreak: number;
  newAchievements: { name: string; description: string | null; iconUrl: string | null }[];
};

/**
 * Called after a successful lesson completion.
 * Updates XP, level, streaks, and checks for new achievements.
 */
export async function processLessonCompletion(
  userId: string,
  classId: string,
  xpReward: number,
  score: number
): Promise<GamificationResult> {
  // 1. Get or create student attributes
  const attrs = await prismaClient.studentAttribute.upsert({
    where: { userId_classId: { userId, classId } },
    create: {
      id: randomUUID(),
      userId,
      classId,
      totalXp: xpReward,
      lessonsCompleted: 1,
      lastActivityDate: new Date(),
    },
    update: {
      totalXp: { increment: xpReward },
      lessonsCompleted: { increment: 1 },
    },
  });

  // After the upsert, fetch the updated values
  const updatedAttrs = await prismaClient.studentAttribute.findUniqueOrThrow({
    where: { userId_classId: { userId, classId } },
  });

  // 2. Calculate level
  const previousLevel = attrs.currentLevel;
  const newLevel = calculateLevel(updatedAttrs.totalXp);

  // 3. Calculate streak
  const streakResult = calculateStreak(
    updatedAttrs.currentStreak,
    updatedAttrs.longestStreak,
    attrs.lastActivityDate // use pre-update value
  );

  // 4. Update level, streak, and lastActivityDate
  await prismaClient.studentAttribute.update({
    where: { userId_classId: { userId, classId } },
    data: {
      currentLevel: newLevel,
      currentStreak: streakResult.currentStreak,
      longestStreak: streakResult.longestStreak,
      lastActivityDate: new Date(),
    },
  });

  // 5. Gather context for achievement checks
  const totalAttempts = await prismaClient.lessonAttempt.count({
    where: { userId },
  });

  // Count unique completed tracks (all lessons in a track completed)
  const uniqueTracksCompleted = await countCompletedTracks(userId);

  const achievementCtx: AchievementContext = {
    totalXp: updatedAttrs.totalXp,
    lessonsCompleted: updatedAttrs.lessonsCompleted,
    currentStreak: streakResult.currentStreak,
    longestStreak: streakResult.longestStreak,
    currentLevel: newLevel,
    isPerfectScore: score === 100,
    firstCompletion: updatedAttrs.lessonsCompleted === 1,
    totalAttempts,
    uniqueTracksCompleted,
  };

  // 6. Check for new achievements
  const newAchievements = await checkAndAwardAchievements(userId, achievementCtx);

  return {
    xpAwarded: xpReward,
    newLevel,
    previousLevel,
    leveledUp: newLevel > previousLevel,
    currentStreak: streakResult.currentStreak,
    longestStreak: streakResult.longestStreak,
    newAchievements,
  };
}

/**
 * Count tracks where the user has completed ALL lessons.
 */
async function countCompletedTracks(userId: string): Promise<number> {
  // Get all tracks the user has any completion in
  const completions = await prismaClient.lessonCompletion.findMany({
    where: { userId },
    select: {
      lesson: {
        select: { trackId: true },
      },
    },
  });

  const trackIds = [...new Set(completions.map((c) => c.lesson.trackId))];

  let completedTracks = 0;
  for (const trackId of trackIds) {
    const totalLessons = await prismaClient.lesson.count({ where: { trackId } });
    const completedLessons = await prismaClient.lessonCompletion.count({
      where: {
        userId,
        lesson: { trackId },
      },
    });
    if (totalLessons > 0 && completedLessons >= totalLessons) {
      completedTracks++;
    }
  }

  return completedTracks;
}

/**
 * Check all achievement definitions and award any newly earned ones.
 */
async function checkAndAwardAchievements(
  userId: string,
  ctx: AchievementContext
): Promise<{ name: string; description: string | null; iconUrl: string | null }[]> {
  // Get all achievements the user already has
  const existingAchievements = await prismaClient.userAchievement.findMany({
    where: { userId },
    select: { achievement: { select: { name: true } } },
  });
  const earnedNames = new Set(existingAchievements.map((ua) => ua.achievement.name));

  // Get all achievement records from DB
  const allAchievements = await prismaClient.achievement.findMany();
  const achievementsByName = new Map(allAchievements.map((a) => [a.name, a]));

  const newlyEarned: { name: string; description: string | null; iconUrl: string | null }[] = [];

  for (const def of ACHIEVEMENT_DEFINITIONS) {
    if (earnedNames.has(def.key)) continue; // Already earned

    const achievement = achievementsByName.get(def.key);
    if (!achievement) continue; // Not seeded in DB

    if (def.check(ctx)) {
      // Award it
      await prismaClient.userAchievement.create({
        data: {
          id: randomUUID(),
          userId,
          achievementId: achievement.id,
        },
      });
      newlyEarned.push({
        name: achievement.name,
        description: achievement.description,
        iconUrl: achievement.iconUrl,
      });
    }
  }

  return newlyEarned;
}

/**
 * Update streak on any activity (even incorrect attempts).
 * Called separately from completion for streak-only updates.
 */
export async function updateStreakOnActivity(
  userId: string,
  classId: string
): Promise<void> {
  const attrs = await prismaClient.studentAttribute.findUnique({
    where: { userId_classId: { userId, classId } },
  });

  if (!attrs) return;

  const streakResult = calculateStreak(
    attrs.currentStreak,
    attrs.longestStreak,
    attrs.lastActivityDate
  );

  await prismaClient.studentAttribute.update({
    where: { userId_classId: { userId, classId } },
    data: {
      currentStreak: streakResult.currentStreak,
      longestStreak: streakResult.longestStreak,
      lastActivityDate: new Date(),
    },
  });
}
