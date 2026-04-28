import { createClient } from "@/utils/supabase/server";
import { ItemForm } from "@/components/ui/ItemForm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function NewItemPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center gap-4">
        <Link 
          href="/admin/dashboard" 
          className="p-2 rounded-lg border border-border-main bg-surface text-text-dim hover:text-brand transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-main">Add New Item</h1>
          <p className="text-sm text-text-muted mt-1 uppercase tracking-tighter font-mono">Found Favor Church &bull; Lost & Found</p>
        </div>
      </div>

      <ItemForm currentUserEmail={user?.email} />
    </div>
  );
}
