import { Suspense } from "react";
import Link from "next/link";
import { TrackLessonsClient } from "./track-lessons-client";

export default async function TeacherTrackPage({
  params,
}: {
  params: Promise<{ trackId: string }>;
}) {
  const { trackId } = await params;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link
          href="/teacher"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to classes
        </Link>
      </div>
      <Suspense
        fallback={
          <div className="space-y-3">
            <div className="h-16 rounded-lg border bg-muted animate-pulse" />
            <div className="h-40 rounded-lg border bg-muted animate-pulse" />
          </div>
        }
      >
        <TrackLessonsClient trackId={trackId} />
      </Suspense>
    </div>
  );
}
