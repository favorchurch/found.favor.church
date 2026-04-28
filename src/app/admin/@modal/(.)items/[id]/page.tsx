import { createClient } from "@/utils/supabase/server";
import { ItemForm } from "@/components/ui/ItemForm";
import { notFound } from "next/navigation";
import { ModalOverlay } from "@/components/ui/ModalOverlay";
import { getCategories } from "@/app/admin/actions/categories";
import { getVenues } from "@/app/admin/actions/venues";

export default async function EditItemModalPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: item, error }, categories, venues] = await Promise.all([
    supabase
      .from("found_items")
      .select("*, category_name:found_item_categories(name), venue_name:found_item_venues(name)")
      .eq("id", id)
      .single(),
    getCategories(),
    getVenues(),
  ]);

  if (error || !item) {
    notFound();
  }

  return (
    <ModalOverlay>
      <div className="p-6 border-b border-border-main bg-surface-active/50 rounded-t-2xl">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-xl font-bold tracking-tight text-text-main uppercase">
            UPDATE: {item.name}
          </h2>
          {item.created_by_email && (
            <p className="text-[10px] font-sans text-text-dim uppercase tracking-widest">
              Entry by: {item.created_by_email}
            </p>
          )}
        </div>
      </div>
      <div className="p-2 sm:p-6 pb-8">
        <ItemForm initialData={item} categories={categories} venues={venues} />
        <p className="text-xs text-text-muted mt-1 uppercase tracking-tighter">
          ID: {id}
        </p>
      </div>
    </ModalOverlay>
  );
}
