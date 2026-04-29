import { Calendar, MapPin, ShieldCheck, Tag } from "lucide-react";
import { format } from "date-fns";
import {
  getPublicItemLocation,
  type PublicCatalogItem,
} from "@/utils/publicCatalogItem";

interface PublicItemDetailsProps {
  item: PublicCatalogItem;
}

export function PublicItemDetails({ item }: PublicItemDetailsProps) {
  const fullLocation = getPublicItemLocation(item);

  return (
    <article className="bg-white">
      <div className="border-b border-border-main bg-surface-active/50 p-6">
        <div className="min-w-0">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border-main bg-surface px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-text-muted">
            <Tag className="h-3 w-3" />
            {item.category_name?.name || "Others"}
          </span>
          <h1 className="mt-3 text-2xl font-black leading-tight tracking-tight text-text-main sm:text-3xl">
            {item.name}
          </h1>
        </div>
      </div>

      <div className="space-y-6 p-6">
        <section>
          <h2 className="text-[10px] font-sans font-black uppercase tracking-widest text-text-dim">
            Description
          </h2>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-text-muted">
            {item.description || "No description provided."}
          </p>
        </section>

        <section className="grid gap-3 rounded-2xl border border-border-main bg-surface p-4 text-sm text-text-muted sm:grid-cols-2">
          <div className="flex min-w-0 items-center gap-2">
            <Calendar className="h-4 w-4 shrink-0 text-brand" />
            <span>{format(new Date(item.date_found), "MMM d, yyyy")}</span>
          </div>
          <div className="flex min-w-0 items-center gap-2">
            <MapPin className="h-4 w-4 shrink-0 text-brand" />
            {fullLocation ? (
              <span>{fullLocation}</span>
            ) : (
              <span className="italic opacity-60">No location</span>
            )}
          </div>
        </section>

        <div className="rounded-2xl bg-brand/10 px-4 py-3">
          <span className="block text-[9px] font-sans font-black uppercase tracking-widest text-brand/80">
            Claim Code
          </span>
          <span className="block font-sans text-lg font-black tracking-wide text-brand">
            {item.item_code}
          </span>
        </div>

        <div className="flex items-start gap-3 rounded-2xl border border-brand/20 bg-brand/5 p-4 text-sm leading-6 text-text-muted">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
          <span>
            Bring this claim code to the info booth or our shang office so our
            team can help you with next steps, or email us at{" "}
            <a
              href="mailto:info@favor.church"
              target="_blank"
              className="text-brand"
            >
              info@favor.church
            </a>
            .
          </span>
        </div>
      </div>
    </article>
  );
}
