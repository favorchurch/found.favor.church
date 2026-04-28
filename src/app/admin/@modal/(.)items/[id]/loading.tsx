import { ModalOverlay } from "@/components/ui/ModalOverlay";

export default function EditItemModalLoading() {
  return (
    <ModalOverlay>
      <div className="p-6 border-b border-border-main bg-surface-active/50 rounded-t-2xl">
        <div className="space-y-2 animate-pulse">
          <div className="h-6 w-56 rounded-lg bg-surface-active" />
          <div className="h-3 w-36 rounded bg-surface-active" />
        </div>
      </div>
      <div className="p-2 sm:p-6 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-pulse">
          <div className="space-y-6">
            {[...Array(6)].map((_, index) => (
              <div
                key={index}
                className="h-16 rounded-xl border border-border-main bg-surface-active"
              />
            ))}
          </div>
          <div className="aspect-square rounded-xl border border-border-main bg-surface-active" />
        </div>
      </div>
    </ModalOverlay>
  );
}
