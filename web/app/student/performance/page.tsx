import { Suspense } from "react";
import { StudentPerformanceClient } from "./performance-client";

export default function StudentPerformancePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">Performance</h1>
      <Suspense
        fallback={
          <div className="space-y-4">
            <div className="h-40 rounded-lg bg-muted animate-pulse" />
            <div className="h-64 rounded-lg bg-muted animate-pulse" />
            <div className="h-64 rounded-lg bg-muted animate-pulse" />
          </div>
        }
      >
        <StudentPerformanceClient />
      </Suspense>
    </div>
  );
}
