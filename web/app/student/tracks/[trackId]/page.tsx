import { Suspense } from "react";
import Link from "next/link";
import { StudentTrackClient } from "./student-track-client";

export default async function StudentTrackPage({
  params,
}: {
  params: Promise<{ trackId: string }>;
}) {
  const { trackId } = await params;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link
          href="/student"
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
        <StudentTrackClient trackId={trackId} />
      </Suspense>
    </div>
  );
}
