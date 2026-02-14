import { getCurrentUser } from "@/lib/auth/rbac";
import { redirect } from "next/navigation";
import { ClassDetailClient } from "./class-detail-client";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function ClassDetailPage({
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
        <Link href="/teacher" className="p-2 -ml-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Class Details</h1>
      </div>
      <ClassDetailClient classId={id} />
    </div>
  );
}
