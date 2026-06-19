import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { isAdmin } from "@/utils/admin";

export default async function AdminLayout({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  const supabase = await createClient({ useServiceRole: false });
  const { data: { user } } = await supabase.auth.getUser();
  const isDev = process.env.NODE_ENV === "development";
  const mockDevUser = {
    id: "00000000-0000-0000-0000-000000000000",
    email: "dev@favor.church",
  };
  const effectiveUser = user || (isDev ? mockDevUser : null);

  if (!effectiveUser) {
    redirect("/login");
  }

  if (!isAdmin(effectiveUser.email)) {
    redirect("/");
  }

  return (
    <AdminShell user={{ email: effectiveUser.email }} modal={modal}>
      {children}
    </AdminShell>
  );
}
