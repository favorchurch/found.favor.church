import { ItemForm } from "@/components/ui/ItemForm";
import { ModalOverlay } from "@/components/ui/ModalOverlay";
import { getCategories } from "@/app/admin/actions/categories";
import { getVenues } from "@/app/admin/actions/venues";

export default async function NewItemModalPage() {
  const [categories, venues] = await Promise.all([getCategories(), getVenues()]);

  return (
    <ModalOverlay>
      <div className="p-6 border-b border-border-main bg-surface-active/50 rounded-t-2xl">
        <h2 className="text-xl font-bold tracking-tight text-text-main uppercase">
          Add New Entry
        </h2>
      </div>
      <div className="p-2 sm:p-6 pb-8">
        <ItemForm categories={categories} venues={venues} />
        <p className="text-[10px] text-text-dim mt-4 uppercase tracking-widest font-sans">
          Found Favor Church &bull; Lost & Found
        </p>
      </div>
    </ModalOverlay>
  );
}
