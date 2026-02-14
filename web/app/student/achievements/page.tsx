import { Suspense } from "react";
import { AchievementsClient } from "./achievements-client";

export default function AchievementsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">Achievements</h1>
      <Suspense
        fallback={
          <div className="space-y-3">
            <div className="h-12 rounded-lg border bg-muted animate-pulse" />
            <div className="h-60 rounded-lg border bg-muted animate-pulse" />
          </div>
        }
      >
        <AchievementsClient />
      </Suspense>
    </div>
  );
}
