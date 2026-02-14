import { Suspense } from "react";
import { AchievementsClient } from "./achievements-client";

export default function AchievementsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
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
