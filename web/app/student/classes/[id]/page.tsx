import { getCurrentUser } from "@/lib/auth/rbac";
import { redirect } from "next/navigation";
import { StudentClassDetailClient } from "./class-detail-client";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function StudentClassDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user?.prismaUser) {
    redirect("/auth/login");
  }

  const { id } = await params;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/student"
          className="p-2 -ml-2 border-2 border-transparent hover:border-foreground hover:bg-secondary hover:shadow-[2px_2px_0px_0px_#2d2d2d] transition-all duration-100 text-muted-foreground hover:text-foreground"
          style={{ borderRadius: "255px 15px 225px 15px / 15px 225px 15px 255px" }}
        >
          <ArrowLeft className="h-5 w-5" strokeWidth={2.5} />
        </Link>
        <h1 className="font-heading text-2xl md:text-3xl">Class Details 📝</h1>
      </div>
      <StudentClassDetailClient classId={id} />
    </div>
  );
}
