import { Suspense } from "react";
import Link from "next/link";
import { LessonAttemptClient } from "./lesson-attempt-client";

export default async function StudentLessonPage({
  params,
}: {
  params: Promise<{ lessonId: string }>;
}) {
  const { lessonId } = await params;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link
          href="/student"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back
        </Link>
      </div>
      <Suspense
        fallback={
          <div className="space-y-3">
            <div className="h-12 rounded-lg border bg-muted animate-pulse" />
            <div className="h-60 rounded-lg border bg-muted animate-pulse" />
          </div>
        }
      >
        <LessonAttemptClient lessonId={lessonId} />
      </Suspense>
    </div>
  );
}
