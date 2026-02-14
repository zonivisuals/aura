import { requireStudent } from "@/lib/auth/rbac";
import { Suspense } from "react";

async function StudentGate({ children }: { children: React.ReactNode }) {
  await requireStudent();
  return <>{children}</>;
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
