import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login | Lost & Found — Favor Church",
  description: "Staff login for the Favor Church lost and found system.",
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
