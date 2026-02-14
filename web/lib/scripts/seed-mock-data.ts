/**
 * Comprehensive seed script for mock data.
 * Creates: 1 teacher, 5 students, 2 classes, subjects, tracks, lessons,
 * attempts, completions, student attributes, achievements, and recommendations.
 *
 * Run:
 *   cd web
 *   DOTENV_CONFIG_PATH=.env.local npx tsx --require dotenv/config lib/scripts/seed-mock-data.ts
 */
import { prismaClient as prisma } from "../prisma/prisma";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";

// ═══════════════════════════════════════════
// CONFIGURATION — User credentials
// ═══════════════════════════════════════════

const TEACHER_PASSWORD = "Teacher123!";
const STUDENT_PASSWORD = "Student123!";

const TEACHER = {
  email: "prof.adams@aura.school",
  firstName: "Eleanor",
  lastName: "Adams",
};

const STUDENTS = [
  { email: "alice@aura.school",   firstName: "Alice",   lastName: "Martin"   },
  { email: "bob@aura.school",     firstName: "Bob",     lastName: "Chen"     },
  { email: "clara@aura.school",   firstName: "Clara",   lastName: "Dubois"   },
  { email: "david@aura.school",   firstName: "David",   lastName: "Kim"      },
  { email: "emma@aura.school",    firstName: "Emma",    lastName: "Rossi"    },
];

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

