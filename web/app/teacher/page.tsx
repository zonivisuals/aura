import { getCurrentUser } from "@/lib/auth/rbac";
import { redirect } from "next/navigation";
import { TeacherClassesClient } from "./classes-client";

export default async function TeacherDashboard() {
  const user = await getCurrentUser();

  if (!user?.prismaUser) {
    redirect("/auth/login");
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
      <TeacherClassesClient />
    </div>
  );
}
