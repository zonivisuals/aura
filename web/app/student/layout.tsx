import { requireStudent, getCurrentUser } from "@/lib/auth/rbac";
import { Suspense } from "react";
import { DashboardLayout, studentNavItems } from "@/components/dashboard-layout";

async function StudentGate({ children }: { children: React.ReactNode }) {
  // requireStudent typically redirects if not student.
  await requireStudent();
  const user = await getCurrentUser();
  
  if (!user || !user.prismaUser) return null; // Should be handled by requireStudent

  return (
    <DashboardLayout 
      user={{
        firstName: user.prismaUser.firstName,
        lastName: user.prismaUser.lastName,
        role: "student"
      }} 
      navItems={studentNavItems}
    >
      {children}
    </DashboardLayout>
  );
}

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense>
      <StudentGate>{children}</StudentGate>
    </Suspense>
  );
}
