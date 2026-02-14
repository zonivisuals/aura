import { requireTeacher } from "@/lib/auth/rbac";
import { Suspense } from "react";

async function TeacherGate({ children }: { children: React.ReactNode }) {
  await requireTeacher();
  return <>{children}</>;
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
