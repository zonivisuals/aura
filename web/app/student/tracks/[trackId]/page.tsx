import { Suspense } from "react";
import { StudentTrackClient } from "./student-track-client";

export default async function StudentTrackPage({
  params,
}: {
  params: Promise<{ trackId: string }>;
}) {
  const { trackId } = await params;

  return (
    <Suspense
      fallback={
        <div className="space-y-4">
          <div className="h-16 border-2 border-dashed border-muted-foreground/20 bg-muted animate-pulse" style={{ borderRadius: "255px 15px 225px 15px / 15px 225px 15px 255px" }} />
          <div className="h-[500px] border-2 border-dashed border-muted-foreground/20 bg-muted animate-pulse" style={{ borderRadius: "25px 50px 25px 50px / 50px 25px 50px 25px" }} />
        </div>
      }
    >
      <StudentTrackClient trackId={trackId} />
    </Suspense>
  );
}
