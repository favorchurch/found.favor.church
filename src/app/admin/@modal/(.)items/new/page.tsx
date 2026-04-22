import { ItemForm } from "@/components/ui/ItemForm";
import { ModalOverlay } from "@/components/ui/ModalOverlay";

export default function NewItemModalPage() {
  return (
    <ModalOverlay>
      <div className="p-6 border-b border-border-main bg-surface-active/50 rounded-t-2xl">
        <h2 className="text-xl font-bold tracking-tight text-text-main uppercase">
          Add New Entry
        </h2>
      </div>
      <div className="p-2 sm:p-6 pb-8">
        <ItemForm />
        <p className="text-[10px] text-text-dim mt-4 uppercase tracking-widest font-mono">
          Found Favor Church &bull; Lost & Found
        </p>
      </div>
    </ModalOverlay>
  );
}
