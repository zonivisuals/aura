import { Suspense } from "react";
import { AchievementsClient } from "./achievements-client";

export default function AchievementsPage() {
  return (
    <div className="space-y-6">
      <h1 className="font-heading text-3xl md:text-4xl text-foreground">Achievements 🏆</h1>
      <Suspense
        fallback={
          <div className="space-y-3">
            <div className="h-12 border-2 border-dashed border-muted-foreground/20 bg-muted animate-pulse" style={{ borderRadius: "255px 15px 225px 15px / 15px 225px 15px 255px" }} />
            <div className="h-60 border-2 border-dashed border-muted-foreground/20 bg-muted animate-pulse" style={{ borderRadius: "25px 50px 25px 50px / 50px 25px 50px 25px" }} />
          </div>
        }
      >
        <AchievementsClient />
      </Suspense>
    </div>
  );
}
