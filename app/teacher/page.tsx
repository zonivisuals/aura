import { getCurrentUser } from "@/lib/auth/rbac";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function TeacherDashboard() {
  const user = await getCurrentUser();
  
  if (!user?.prismaUser) {
    redirect("/auth/login");
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-semibold">Teacher Dashboard</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                {user.prismaUser.firstName} {user.prismaUser.lastName}
              </span>
              <Link
                href="/auth/logout"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Logout
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid gap-6">
          <div className="bg-card rounded-lg border p-6">
            <h2 className="text-lg font-medium mb-4">Welcome, {user.prismaUser.firstName}!</h2>
            <p className="text-muted-foreground">
              You are logged in as a <strong>Teacher</strong>. From here you can:
            </p>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li>• Create and manage classes</li>
              <li>• Upload course materials (PDFs)</li>
              <li>• Generate AI-powered quizzes</li>
              <li>• Monitor student progress</li>
              <li>• View class analytics</li>
            </ul>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-card rounded-lg border p-4">
              <h3 className="font-medium">My Classes</h3>
              <p className="text-2xl font-bold mt-2">0</p>
              <p className="text-xs text-muted-foreground">Active classes</p>
            </div>
            <div className="bg-card rounded-lg border p-4">
              <h3 className="font-medium">Total Students</h3>
              <p className="text-2xl font-bold mt-2">0</p>
              <p className="text-xs text-muted-foreground">Enrolled students</p>
            </div>
            <div className="bg-card rounded-lg border p-4">
              <h3 className="font-medium">Lessons Created</h3>
              <p className="text-2xl font-bold mt-2">0</p>
              <p className="text-xs text-muted-foreground">Across all tracks</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
