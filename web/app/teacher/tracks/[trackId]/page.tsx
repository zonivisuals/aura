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
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Link
          href="/teacher"
          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-heading font-bold text-muted-foreground hover:text-foreground border-2 border-transparent hover:border-foreground hover:bg-secondary hover:shadow-[2px_2px_0px_0px_#2d2d2d] transition-all duration-100"
          style={{ borderRadius: "255px 15px 225px 15px / 15px 225px 15px 255px" }}
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
