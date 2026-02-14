"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  LineChart,
  Trophy,
  User,
  LogOut,
  Menu,
  X,
  BookOpen,
  Map,
  GraduationCap,
  BarChart3,
  Sparkles,
} from "lucide-react";
import { signOut } from "next-auth/react";

export interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  user: {
    firstName: string;
    lastName: string;
    email?: string;
    role: "student" | "teacher";
  };
  navItems: NavItem[];
}

export const studentNavItems: NavItem[] = [
  { href: "/student", label: "Home", icon: LayoutDashboard },
  { href: "/student/profile", label: "Profile", icon: User },
  { href: "/student/performance", label: "Performance", icon: LineChart },
  { href: "/student/achievements", label: "Achievements", icon: Trophy },
];

export const teacherNavItems: NavItem[] = [
  { href: "/teacher", label: "Home", icon: LayoutDashboard },
  { href: "/teacher/profile", label: "Profile", icon: User },
];

export function DashboardLayout({
  children,
  user,
  navItems,
}: DashboardLayoutProps) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/student" || href === "/teacher") return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <div className="min-h-screen bg-background font-body">
      {/* ═══════════════════════════════════════════ */}
      {/* Top Bar — Hand-drawn style                  */}
      {/* ═══════════════════════════════════════════ */}
      <header
        className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b-[3px] border-foreground"
      >
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex items-center justify-between h-16">
          {/* Logo */}
          <Link href={user.role === "teacher" ? "/teacher" : "/student"} className="flex items-center gap-2 group">
            <div
              className="w-10 h-10 bg-primary text-primary-foreground font-heading text-xl font-bold flex items-center justify-center border-[3px] border-foreground shadow-[3px_3px_0px_0px_#2d2d2d] group-hover:shadow-[1px_1px_0px_0px_#2d2d2d] group-hover:translate-x-[2px] group-hover:translate-y-[2px] transition-all duration-100"
              style={{ borderRadius: "255px 15px 225px 15px / 15px 225px 15px 255px" }}
            >
              A
            </div>
            <span className="font-heading text-2xl text-foreground hidden sm:inline">Aura</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 text-sm font-heading font-bold transition-all duration-100 border-[2px]",
                    active
                      ? "bg-primary text-primary-foreground border-foreground shadow-[3px_3px_0px_0px_#2d2d2d]"
                      : "bg-transparent text-muted-foreground border-transparent hover:border-foreground hover:bg-secondary hover:text-foreground hover:shadow-[2px_2px_0px_0px_#2d2d2d]"
                  )}
                  style={{ borderRadius: "25px 50px 25px 50px / 50px 25px 50px 25px" }}
                >
                  <Icon className="h-4 w-4" strokeWidth={2.5} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Section: User + Mobile Toggle */}
          <div className="flex items-center gap-3">
            {/* User Pill */}
            <div
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 border-2 border-foreground bg-secondary shadow-[2px_2px_0px_0px_#2d2d2d]"
              style={{ borderRadius: "255px 15px 225px 15px / 15px 225px 15px 255px" }}
            >
              <div
                className="w-7 h-7 bg-accent text-accent-foreground flex items-center justify-center font-heading text-xs font-bold border-2 border-foreground"
                style={{ borderRadius: "15px 225px 15px 255px / 225px 15px 255px 15px" }}
              >
                {user.firstName[0]}
              </div>
              <span className="text-sm font-heading font-bold text-foreground truncate max-w-[100px]">
                {user.firstName}
              </span>
            </div>

            {/* Sign Out */}
            <button
              onClick={() => signOut({ callbackUrl: "/auth/login" })}
              className="p-2 text-muted-foreground hover:text-accent hover:bg-accent/10 rounded-full transition-colors"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" strokeWidth={2.5} />
            </button>

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </header>

      {/* ═══════════════════════════════════════════ */}
      {/* Mobile Nav Dropdown                         */}
      {/* ═══════════════════════════════════════════ */}
      {isMobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div
            className="fixed top-16 left-4 right-4 z-50 md:hidden bg-background border-[3px] border-foreground shadow-[6px_6px_0px_0px_#2d2d2d] p-4 space-y-2"
            style={{ borderRadius: "25px 50px 25px 50px / 50px 25px 50px 25px" }}
          >
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 font-heading font-bold border-2 transition-all",
                    active
                      ? "bg-primary text-primary-foreground border-foreground shadow-[2px_2px_0px_0px_#2d2d2d]"
                      : "border-transparent text-muted-foreground hover:bg-secondary hover:border-foreground"
                  )}
                  style={{ borderRadius: "255px 15px 225px 15px / 15px 225px 15px 255px" }}
                >
                  <Icon className="h-5 w-5" strokeWidth={2.5} />
                  {item.label}
                </Link>
              );
            })}
            {/* Mobile user info */}
            <div className="pt-2 mt-2 border-t-2 border-dashed border-muted flex items-center gap-3 px-4 py-2">
              <div
                className="w-8 h-8 bg-accent text-accent-foreground flex items-center justify-center font-heading font-bold border-2 border-foreground"
                style={{ borderRadius: "255px 15px 225px 15px / 15px 225px 15px 255px" }}
              >
                {user.firstName[0]}
              </div>
              <div>
                <p className="font-heading font-bold text-sm">{user.firstName} {user.lastName}</p>
                <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ═══════════════════════════════════════════ */}
      {/* Main Content                                */}
      {/* ═══════════════════════════════════════════ */}
      <main className="flex-1 min-h-[calc(100vh-4rem)]">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-10">
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
