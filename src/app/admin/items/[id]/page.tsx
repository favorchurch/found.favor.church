import { createClient } from "@/utils/supabase/server";
import { ItemForm } from "@/components/ui/ItemForm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function EditItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: item, error } = await supabase
    .from("items")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !item) {
    notFound();
  }

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
          <h1 className="text-2xl font-bold tracking-tight text-text-main">Edit Item</h1>
          <p className="text-sm text-text-muted mt-1 uppercase tracking-tighter font-mono">ID: {id}</p>
        </div>
      </div>

      <ItemForm initialData={item} />
    </div>
  );
}
