import { AuthButton } from "@/components/auth-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import Link from "next/link";
import { Suspense } from "react";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center">
      <div className="flex-1 w-full flex flex-col gap-20 items-center">
        <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
          <div className="w-full max-w-5xl flex justify-between items-center p-3 px-5 text-sm">
            <div className="flex gap-5 items-center font-semibold">
              <Link href={"/"}>Aura Learning</Link>
            </div>
            <Suspense>
              <AuthButton />
            </Suspense>
          </div>
        </nav>
        <div className="flex-1 flex flex-col gap-20 max-w-5xl p-5">
          <div className="flex flex-col gap-8 items-center text-center">
            <h1 className="text-4xl lg:text-5xl font-bold !leading-tight">
              Gamified Social Learning
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl">
              A modern AI-powered educational platform that combines
              personalized learning with social engagement and game mechanics.
            </p>
            <div className="flex gap-3">
              <Link
                href="/auth/sign-up"
                className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition"
              >
                Get Started
              </Link>
              <Link
                href="/auth/login"
                className="inline-flex items-center justify-center rounded-md border border-input px-6 py-3 text-sm font-medium hover:bg-accent transition"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>

        <footer className="w-full flex items-center justify-center border-t mx-auto text-center text-xs gap-8 py-16">
          <p>Aura Learning Platform</p>
          <ThemeSwitcher />
        </footer>
      </div>
    </main>
  );
}
