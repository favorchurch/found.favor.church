"use client";

import { LoginForm } from "@/components/auth/LoginForm";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export default function LoginPage() {
  return (
    <ErrorBoundary>
      <div className="flex min-h-screen items-center justify-center bg-bg px-6">
        <div className="w-full max-w-md bg-surface rounded-2xl border border-border-main shadow-xl">
          <LoginForm />
        </div>
      </div>
    </ErrorBoundary>
  );
}
