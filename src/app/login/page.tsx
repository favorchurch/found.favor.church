"use client";

import { createClient } from "@/utils/supabase/client";
import { LogIn } from "lucide-react";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export default function LoginPage() {
  const supabase = createClient();

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      console.error("Error logging in:", error.message);
    }
  };

  return (
    <ErrorBoundary>
    <div className="flex min-h-screen items-center justify-center bg-bg px-6">
      <div className="w-full max-w-md space-y-8 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-xl bg-brand">
          <svg viewBox="0 0 16 16" className="h-10 w-10 fill-black">
            <path d="M8 1a3 3 0 100 6A3 3 0 008 1zM4 4a4 4 0 118 0 4 4 0 01-8 0zm-2 9a6 6 0 1112 0H2z" />
          </svg>
        </div>
        <div className="space-y-3">
          <h1 className="font-mono text-xl font-bold tracking-widest text-text-main uppercase">
            <span className="text-brand">{"LOST"}</span>{"&FOUND"}
          </h1>
          <p className="text-sm text-text-muted">
            Internal tracker for church staff and volunteers.
          </p>
        </div>

        <button
          onClick={handleLogin}
          className="group relative flex w-full items-center justify-center gap-3 rounded-lg border border-border-main bg-surface px-4 py-3 text-sm font-medium transition-all hover:border-brand/50 hover:bg-surface-hover"
        >
          <LogIn className="h-4 w-4 text-text-muted group-hover:text-brand" />
          Sign in with Google
        </button>

        <p className="font-mono text-[10px] tracking-tight text-text-dim uppercase">
          Authorized personnel only
        </p>
      </div>
    </div>
    </ErrorBoundary>
  );
}
