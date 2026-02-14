import { getCurrentUser } from "@/lib/auth/rbac";
import { redirect } from "next/navigation";
import { ClassDetailClient } from "./class-detail-client";

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
    <div className="min-h-screen bg-background">
      <nav className="border-b">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-3">
              <a
                href="/teacher"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                ← Back
              </a>
              <h1 className="text-xl font-semibold">Class Details</h1>
            </div>
            <span className="text-sm text-muted-foreground">
              {user.prismaUser.firstName} {user.prismaUser.lastName}
            </span>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ClassDetailClient classId={id} />
      </main>
    </div>
  );
}
