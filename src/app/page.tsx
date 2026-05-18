import type { Metadata } from "next";
import Link from "next/link";
import { Mail, MapPin } from "lucide-react";

export const metadata: Metadata = {
  title: "Lost & Found | Favor Church",
  description:
    "Need help with a lost item at Favor Church? Email our team so we can help you directly.",
};

function GoogleIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.24 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06L5.84 9.9C6.71 7.31 9.14 5.38 12 5.38z"
      />
    </svg>
  );
}

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col bg-bg">
      <section className="flex flex-1 items-center px-4 py-10 sm:px-6">
        <div className="mx-auto grid w-full max-w-5xl gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-center">
          <div className="space-y-6">
            <p className="font-sans text-[10px] font-black uppercase tracking-widest text-brand">
              Favor Church Lost &amp; Found
            </p>
            <div className="space-y-4">
              <h1 className="max-w-3xl text-4xl font-black tracking-tight text-text-main sm:text-5xl">
                Lost something at church?
              </h1>
              <p className="max-w-2xl text-base leading-7 text-text-muted">
                Email our team at{" "}
                <a className="font-semibold text-brand" href="mailto:info@favor.church">
                  info@favor.church
                </a>{" "}
                with a short description, the date you visited, and where you may have left it.
                We will help check it for you directly.
              </p>
            </div>
            <div className="grid gap-3 text-sm leading-6 text-text-muted sm:grid-cols-2">
              <div className="rounded-2xl border border-border-main bg-white p-4 shadow-sm">
                <Mail className="mb-3 h-5 w-5 text-brand" />
                <p className="font-sans text-[10px] font-black uppercase tracking-widest text-brand">
                  Email us
                </p>
                <p className="mt-1">
                  Include the item, date, service time, and any identifying details.
                </p>
              </div>
              <div className="rounded-2xl border border-border-main bg-white p-4 shadow-sm">
                <MapPin className="mb-3 h-5 w-5 text-brand" />
                <p className="font-sans text-[10px] font-black uppercase tracking-widest text-brand">
                  Visit the info booth
                </p>
                <p className="mt-1">
                  Our team can help after services at Favor Studio, Shangri-La Plaza.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-border-main bg-white p-6 text-center shadow-lg shadow-brand/5">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand/10">
              <GoogleIcon />
            </div>
            <h2 className="text-lg font-bold text-text-main">Staff access</h2>
            <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-text-muted">
              Staff and volunteers can sign in to manage the internal catalogue.
            </p>
            <Link
              href="/login"
              className="mt-5 inline-flex w-full items-center justify-center gap-3 rounded-2xl bg-brand px-6 py-4 font-sans text-[11px] font-black uppercase tracking-widest text-white shadow-sm shadow-brand/20 transition-all hover:bg-brand-dim focus:outline-none focus:ring-4 focus:ring-brand/20"
            >
              <GoogleIcon />
              Login as Staff
            </Link>
          </div>
        </div>
      </section>
      <footer className="border-t border-brand-dim bg-brand-deep px-6 py-8 text-center">
        <p className="font-sans text-xs font-black uppercase text-white">
          &copy; {new Date().getFullYear()}&nbsp;Favor Church &bull; Lost &amp; Found
        </p>
      </footer>
    </main>
  );
}
