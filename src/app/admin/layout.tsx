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
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  if (!isAdmin(user.email)) {
    redirect("/catalog");
  }

  return (
    <AdminShell user={{ email: user.email }} modal={modal}>
      {children}
    </AdminShell>
  );
}
