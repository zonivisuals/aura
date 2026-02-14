import { requireTeacher, getCurrentUser } from "@/lib/auth/rbac";
import { Suspense } from "react";
import { DashboardLayout, teacherNavItems } from "@/components/dashboard-layout";

async function TeacherGate({ children }: { children: React.ReactNode }) {
  await requireTeacher();
  const user = await getCurrentUser();

  if (!user || !user.prismaUser) return null;

  return (
    <DashboardLayout 
      user={{
        firstName: user.prismaUser.firstName,
        lastName: user.prismaUser.lastName,
        role: "teacher"
      }} 
      navItems={teacherNavItems}
    >
      {children}
    </DashboardLayout>
  );
}

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense>
      <TeacherGate>{children}</TeacherGate>
    </Suspense>
  );
}
