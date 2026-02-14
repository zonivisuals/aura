import { Suspense } from "react";
import Link from "next/link";
import { LessonAttemptClient } from "./lesson-attempt-client";
import { ArrowLeft } from "lucide-react";

export default async function StudentLessonPage({
  params,
}: {
  params: Promise<{ lessonId: string }>;
}) {
  const { lessonId } = await params;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link
          href="/student"
          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-heading font-bold text-muted-foreground hover:text-foreground border-2 border-transparent hover:border-foreground hover:bg-secondary hover:shadow-[2px_2px_0px_0px_#2d2d2d] transition-all duration-100"
          style={{ borderRadius: "255px 15px 225px 15px / 15px 225px 15px 255px" }}
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={2.5} />
          Back
        </Link>
      </div>
      <Suspense
        fallback={
          <div className="space-y-3">
            <div className="h-12 border-2 border-dashed border-muted-foreground/20 bg-muted animate-pulse" style={{ borderRadius: "255px 15px 225px 15px / 15px 225px 15px 255px" }} />
            <div className="h-60 border-2 border-dashed border-muted-foreground/20 bg-muted animate-pulse" style={{ borderRadius: "25px 50px 25px 50px / 50px 25px 50px 25px" }} />
          </div>
        }
      >
        <LessonAttemptClient lessonId={lessonId} />
      </Suspense>
    </div>
  );
}
