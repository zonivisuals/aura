import { Suspense } from "react";
import { StudentPerformanceClient } from "./performance-client";

export default function StudentPerformancePage() {
  return (
    <div className="space-y-6">
      <h1 className="font-heading text-3xl md:text-4xl text-foreground">Performance 📊</h1>
      <Suspense
        fallback={
          <div className="space-y-4">
            <div className="h-40 border-2 border-dashed border-muted-foreground/20 bg-muted animate-pulse" style={{ borderRadius: "25px 50px 25px 50px / 50px 25px 50px 25px" }} />
            <div className="h-64 border-2 border-dashed border-muted-foreground/20 bg-muted animate-pulse" style={{ borderRadius: "255px 15px 225px 15px / 15px 225px 15px 255px" }} />
          </div>
        }
      >
        <StudentPerformanceClient />
      </Suspense>
    </div>
  );
}
