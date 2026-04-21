import { createClient } from "@/utils/supabase/server";
import { ItemForm } from "@/components/ui/ItemForm";
import { notFound } from "next/navigation";
import { ModalOverlay } from "@/components/ui/ModalOverlay";

export default async function EditItemModalPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: item, error } = await supabase
    .from("found_items")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !item) {
    notFound();
  }

  return (
    <ModalOverlay>
      <div className="p-6 border-b border-border-main bg-surface-active/50 rounded-t-2xl">
        <h2 className="text-xl font-bold tracking-tight text-text-main uppercase">
          UPDATE: {item.name}
        </h2>
      </div>
      <div className="p-2 sm:p-6 pb-8">
        <ItemForm initialData={item} />
        <p className="text-xs text-text-muted mt-1 uppercase tracking-tighter">
          ID: {id}
        </p>
      </div>
    </ModalOverlay>
  );
}
