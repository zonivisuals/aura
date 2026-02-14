import { getCurrentUser } from "@/lib/auth/rbac";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function StudentDashboard() {
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
              <h1 className="text-xl font-semibold">Student Dashboard</h1>
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
              You are logged in as a <strong>Student</strong>. From here you can:
            </p>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li>• Join classes with invite codes</li>
              <li>• Progress through learning tracks</li>
              <li>• Complete quizzes and exercises</li>
              <li>• Track your XP and achievements</li>
              <li>• See classmates&apos; progress</li>
            </ul>
          </div>

          <div className="grid md:grid-cols-4 gap-4">
            <div className="bg-card rounded-lg border p-4">
              <h3 className="font-medium">My Classes</h3>
              <p className="text-2xl font-bold mt-2">0</p>
              <p className="text-xs text-muted-foreground">Enrolled classes</p>
            </div>
            <div className="bg-card rounded-lg border p-4">
              <h3 className="font-medium">XP Earned</h3>
              <p className="text-2xl font-bold mt-2">0</p>
              <p className="text-xs text-muted-foreground">Total experience</p>
            </div>
            <div className="bg-card rounded-lg border p-4">
              <h3 className="font-medium">Lessons Completed</h3>
              <p className="text-2xl font-bold mt-2">0</p>
              <p className="text-xs text-muted-foreground">Across all tracks</p>
            </div>
            <div className="bg-card rounded-lg border p-4">
              <h3 className="font-medium">Current Streak</h3>
              <p className="text-2xl font-bold mt-2">0</p>
              <p className="text-xs text-muted-foreground">Days in a row</p>
            </div>
          </div>

          {/* Join Class Section */}
          <div className="bg-card rounded-lg border p-6">
            <h3 className="font-medium mb-4">Join a Class</h3>
            <div className="flex gap-2 max-w-md">
              <input
                type="text"
                placeholder="Enter invite code (e.g., ABC123)"
                className="flex-1 px-3 py-2 border rounded-md text-sm"
              />
              <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium">
                Join
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
