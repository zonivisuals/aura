import { Suspense } from "react";
import { StudentTrackClient } from "./student-track-client";

export default async function StudentTrackPage({
  params,
}: {
  params: Promise<{ trackId: string }>;
}) {
  const { trackId } = await params;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background">
      <Suspense
        fallback={
          <div className="container max-w-5xl mx-auto px-4 py-8 space-y-6">
            <div className="h-20 rounded-xl bg-muted animate-pulse" />
            <div className="h-[600px] rounded-xl bg-muted animate-pulse" />
          </div>
        }
      >
        <div className="container max-w-5xl mx-auto px-4 py-8">
            <StudentTrackClient trackId={trackId} />
        </div>
      </Suspense>
    </div>
  );
}