function uuid() {
  return randomUUID();
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

// ═══════════════════════════════════════════
// MAIN SEED FUNCTION
// ═══════════════════════════════════════════

async function main() {
  console.log("🌱 Starting comprehensive mock data seed...\n");

  // ── 0. Clean existing data (in dependency order) ──────────────
  console.log("🗑️  Cleaning existing data...");
  await prisma.chatMessage.deleteMany();
  await prisma.lessonRecommendation.deleteMany();
  await prisma.userAchievement.deleteMany();
  await prisma.lessonCompletion.deleteMany();
  await prisma.lessonAttempt.deleteMany();
  await prisma.studentAttribute.deleteMany();
  await prisma.lesson.deleteMany();
  await prisma.course.deleteMany();
  await prisma.track.deleteMany();
  await prisma.subject.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.class.deleteMany();
  await prisma.achievement.deleteMany();
  await prisma.user.deleteMany();
  console.log("   ✓ All tables cleared\n");

  // ── 1. Hash passwords ─────────────────────────────────────────
  console.log("🔑 Hashing passwords...");
  const teacherHash = await bcrypt.hash(TEACHER_PASSWORD, 10);
  const studentHash = await bcrypt.hash(STUDENT_PASSWORD, 10);
  console.log("   ✓ Passwords hashed\n");

  // ── 2. Create Users ───────────────────────────────────────────
  console.log("👤 Creating users...");

  const teacherId = uuid();
  await prisma.user.create({
    data: {
      id: teacherId,
      email: TEACHER.email,
      passwordHash: teacherHash,
      role: "TEACHER",
      firstName: TEACHER.firstName,
      lastName: TEACHER.lastName,
    },
  });
  console.log(`   ✓ Teacher: ${TEACHER.firstName} ${TEACHER.lastName} (${TEACHER.email})`);

  const studentIds: string[] = [];
  for (const s of STUDENTS) {
    const id = uuid();
    studentIds.push(id);
    await prisma.user.create({
      data: {
        id,
        email: s.email,
        passwordHash: studentHash,
        role: "STUDENT",
        firstName: s.firstName,
        lastName: s.lastName,
      },
    });
    console.log(`   ✓ Student: ${s.firstName} ${s.lastName} (${s.email})`);
  }
  console.log();

  // ── 3. Create Classes ─────────────────────────────────────────
  console.log("🏫 Creating classes...");

  const class1Id = uuid();
  const class2Id = uuid();

  await prisma.class.create({
    data: {
      id: class1Id,
      name: "Mathematics 101",
      description: "Fundamentals of algebra, geometry, and basic calculus. A journey from numbers to infinity.",
      teacherId,
      inviteCode: "MATH25",
      isActive: true,
    },
  });
  console.log('   ✓ Class: Mathematics 101 (invite: MATH25)');

  await prisma.class.create({
    data: {
      id: class2Id,
      name: "Physics: Mechanics",
      description: "Newton's laws, kinematics, energy, and momentum. Understanding how the world moves.",
      teacherId,
      inviteCode: "PHYS25",
      isActive: true,
    },
  });
  console.log('   ✓ Class: Physics: Mechanics (invite: PHYS25)\n');

  // ── 4. Enroll students ────────────────────────────────────────
  console.log("📋 Enrolling students...");

  // All 5 students in Math
  for (const sid of studentIds) {
    await prisma.enrollment.create({
      data: { id: uuid(), classId: class1Id, userId: sid, enrollmentType: "STUDENT" },
    });
  }
  console.log("   ✓ All 5 students enrolled in Mathematics 101");

  // First 3 students in Physics
  for (const sid of studentIds.slice(0, 3)) {
    await prisma.enrollment.create({
      data: { id: uuid(), classId: class2Id, userId: sid, enrollmentType: "STUDENT" },
    });
  }
  // Student 4 as visitor in Physics
  await prisma.enrollment.create({
    data: { id: uuid(), classId: class2Id, userId: studentIds[3], enrollmentType: "VISITOR" },
  });
  console.log("   ✓ 3 students + 1 visitor enrolled in Physics: Mechanics\n");

  // ── 5. Create Subjects ────────────────────────────────────────
  console.log("📚 Creating subjects...");

  const algebraId = uuid();
  const geometryId = uuid();
  const kinematicsId = uuid();

  await prisma.subject.create({
    data: { id: algebraId, classId: class1Id, name: "Algebra", description: "Equations, expressions, and abstract reasoning" },
  });
  await prisma.subject.create({
    data: { id: geometryId, classId: class1Id, name: "Geometry", description: "Shapes, angles, proofs, and spatial reasoning" },
  });
  await prisma.subject.create({
    data: { id: kinematicsId, classId: class2Id, name: "Kinematics", description: "Motion, velocity, acceleration, and projectile trajectories" },
  });
  console.log("   ✓ Algebra, Geometry (Math class)");
  console.log("   ✓ Kinematics (Physics class)\n");

  // ── 6. Create Courses (PDF materials) ─────────────────────────
  console.log("📄 Creating courses...");

  await prisma.course.create({
    data: { id: uuid(), subjectId: algebraId, title: "Algebra Fundamentals - Chapter 1", pdfUrl: "/uploads/courses/algebra-ch1.pdf", pdfFilename: "algebra-ch1.pdf", fileSize: 245000 },
  });
  await prisma.course.create({
    data: { id: uuid(), subjectId: geometryId, title: "Euclidean Geometry Notes", pdfUrl: "/uploads/courses/geometry-notes.pdf", pdfFilename: "geometry-notes.pdf", fileSize: 312000 },
  });
  await prisma.course.create({
    data: { id: uuid(), subjectId: kinematicsId, title: "Kinematics Study Guide", pdfUrl: "/uploads/courses/kinematics-guide.pdf", pdfFilename: "kinematics-guide.pdf", fileSize: 198000 },
  });
  console.log("   ✓ 3 course materials created\n");

  // ── 7. Create Tracks ──────────────────────────────────────────
  console.log("🗺️  Creating tracks...");

  const algebraTrackId = uuid();
  const geometryTrackId = uuid();
  const kinematicsTrackId = uuid();

  await prisma.track.create({
    data: { id: algebraTrackId, subjectId: algebraId, name: "Algebra Basics", description: "Master equations step by step", isPublished: true },
  });
  await prisma.track.create({
    data: { id: geometryTrackId, subjectId: geometryId, name: "Shapes & Proofs", description: "From triangles to circles", isPublished: true },
  });
  await prisma.track.create({
    data: { id: kinematicsTrackId, subjectId: kinematicsId, name: "Motion Mastery", description: "Understand how things move", isPublished: true },
  });
  console.log("   ✓ Algebra Basics (published)");
  console.log("   ✓ Shapes & Proofs (published)");
  console.log("   ✓ Motion Mastery (published)\n");

  // ── 8. Create Lessons ──────────────────────────────────────────
  console.log("📝 Creating lessons...");

  // ---- ALGEBRA TRACK: 8 lessons ----
  const algebraLessons = [
    {
      id: uuid(), trackId: algebraTrackId, position: 1, title: "Variables & Constants",
      description: "Learn the building blocks of algebra",
      lessonType: "QUIZ" as const, difficulty: 1, xpReward: 10,
      targetAttributes: ["algebra", "variables"],
      content: { question: "Which of the following is a variable?", options: ["5", "x", "π", "7"], correctAnswer: 1, explanation: "A variable is a symbol (like x) that represents an unknown value." },
    },
    {
      id: uuid(), trackId: algebraTrackId, position: 2, title: "Simple Equations",
      description: "Solve your first equations",
      lessonType: "QUIZ" as const, difficulty: 1, xpReward: 10,
      targetAttributes: ["algebra", "equations"],
      content: { question: "Solve for x: x + 3 = 7", options: ["3", "4", "7", "10"], correctAnswer: 1, explanation: "Subtract 3 from both sides: x = 7 - 3 = 4" },
    },
    {
      id: uuid(), trackId: algebraTrackId, position: 3, title: "Negative Numbers",
      description: "Working with numbers below zero",
      lessonType: "YES_NO" as const, difficulty: 1, xpReward: 10,
      targetAttributes: ["algebra", "negative-numbers"],
      content: { question: "Is -3 × -2 = 6?", correctAnswer: true, explanation: "Multiplying two negative numbers gives a positive result." },
    },
    {
      id: uuid(), trackId: algebraTrackId, position: 4, title: "Order of Operations",
      description: "PEMDAS / BODMAS rules",
      lessonType: "QUIZ" as const, difficulty: 2, xpReward: 20,
      targetAttributes: ["algebra", "order-of-operations"],
      content: { question: "What is 2 + 3 × 4?", options: ["20", "14", "12", "24"], correctAnswer: 1, explanation: "Multiplication before addition: 3×4=12, then 2+12=14" },
    },
    {
      id: uuid(), trackId: algebraTrackId, position: 5, title: "Distributive Property",
      description: "Expanding expressions like a(b + c)",
      lessonType: "SHORT_ANSWER" as const, difficulty: 2, xpReward: 20,
      targetAttributes: ["algebra", "distributive-property"],
      content: { question: "Expand: 3(x + 2)", sampleAnswers: ["3x + 6"], keywords: ["3x", "6", "plus"] },
    },
    {
      id: uuid(), trackId: algebraTrackId, position: 6, title: "Factoring Basics",
      description: "Breaking expressions into factors",
      lessonType: "QUIZ" as const, difficulty: 2, xpReward: 20,
      targetAttributes: ["algebra", "factoring"],
      content: { question: "Factor: x² + 5x + 6", options: ["(x+1)(x+6)", "(x+2)(x+3)", "(x+3)(x+3)", "(x-2)(x-3)"], correctAnswer: 1, explanation: "Find two numbers that multiply to 6 and add to 5: 2 and 3." },
    },
    {
      id: uuid(), trackId: algebraTrackId, position: 7, title: "Quadratic Formula",
      description: "The famous formula for solving quadratics",
      lessonType: "YES_NO" as const, difficulty: 3, xpReward: 30,
      targetAttributes: ["algebra", "quadratic-formula"],
      content: { question: "Does the quadratic formula work for all quadratic equations?", correctAnswer: true, explanation: "Yes, ax²+bx+c=0 can always be solved with x = (-b ± √(b²-4ac)) / 2a" },
    },
    {
      id: uuid(), trackId: algebraTrackId, position: 8, title: "Systems of Equations",
      description: "Solving two equations simultaneously",
      lessonType: "SHORT_ANSWER" as const, difficulty: 3, xpReward: 30,
      targetAttributes: ["algebra", "systems-of-equations"],
      content: { question: "Solve: x + y = 5 and x - y = 1. What is x?", sampleAnswers: ["3", "x = 3", "x=3"], keywords: ["3"] },
    },
  ];

  for (const lesson of algebraLessons) {
    await prisma.lesson.create({ data: lesson });
  }
  console.log(`   ✓ ${algebraLessons.length} Algebra lessons`);

  // ---- GEOMETRY TRACK: 6 lessons ----
  const geometryLessons = [
    {
      id: uuid(), trackId: geometryTrackId, position: 1, title: "Points, Lines & Planes",
      description: "The fundamental building blocks",
      lessonType: "YES_NO" as const, difficulty: 1, xpReward: 10,
      targetAttributes: ["geometry", "basics"],
      content: { question: "Do two points always define a unique line?", correctAnswer: true, explanation: "Through any two distinct points, exactly one line can be drawn." },
    },
    {
      id: uuid(), trackId: geometryTrackId, position: 2, title: "Angles & Measurement",
      description: "Acute, obtuse, right, and straight angles",
      lessonType: "QUIZ" as const, difficulty: 1, xpReward: 10,
      targetAttributes: ["geometry", "angles"],
      content: { question: "What type of angle measures exactly 90°?", options: ["Acute", "Right", "Obtuse", "Straight"], correctAnswer: 1, explanation: "A right angle is exactly 90 degrees." },
    },
    {
      id: uuid(), trackId: geometryTrackId, position: 3, title: "Triangle Properties",
      description: "Sum of angles and classification",
      lessonType: "QUIZ" as const, difficulty: 1, xpReward: 10,
      targetAttributes: ["geometry", "triangles"],
      content: { question: "What is the sum of angles in a triangle?", options: ["90°", "180°", "270°", "360°"], correctAnswer: 1, explanation: "The interior angles of any triangle always sum to 180°." },
    },
    {
      id: uuid(), trackId: geometryTrackId, position: 4, title: "Pythagorean Theorem",
      description: "a² + b² = c² and its applications",
      lessonType: "SHORT_ANSWER" as const, difficulty: 2, xpReward: 20,
      targetAttributes: ["geometry", "pythagorean-theorem"],
      content: { question: "In a right triangle with legs 3 and 4, what is the hypotenuse?", sampleAnswers: ["5"], keywords: ["5"] },
    },
    {
      id: uuid(), trackId: geometryTrackId, position: 5, title: "Circle Formulas",
      description: "Area and circumference",
      lessonType: "QUIZ" as const, difficulty: 2, xpReward: 20,
      targetAttributes: ["geometry", "circles"],
      content: { question: "What is the area of a circle with radius 3?", options: ["6π", "9π", "3π", "12π"], correctAnswer: 1, explanation: "Area = πr² = π(3)² = 9π" },
    },
    {
      id: uuid(), trackId: geometryTrackId, position: 6, title: "Coordinate Geometry",
      description: "Distance and midpoint formulas",
      lessonType: "SHORT_ANSWER" as const, difficulty: 3, xpReward: 30,
      targetAttributes: ["geometry", "coordinate-geometry"],
      content: { question: "Find the distance between (0,0) and (3,4).", sampleAnswers: ["5", "5 units"], keywords: ["5"] },
    },
  ];

  for (const lesson of geometryLessons) {
    await prisma.lesson.create({ data: lesson });
  }
  console.log(`   ✓ ${geometryLessons.length} Geometry lessons`);

  // ---- KINEMATICS TRACK: 7 lessons ----
  const kinematicsLessons = [
    {
      id: uuid(), trackId: kinematicsTrackId, position: 1, title: "Distance vs Displacement",
      description: "Scalar vs vector quantities",
      lessonType: "YES_NO" as const, difficulty: 1, xpReward: 10,
      targetAttributes: ["physics", "kinematics", "displacement"],
      content: { question: "Are distance and displacement always the same value?", correctAnswer: false, explanation: "Distance is a scalar (total path), displacement is a vector (start to finish). They differ when the path isn't straight." },
    },
    {
      id: uuid(), trackId: kinematicsTrackId, position: 2, title: "Speed & Velocity",
      description: "How fast and in which direction",
      lessonType: "QUIZ" as const, difficulty: 1, xpReward: 10,
      targetAttributes: ["physics", "kinematics", "velocity"],
      content: { question: "What differentiates velocity from speed?", options: ["Magnitude", "Direction", "Units", "Nothing"], correctAnswer: 1, explanation: "Velocity includes direction (it's a vector), while speed is scalar." },
    },
    {
      id: uuid(), trackId: kinematicsTrackId, position: 3, title: "Acceleration",
      description: "Rate of change of velocity",
      lessonType: "SHORT_ANSWER" as const, difficulty: 1, xpReward: 10,
      targetAttributes: ["physics", "kinematics", "acceleration"],
      content: { question: "A car goes from 0 to 20 m/s in 5 seconds. What is its acceleration?", sampleAnswers: ["4 m/s²", "4", "4 m/s^2"], keywords: ["4"] },
    },
    {
      id: uuid(), trackId: kinematicsTrackId, position: 4, title: "Equations of Motion",
      description: "The SUVAT equations",
      lessonType: "QUIZ" as const, difficulty: 2, xpReward: 20,
      targetAttributes: ["physics", "kinematics", "equations-of-motion"],
      content: { question: "Which equation relates displacement, initial velocity, acceleration, and time?", options: ["v = u + at", "s = ut + ½at²", "v² = u² + 2as", "F = ma"], correctAnswer: 1, explanation: "s = ut + ½at² gives displacement from initial velocity, acceleration, and time." },
    },
    {
      id: uuid(), trackId: kinematicsTrackId, position: 5, title: "Free Fall",
      description: "Objects falling under gravity",
      lessonType: "QUIZ" as const, difficulty: 2, xpReward: 20,
      targetAttributes: ["physics", "kinematics", "free-fall"],
      content: { question: "What is the acceleration due to gravity near Earth's surface?", options: ["8.9 m/s²", "9.8 m/s²", "10.2 m/s²", "11.0 m/s²"], correctAnswer: 1, explanation: "g ≈ 9.8 m/s² (often rounded to 10 m/s² for calculations)." },
    },
    {
      id: uuid(), trackId: kinematicsTrackId, position: 6, title: "Projectile Motion",
      description: "Two-dimensional motion under gravity",
      lessonType: "YES_NO" as const, difficulty: 3, xpReward: 30,
      targetAttributes: ["physics", "kinematics", "projectile-motion"],
      content: { question: "Does the horizontal velocity of a projectile (ignoring air resistance) change during flight?", correctAnswer: false, explanation: "Gravity only affects vertical motion. Horizontal velocity remains constant (no horizontal force)." },
    },
    {
      id: uuid(), trackId: kinematicsTrackId, position: 7, title: "Relative Motion",
      description: "Frames of reference and relative velocity",
      lessonType: "SHORT_ANSWER" as const, difficulty: 3, xpReward: 30,
      targetAttributes: ["physics", "kinematics", "relative-motion"],
      content: { question: "Two cars move toward each other at 60 km/h each. What is their relative speed?", sampleAnswers: ["120 km/h", "120"], keywords: ["120"] },
    },
  ];

  for (const lesson of kinematicsLessons) {
    await prisma.lesson.create({ data: lesson });
  }
  console.log(`   ✓ ${kinematicsLessons.length} Kinematics lessons\n`);

  // ── 9. Create Lesson Attempts & Completions ────────────────────
  console.log("🎯 Creating lesson attempts & completions...");

  // Helper to create attempt + completion
  async function completeLesson(
    userId: string,
    lessonId: string,
    score: number,
    isCorrect: boolean,
    daysAgoN: number,
    weaknesses: string[] = [],
  ) {
    const lessonData = await prisma.lesson.findUnique({ where: { id: lessonId }, select: { content: true, lessonType: true } });
    const content = lessonData?.content as Record<string, unknown>;

    let userAnswer: unknown;
    if (lessonData?.lessonType === "QUIZ") {
      userAnswer = { selectedOption: isCorrect ? content.correctAnswer : 0 };
    } else if (lessonData?.lessonType === "YES_NO") {
      userAnswer = { answer: isCorrect ? content.correctAnswer : !(content.correctAnswer as boolean) };
    } else {
      userAnswer = { text: isCorrect ? "correct answer text" : "wrong answer" };
    }

    await prisma.lessonAttempt.create({
      data: {
        id: uuid(),
        lessonId,
        userId,
        userAnswer,
        isCorrect,
        score,
        timeSpentSeconds: 30 + Math.floor(Math.random() * 180),
        identifiedWeaknesses: weaknesses,
        attemptedAt: daysAgo(daysAgoN),
      },
    });

    await prisma.lessonCompletion.create({
      data: {
        id: uuid(),
        lessonId,
        userId,
        completedAt: daysAgo(daysAgoN),
        finalScore: score,
        attemptsCount: isCorrect ? 1 : 2,
      },
    });
  }

  // Alice — ⭐ Top student: completed 6/8 algebra, 4/6 geometry, 5/7 kinematics
  const alice = studentIds[0];
  for (let i = 0; i < 6; i++) {
    await completeLesson(alice, algebraLessons[i].id, i < 4 ? 100 : 85, true, 14 - i);
  }
  for (let i = 0; i < 4; i++) {
    await completeLesson(alice, geometryLessons[i].id, 95, true, 10 - i);
  }
  for (let i = 0; i < 5; i++) {
    await completeLesson(alice, kinematicsLessons[i].id, i < 3 ? 100 : 75, true, 8 - i);
  }
  console.log("   ✓ Alice: 15 lessons completed (top student)");

  // Bob — 🔥 Good student: completed 5/8 algebra, 3/6 geometry
  const bob = studentIds[1];
  for (let i = 0; i < 5; i++) {
    await completeLesson(bob, algebraLessons[i].id, i < 3 ? 90 : 70, true, 12 - i);
  }
  for (let i = 0; i < 3; i++) {
    await completeLesson(bob, geometryLessons[i].id, 80, true, 7 - i);
  }
  for (let i = 0; i < 3; i++) {
    await completeLesson(bob, kinematicsLessons[i].id, 85, true, 6 - i);
  }
  console.log("   ✓ Bob: 11 lessons completed (good student)");

  // Clara — 📉 Struggling: 3/8 algebra (low scores), 2/6 geometry
  const clara = studentIds[2];
  for (let i = 0; i < 3; i++) {
    await completeLesson(clara, algebraLessons[i].id, 55 + i * 5, i === 2, 10 - i, ["algebra", "equations"]);
  }
  for (let i = 0; i < 2; i++) {
    await completeLesson(clara, geometryLessons[i].id, 60, true, 6 - i);
  }
  for (let i = 0; i < 2; i++) {
    await completeLesson(clara, kinematicsLessons[i].id, 50, false, 5 - i, ["kinematics", "velocity"]);
  }
  // Extra failed attempts for Clara (no completion)
  await prisma.lessonAttempt.create({
    data: {
      id: uuid(), lessonId: algebraLessons[3].id, userId: clara,
      userAnswer: { selectedOption: 0 }, isCorrect: false, score: 30,
      timeSpentSeconds: 45, identifiedWeaknesses: ["order-of-operations"],
      attemptedAt: daysAgo(4),
    },
  });
  await prisma.lessonAttempt.create({
    data: {
      id: uuid(), lessonId: algebraLessons[3].id, userId: clara,
      userAnswer: { selectedOption: 2 }, isCorrect: false, score: 40,
      timeSpentSeconds: 60, identifiedWeaknesses: ["order-of-operations"],
      attemptedAt: daysAgo(3),
    },
  });
  console.log("   ✓ Clara: 7 lessons completed (struggling, extra failed attempts)");

  // David — 📖 Moderate: 4/8 algebra only (not in physics as student)
  const david = studentIds[3];
  for (let i = 0; i < 4; i++) {
    await completeLesson(david, algebraLessons[i].id, 75 + i * 3, true, 9 - i);
  }
  console.log("   ✓ David: 4 lessons completed (moderate)");

  // Emma — 🌱 Just started: 2/8 algebra, 1/6 geometry
  const emma = studentIds[4];
  for (let i = 0; i < 2; i++) {
    await completeLesson(emma, algebraLessons[i].id, 70, true, 3 - i);
  }
  await completeLesson(emma, geometryLessons[0].id, 65, true, 1);
  console.log("   ✓ Emma: 3 lessons completed (just started)\n");

  // ── 10. Student Attributes ─────────────────────────────────────
  console.log("📊 Creating student attributes...");

  // Alice — Math class
  await prisma.studentAttribute.create({
    data: {
      id: uuid(), userId: alice, classId: class1Id,
      weaknesses: JSON.parse('[]'),
      strengths: JSON.parse('[{"attribute":"algebra","confidence":0.95},{"attribute":"geometry","confidence":0.9}]'),
      totalXp: 1250, currentLevel: 5, lessonsCompleted: 10,
      currentStreak: 7, longestStreak: 12, lastActivityDate: daysAgo(1),
    },
  });
  // Alice — Physics class
  await prisma.studentAttribute.create({
    data: {
      id: uuid(), userId: alice, classId: class2Id,
      weaknesses: JSON.parse('[{"attribute":"projectile-motion","severity":0.3,"lastSeen":"2026-02-10T00:00:00Z","occurrences":1}]'),
      strengths: JSON.parse('[{"attribute":"kinematics","confidence":0.85}]'),
      totalXp: 550, currentLevel: 3, lessonsCompleted: 5,
      currentStreak: 4, longestStreak: 5, lastActivityDate: daysAgo(2),
    },
  });

  // Bob — Math class
  await prisma.studentAttribute.create({
    data: {
      id: uuid(), userId: bob, classId: class1Id,
      weaknesses: JSON.parse('[{"attribute":"factoring","severity":0.5,"lastSeen":"2026-02-08T00:00:00Z","occurrences":2}]'),
      strengths: JSON.parse('[{"attribute":"equations","confidence":0.8}]'),
      totalXp: 820, currentLevel: 4, lessonsCompleted: 8,
      currentStreak: 3, longestStreak: 6, lastActivityDate: daysAgo(2),
    },
  });
  // Bob — Physics class
  await prisma.studentAttribute.create({
    data: {
      id: uuid(), userId: bob, classId: class2Id,
      weaknesses: JSON.parse('[]'),
      strengths: JSON.parse('[{"attribute":"velocity","confidence":0.75}]'),
      totalXp: 280, currentLevel: 2, lessonsCompleted: 3,
      currentStreak: 2, longestStreak: 3, lastActivityDate: daysAgo(3),
    },
  });

  // Clara — Math class
  await prisma.studentAttribute.create({
    data: {
      id: uuid(), userId: clara, classId: class1Id,
      weaknesses: JSON.parse('[{"attribute":"algebra","severity":0.8,"lastSeen":"2026-02-11T00:00:00Z","occurrences":5},{"attribute":"order-of-operations","severity":0.7,"lastSeen":"2026-02-11T00:00:00Z","occurrences":3}]'),
      strengths: JSON.parse('[]'),
      totalXp: 310, currentLevel: 2, lessonsCompleted: 3,
      currentStreak: 0, longestStreak: 3, lastActivityDate: daysAgo(4),
    },
  });
  // Clara — Physics class
  await prisma.studentAttribute.create({
    data: {
      id: uuid(), userId: clara, classId: class2Id,
      weaknesses: JSON.parse('[{"attribute":"velocity","severity":0.6,"lastSeen":"2026-02-09T00:00:00Z","occurrences":2}]'),
      strengths: JSON.parse('[]'),
      totalXp: 100, currentLevel: 1, lessonsCompleted: 2,
      currentStreak: 0, longestStreak: 2, lastActivityDate: daysAgo(5),
    },
  });

  // David — Math class only
  await prisma.studentAttribute.create({
    data: {
      id: uuid(), userId: david, classId: class1Id,
      weaknesses: JSON.parse('[{"attribute":"negative-numbers","severity":0.4,"lastSeen":"2026-02-07T00:00:00Z","occurrences":1}]'),
      strengths: JSON.parse('[{"attribute":"variables","confidence":0.7}]'),
      totalXp: 480, currentLevel: 3, lessonsCompleted: 4,
      currentStreak: 1, longestStreak: 4, lastActivityDate: daysAgo(3),
    },
  });

  // Emma — Math class
  await prisma.studentAttribute.create({
    data: {
      id: uuid(), userId: emma, classId: class1Id,
      weaknesses: JSON.parse('[]'),
      strengths: JSON.parse('[]'),
      totalXp: 120, currentLevel: 1, lessonsCompleted: 3,
      currentStreak: 2, longestStreak: 2, lastActivityDate: daysAgo(1),
    },
  });
  console.log("   ✓ Student attributes created for all students\n");

  // ── 11. Achievements ───────────────────────────────────────────
  console.log("🏆 Creating achievements...");

  const achievementData = [
    { name: "First Steps",       description: "Complete your first lesson",         iconUrl: "🐣" },
    { name: "Getting Started",   description: "Complete 5 lessons",                 iconUrl: "📚" },
    { name: "Dedicated Learner", description: "Complete 25 lessons",                iconUrl: "🎓" },
    { name: "XP Collector",      description: "Earn 100 XP",        xpReq: 100,    iconUrl: "⭐" },
    { name: "XP Hunter",         description: "Earn 500 XP",        xpReq: 500,    iconUrl: "🌟" },
    { name: "XP Master",         description: "Earn 2,000 XP",      xpReq: 2000,   iconUrl: "💫" },
    { name: "On Fire",           description: "3-day streak",                       iconUrl: "🔥" },
    { name: "Week Warrior",      description: "7-day streak",                       iconUrl: "⚔️" },
    { name: "Perfect Score",     description: "Score 100% on a lesson",             iconUrl: "💎" },
    { name: "Level 5",           description: "Reach Level 5",                      iconUrl: "🔥" },
    { name: "Persistent",        description: "Make 50 total attempts",             iconUrl: "🔁" },
    { name: "Track Complete",    description: "Complete all lessons in a track",     iconUrl: "🗺️" },
  ];

  const achievementIds: Record<string, string> = {};
  for (const a of achievementData) {
    const id = uuid();
    achievementIds[a.name] = id;
    await prisma.achievement.create({
      data: {
        id,
        name: a.name,
        description: a.description,
        iconUrl: a.iconUrl,
        xpRequirement: a.xpReq ?? null,
        criteria: { type: a.name },
      },
    });
  }
  console.log(`   ✓ ${achievementData.length} achievements created`);

  // ── 12. Award Achievements ─────────────────────────────────────
  console.log("🎖️  Awarding achievements...");

  // Alice earns many
  const aliceAchievements = ["First Steps", "Getting Started", "XP Collector", "XP Hunter", "On Fire", "Week Warrior", "Perfect Score", "Level 5"];
  for (const name of aliceAchievements) {
    await prisma.userAchievement.create({
      data: { id: uuid(), userId: alice, achievementId: achievementIds[name], earnedAt: daysAgo(Math.floor(Math.random() * 10) + 1) },
    });
  }
  console.log(`   ✓ Alice: ${aliceAchievements.length} achievements`);

  // Bob earns some
  const bobAchievements = ["First Steps", "Getting Started", "XP Collector", "XP Hunter", "On Fire"];
  for (const name of bobAchievements) {
    await prisma.userAchievement.create({
      data: { id: uuid(), userId: bob, achievementId: achievementIds[name], earnedAt: daysAgo(Math.floor(Math.random() * 8) + 1) },
    });
  }
  console.log(`   ✓ Bob: ${bobAchievements.length} achievements`);

  // Clara earns a few
  const claraAchievements = ["First Steps", "XP Collector"];
  for (const name of claraAchievements) {
    await prisma.userAchievement.create({
      data: { id: uuid(), userId: clara, achievementId: achievementIds[name], earnedAt: daysAgo(Math.floor(Math.random() * 6) + 1) },
    });
  }
  console.log(`   ✓ Clara: ${claraAchievements.length} achievements`);

  // David earns a couple
  const davidAchievements = ["First Steps", "XP Collector"];
  for (const name of davidAchievements) {
    await prisma.userAchievement.create({
      data: { id: uuid(), userId: david, achievementId: achievementIds[name], earnedAt: daysAgo(Math.floor(Math.random() * 5) + 1) },
    });
  }
  console.log(`   ✓ David: ${davidAchievements.length} achievements`);

  // Emma earns first
  await prisma.userAchievement.create({
    data: { id: uuid(), userId: emma, achievementId: achievementIds["First Steps"], earnedAt: daysAgo(2) },
  });
  await prisma.userAchievement.create({
    data: { id: uuid(), userId: emma, achievementId: achievementIds["XP Collector"], earnedAt: daysAgo(1) },
  });
  console.log("   ✓ Emma: 2 achievements\n");

  // ── 13. Lesson Recommendations ─────────────────────────────────
  console.log("💡 Creating lesson recommendations...");

  // Recommend harder lessons to Alice (she's advanced)
  await prisma.lessonRecommendation.create({
    data: {
      id: uuid(), userId: alice, lessonId: algebraLessons[6].id,
      recommendationType: "AI_PERSONALIZED", confidenceScore: 0.92,
      reasoning: "Based on your strong algebra performance, try the Quadratic Formula next!",
    },
  });
  await prisma.lessonRecommendation.create({
    data: {
      id: uuid(), userId: alice, lessonId: geometryLessons[4].id,
      recommendationType: "SIMILAR_STUDENTS", confidenceScore: 0.85,
      reasoning: "Students like you found Circle Formulas helpful for their geometry mastery.",
    },
  });

  // Recommend weakness-based for Clara
  await prisma.lessonRecommendation.create({
    data: {
      id: uuid(), userId: clara, lessonId: algebraLessons[3].id,
      recommendationType: "WEAKNESS_BASED", confidenceScore: 0.88,
      reasoning: "You're struggling with order of operations — this lesson will help strengthen that skill.",
    },
  });
  await prisma.lessonRecommendation.create({
    data: {
      id: uuid(), userId: clara, lessonId: algebraLessons[1].id,
      recommendationType: "WEAKNESS_BASED", confidenceScore: 0.78,
      reasoning: "Reviewing simple equations will reinforce your foundations.",
    },
  });

  // Recommend for Bob
  await prisma.lessonRecommendation.create({
    data: {
      id: uuid(), userId: bob, lessonId: algebraLessons[5].id,
      recommendationType: "AI_PERSONALIZED", confidenceScore: 0.80,
      reasoning: "You're ready for factoring! It builds on the distributive property you just mastered.",
    },
  });

  // Recommend for Emma (just started)
  await prisma.lessonRecommendation.create({
    data: {
      id: uuid(), userId: emma, lessonId: algebraLessons[2].id,
      recommendationType: "TEACHER_SUGGESTED", confidenceScore: 0.90,
      reasoning: "Prof. Adams recommends mastering negative numbers next.",
    },
  });

  console.log("   ✓ 6 personalized recommendations created\n");

  // ── 14. Chat Messages ──────────────────────────────────────────
  console.log("💬 Creating sample chat messages...");

  await prisma.chatMessage.create({
    data: { id: uuid(), userId: alice, classId: class1Id, role: "user", content: "Can you explain the distributive property?", createdAt: daysAgo(5) },
  });
  await prisma.chatMessage.create({
    data: {
      id: uuid(), userId: alice, classId: class1Id, role: "assistant",
      content: "Of course! The distributive property says that a(b + c) = ab + ac. For example, 3(x + 2) = 3x + 6. You're distributing the multiplication across each term inside the parentheses.",
      metadata: { lessonRef: algebraLessons[4].id },
      createdAt: daysAgo(5),
    },
  });

  await prisma.chatMessage.create({
    data: { id: uuid(), userId: clara, classId: class1Id, role: "user", content: "I keep getting order of operations wrong. Any tips?", createdAt: daysAgo(3) },
  });
  await prisma.chatMessage.create({
    data: {
      id: uuid(), userId: clara, classId: class1Id, role: "assistant",
      content: "Remember PEMDAS: Parentheses, Exponents, Multiplication/Division (left to right), Addition/Subtraction (left to right). A helpful mnemonic: 'Please Excuse My Dear Aunt Sally'. Try evaluating 2 + 3 × 4 step by step!",
      metadata: { lessonRef: algebraLessons[3].id },
      createdAt: daysAgo(3),
    },
  });

  console.log("   ✓ 4 chat messages created\n");

  // ══════════════════════════════════════════════
  // SUMMARY
  // ══════════════════════════════════════════════
  console.log("═".repeat(50));
  console.log("🎉 SEED COMPLETE! Summary:");
  console.log("═".repeat(50));
  console.log(`  👤 1 Teacher + 5 Students`);
  console.log(`  🏫 2 Classes (MATH25, PHYS25)`);
  console.log(`  📚 3 Subjects (Algebra, Geometry, Kinematics)`);
  console.log(`  🗺️  3 Tracks (all published)`);
  console.log(`  📝 21 Lessons (8 + 6 + 7)`);
  console.log(`  🎯 40+ Lesson Attempts & Completions`);
  console.log(`  📊 8 Student Attribute records`);
  console.log(`  🏆 12 Achievements, 19 Awards`);
  console.log(`  💡 6 Recommendations`);
  console.log(`  💬 4 Chat messages`);
  console.log("═".repeat(50));
  console.log("\n📋 LOGIN CREDENTIALS:");
  console.log("─".repeat(50));
  console.log(`  🧑‍🏫 Teacher: ${TEACHER.email}  /  ${TEACHER_PASSWORD}`);
  console.log("  ── Students (all same password) ──");
  for (const s of STUDENTS) {
    console.log(`  🧑‍🎓 ${s.firstName.padEnd(8)} ${s.email.padEnd(22)}  /  ${STUDENT_PASSWORD}`);
  }
  console.log("─".repeat(50));
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
