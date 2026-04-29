import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { PublicItemDetails } from "@/components/ui/PublicItemDetails";
import { getPublicCatalogItem } from "@/utils/publicCatalogItemServer";

export default async function PublicCatalogItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = await getPublicCatalogItem(id);

  if (!item) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-bg px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-3xl space-y-4">
        <Link
          href="/catalog"
          className="inline-flex items-center gap-2 rounded-full border border-border-main bg-white px-4 py-2 text-[10px] font-sans font-bold uppercase tracking-widest text-text-muted transition-colors hover:border-brand/40 hover:text-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to catalog
        </Link>

        <div className="overflow-hidden rounded-2xl border border-border-main bg-white shadow-lg shadow-brand/5">
          <PublicItemDetails item={item} />
        </div>
      </div>
    </main>
  );
}
