import { Suspense } from "react";
import { TeacherAnalyticsClient } from "./analytics-client";

export default async function TeacherAnalyticsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Suspense
          fallback={
            <div className="space-y-4">
              <div className="h-12 rounded-lg bg-muted animate-pulse" />
              <div className="h-64 rounded-lg bg-muted animate-pulse" />
              <div className="h-64 rounded-lg bg-muted animate-pulse" />
            </div>
          }
        >
          <TeacherAnalyticsClient classId={id} />
        </Suspense>
      </main>
    </div>
  );
}
