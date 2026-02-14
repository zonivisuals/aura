import { getCurrentUser } from "@/lib/auth/rbac";
import { redirect } from "next/navigation";
import { StudentClassesClient } from "./classes-client";

export default async function StudentDashboard() {
  const user = await getCurrentUser();

  if (!user?.prismaUser) {
    redirect("/auth/login");
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
      <StudentClassesClient />
    </div>
  );
}
