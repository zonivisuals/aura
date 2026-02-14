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
      <h1 className="font-heading text-3xl md:text-4xl text-foreground">My Classes 📚</h1>
      <TeacherClassesClient />
    </div>
  );
}
