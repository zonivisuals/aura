import { auth } from "@/lib/auth/auth";
import { prismaClient } from "@/lib/prisma/prisma";
import { UserRole, type User } from "@/app/generated/prisma/client";
import { redirect } from "next/navigation";

export type AuthUser = {
  id: string;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
  prismaUser: User | null;
};

/**
 * Get the current authenticated user from NextAuth session + Prisma profile
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  const prismaUser = await prismaClient.user.findUnique({
    where: { id: session.user.id },
  });

  return {
    id: session.user.id,
    email: session.user.email ?? "",
    role: session.user.role ?? "",
    firstName: session.user.firstName ?? "",
    lastName: session.user.lastName ?? "",
    prismaUser,
  };
}

/**
 * Require authentication - redirects to login if not authenticated
 */
export async function requireAuth(): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/auth/login");
  }
  return user;
}

/**
 * Require a specific role - redirects if user doesn't have the required role
 */
export async function requireRole(
  allowedRoles: UserRole | UserRole[]
): Promise<User> {
  const user = await requireAuth();

  if (!user.prismaUser) {
    redirect("/auth/login");
  }

  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  if (!roles.includes(user.prismaUser.role)) {
    redirect("/unauthorized");
  }

  return user.prismaUser;
}

/**
 * Require teacher role
 */
export async function requireTeacher(): Promise<User> {
  return requireRole(UserRole.TEACHER);
}

/**
 * Require student role
 */
export async function requireStudent(): Promise<User> {
  return requireRole(UserRole.STUDENT);
}

/**
 * Check if current user has a specific role (non-redirecting)
 */
export async function hasRole(role: UserRole): Promise<boolean> {
  const user = await getCurrentUser();
  return user?.prismaUser?.role === role;
}

/**
 * Check if current user is a teacher (non-redirecting)
 */
export async function isTeacher(): Promise<boolean> {
  return hasRole(UserRole.TEACHER);
}

/**
 * Check if current user is a student (non-redirecting)
 */
export async function isStudent(): Promise<boolean> {
  return hasRole(UserRole.STUDENT);
}
