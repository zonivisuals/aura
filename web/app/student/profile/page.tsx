import { Suspense } from "react";
import { StudentProfileClient } from "./profile-client";

export default function StudentProfilePage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Suspense
        fallback={
          <div className="space-y-3">
            <div className="h-32 rounded-lg border bg-muted animate-pulse" />
            <div className="h-40 rounded-lg border bg-muted animate-pulse" />
          </div>
        }
      >
        <StudentProfileClient />
      </Suspense>
    </div>
  );
}
