import { notFound } from "next/navigation";
import { ModalOverlay } from "@/components/ui/ModalOverlay";
import { PublicItemDetails } from "@/components/ui/PublicItemDetails";
import { getPublicCatalogItem } from "@/utils/publicCatalogItemServer";

export default async function PublicCatalogItemModalPage({
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
    <ModalOverlay>
      <PublicItemDetails item={item} />
    </ModalOverlay>
  );
}
