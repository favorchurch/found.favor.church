import { ModalOverlay } from "@/components/ui/ModalOverlay";

export default function NewItemModalLoading() {
  return (
    <ModalOverlay>
      <div className="p-6 border-b border-border-main bg-surface-active/50 rounded-t-2xl">
        <div className="h-6 w-40 animate-pulse rounded-lg bg-surface-active" />
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
