import { getCurrentUser } from "@/lib/auth/rbac";
import { redirect } from "next/navigation";
import { StudentClassesClient } from "./classes-client";
import Link from "next/link";

export default async function StudentDashboard() {
  const user = await getCurrentUser();

  if (!user?.prismaUser) {
    redirect("/auth/login");
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-xl font-semibold">Student Dashboard</h1>
            <div className="flex items-center gap-4">
              <Link
                href="/student/performance"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Performance
              </Link>
              <Link
                href="/student/profile"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Profile
              </Link>
              <Link
                href="/student/achievements"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Achievements
              </Link>
              <span className="text-sm text-muted-foreground">
                {user.prismaUser.firstName} {user.prismaUser.lastName}
              </span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <StudentClassesClient />
      </main>
    </div>
  );
}
