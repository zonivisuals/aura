import { Suspense } from "react";
import { TeacherProfileClient } from "./profile-client";

export default function TeacherProfilePage() {
  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-xl font-semibold">My Profile</h1>
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
      </main>
    </div>
  );
}
