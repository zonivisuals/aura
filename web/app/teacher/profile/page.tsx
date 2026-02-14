import { Suspense } from "react";
import { TeacherProfileClient } from "./profile-client";

export default function TeacherProfilePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">My Profile</h1>
      <Suspense
        fallback={
          <div className="space-y-4">
            <div className="h-32 rounded-lg bg-muted animate-pulse" />
            <div className="h-48 rounded-lg bg-muted animate-pulse" />
          </div>
        }
      >
        <TeacherProfileClient />
      </Suspense>
    </div>
  );
}
