import { Suspense } from "react";
import { TeacherAnalyticsClient } from "./analytics-client";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function TeacherAnalyticsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/teacher/classes/${id}`} className="p-2 -ml-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Class Analytics</h1>
      </div>
      <main className="max-w-6xl mx-auto py-4">
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
