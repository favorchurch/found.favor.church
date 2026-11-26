import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/auth/admin";

export default async function AdminLayout({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  const admin = await requireAdmin({ redirect: true });

  return (
    <AdminShell user={{ email: admin.email }} modal={modal}>
      {children}
    </AdminShell>
  );
}
