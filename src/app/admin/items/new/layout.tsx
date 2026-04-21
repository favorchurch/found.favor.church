import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "New Item | Lost & Found — Favor Church",
  description: "Add a new lost and found item.",
};

export default function NewItemLayout({ children }: { children: React.ReactNode }) {
  return children;
}
