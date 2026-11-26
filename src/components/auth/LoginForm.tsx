import { LogIn } from "lucide-react";

const LOGIN_URL = "/auth/login?returnTo=%2Fadmin%2Fdashboard";

export function LoginForm() {
  return (
    <div className="w-full space-y-8 text-center p-8">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-xl bg-brand">
        <svg viewBox="0 0 16 16" className="h-10 w-10 fill-black">
          <path d="M8 1a3 3 0 100 6A3 3 0 008 1zM4 4a4 4 0 118 0 4 4 0 01-8 0zm-2 9a6 6 0 1112 0H2z" />
        </svg>
      </div>
      <div className="space-y-3">
        <h1 className="font-sans text-xl font-bold tracking-normal text-text-main uppercase">
          <span className="text-brand">{"LOST"}</span>{"&FOUND"}
        </h1>
        <p className="text-sm text-text-muted">
          Internal tracker for church staff and volunteers.
        </p>
      </div>

      <a
        href={LOGIN_URL}
        className="group relative flex w-full items-center justify-center gap-3 rounded-xl bg-brand px-6 py-2.5 text-sm font-semibold text-white shadow-sm shadow-brand/20 hover:bg-brand-dim transition-all"
      >
        <LogIn className="h-4 w-4" />
        Sign in
      </a>

      <p className="font-sans text-[10px] tracking-tight text-text-dim uppercase">
        Authorized personnel only
      </p>
    </div>
  );
}
