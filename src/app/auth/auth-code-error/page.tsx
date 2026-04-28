import Link from "next/link";
import { AlertTriangle } from "lucide-react";

export default function AuthErrorCodePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-6">
      <div className="w-full max-w-md space-y-8 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-xl bg-red-500/10 border border-red-500/20">
          <AlertTriangle className="h-8 w-8 text-red-500" />
        </div>
        <div className="space-y-3">
          <h1 className="font-sans text-xl font-bold tracking-widest text-text-main uppercase">
            Authentication Error
          </h1>
          <p className="text-sm text-text-muted">
            There was a problem signing you in. Please try again.
          </p>
        </div>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 rounded-lg border border-border-main bg-surface px-6 py-3 text-sm font-medium transition-all hover:border-brand/50 hover:bg-surface-hover"
        >
          Back to Login
        </Link>
      </div>
    </div>
  );
}
