import { getCurrentUser } from "@/lib/auth/rbac";
import { redirect } from "next/navigation";
import { TeacherClassesClient } from "./classes-client";

export default async function TeacherDashboard() {
  const user = await getCurrentUser();

  if (!user?.prismaUser) {
    redirect("/auth/login");
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-xl font-semibold">Teacher Dashboard</h1>
            <span className="text-sm text-muted-foreground">
              {user.prismaUser.firstName} {user.prismaUser.lastName}
            </span>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <TeacherClassesClient />
      </main>
    </div>
  );
}
