import { Suspense } from "react";
import { StudentDrilldownClient } from "./student-drilldown-client";

export default async function StudentDrilldownPage({
  params,
}: {
  params: Promise<{ id: string; studentId: string }>;
}) {
  const { id, studentId } = await params;

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Suspense
          fallback={
            <div className="space-y-4">
              <div className="h-12 rounded-lg bg-muted animate-pulse" />
              <div className="h-64 rounded-lg bg-muted animate-pulse" />
            </div>
          }
        >
          <StudentDrilldownClient classId={id} studentId={studentId} />
        </Suspense>
      </main>
    </div>
  );
}
