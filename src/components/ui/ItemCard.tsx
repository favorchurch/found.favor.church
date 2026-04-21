"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Calendar,
  MapPin,
  CameraOff,
  Edit2,
  Trash2,
  ChevronDown,
  Eye,
  EyeOff,
} from "lucide-react";
import { format } from "date-fns";
import type { ItemStatus } from "./StatusBadge";
import { cn } from "@/utils/cn";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ConfirmModal } from "./ConfirmModal";
import { getPhotoUrl } from "@/utils/photo";
import { upsertItem, deleteItem } from "@/app/admin/actions/items";

export interface Item {
  id: string;
  name: string;
  description: string | null;
  date_found: string;
  location: string | null;
  status: ItemStatus;
  photo_path: string | null;
  is_public: boolean;
  created_at: string;
  claimed_date?: string | null;
  claimed_by?: string | null;
  disposed_date?: string | null;
  disposed_by?: string | null;
}

interface ItemCardProps {
  item: Item;
  onClick?: (item: Item) => void;
  className?: string;
  admin?: boolean;
}

export function ItemCard({
  item,
  onClick,
  className,
  admin = false,
}: ItemCardProps) {
  const router = useRouter();
  const [formData, setFormData] = useState<Partial<Item>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const currentItem = { ...item, ...formData };
  const hasChanges = Object.keys(formData).length > 0;

  const photoUrl = getPhotoUrl(currentItem.photo_path);

  const updateField = <K extends keyof Item>(field: K, value: Item[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const cancelEdits = () => {
    setFormData({});
    setIsEditing(false);
  };

  const saveEdits = async () => {
    if (!hasChanges) {
      setIsEditing(false);
      return;
    }

    if (currentItem.status === "claimed" && !currentItem.claimed_by) {
      toast.error("Claimant name is required");
      return;
    }
    if (currentItem.status === "disposed" && !currentItem.disposed_by) {
      toast.error("Disposer name is required");
      return;
    }

    const updates = { ...item, ...formData };

    if (updates.status === "claimed") {
      updates.claimed_date = updates.claimed_date || new Date().toISOString();
    } else if (updates.status === "disposed") {
      updates.disposed_date =
        updates.disposed_date || new Date().toISOString();
    }

    setFormData({});
    setIsEditing(false);
    setLoading(true);

    toast.promise(upsertItem(updates), {
      loading: "Updating item...",
      success: () => {
        router.refresh();
        return "Item updated seamlessly!";
      },
      error: "Failed to update item",
      finally: () => setLoading(false),
    });
  };

  const togglePrivacy = () => {
    const next = !currentItem.is_public;
    setFormData((prev) => ({ ...prev, is_public: next }));
    setLoading(true);

    toast.promise(upsertItem({ ...item, is_public: next }), {
      loading: "Updating privacy...",
      success: () => {
        router.refresh();
        return next ? "Item is now public" : "Item is now private";
      },
      error: () => {
        setFormData((prev) => ({ ...prev, is_public: !next }));
        return "Failed to update privacy";
      },
      finally: () => setLoading(false),
    });
  };

  const handleDelete = () => {
    setShowDeleteModal(false);
    setLoading(true);

    toast.promise(deleteItem(item.id, item.photo_path), {
      loading: "Deleting item...",
      success: () => {
        router.refresh();
        return "Item deleted";
      },
      error: "Failed to delete item",
      finally: () => setLoading(false),
    });
  };

  const statusStyles = {
    unclaimed: "text-yellow-500 border-yellow-500/20",
    claimed: "text-emerald-500 border-emerald-500/20",
    disposed: "text-red-500 border-red-500/20",
  };

  const statusIcons: Record<ItemStatus, string> = {
    unclaimed: "🟡 ",
    claimed: "✅ ",
    disposed: "❌ ",
  };

  return (
    <>
      <div
        className={cn(
          "group relative flex flex-col overflow-hidden rounded-xl border border-border-main transition-all duration-300",
          !admin && "cursor-pointer hover:border-border-hover/80",
          currentItem.status === "unclaimed"
            ? "border-l-4 border-l-yellow-500 bg-yellow-500/5"
            : currentItem.status === "claimed"
              ? "border-l-4 border-l-emerald-500 bg-emerald-500/5"
              : "border-l-4 border-l-red-500 bg-red-500/5",
          isEditing &&
            "shadow-2xl shadow-brand/10 ring-1 ring-brand/30 z-10 scale-[1.02]",
          className,
        )}
      >
        {/* Top Left Public/Private Badge (Glassmorphism) */}
        {admin && (
          <div className="absolute top-2 left-2 z-10">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (isEditing) {
                  updateField("is_public", !currentItem.is_public);
                } else {
                  togglePrivacy();
                }
              }}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg shadow-sm backdrop-blur-md border transition-all cursor-pointer",
                currentItem.is_public
                  ? "bg-black/80 text-brand border-brand/20 hover:bg-black/90"
                  : "bg-black/80 text-white/80 border-white/10 hover:bg-black/90",
              )}
              title={
                currentItem.is_public ? "Publicly Visible" : "Internal Check"
              }
            >
              {currentItem.is_public ? (
                <Eye className="h-3.5 w-3.5" />
              ) : (
                <EyeOff className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
        )}

        {/* Image Section */}
        <div
          onClick={() => {
            if (!isEditing && onClick) {
              onClick(currentItem);
            } else if (admin && !isEditing) {
              router.push(`/admin/items/${item.id}`);
            }
          }}
          className={cn(
            "aspect-[16/10] w-full overflow-hidden flex items-center justify-center relative bg-surface-hover/50",
            ((admin && !isEditing) || !admin) &&
              "cursor-pointer group-hover:opacity-90 transition-opacity",
          )}
        >
          {photoUrl ? (
            <>
              <img
                src={photoUrl}
                alt={currentItem.name}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              {!currentItem.is_public && (
                <div className="absolute inset-0 bg-black/50 shadow-[inset_0_0_60px_rgba(0,0,0,0.6)] pointer-events-none" />
              )}
            </>
          ) : (
            <div className="flex flex-col items-center gap-2 text-text-dim opacity-40">
              <CameraOff className="h-8 w-8" />
              <span className="font-mono text-[10px] uppercase">
                No photo attached
              </span>
            </div>
          )}

          {/* Status Badge — lower right inside image, links to edit modal */}
          <div
            className="absolute bottom-2 right-2 z-10"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}
          >
            {admin && isEditing ? (
              <div className="relative">
                <select
                  value={currentItem.status}
                  onChange={(e) =>
                    updateField("status", e.target.value as ItemStatus)
                  }
                  className={cn(
                    "text-[10px] font-mono font-bold tracking-wider uppercase border border-white/20 rounded-lg cursor-pointer appearance-none pl-2 pr-7 py-1 outline-none bg-black/80 backdrop-blur-md text-white transition-colors focus:ring-1 focus:ring-brand/50 w-[125px]",
                    statusStyles[currentItem.status],
                  )}
                >
                  <option value="unclaimed">
                    {"🟡"} Unclaimed
                  </option>
                  <option value="claimed">
                    {"✅"} Claimed
                  </option>
                  <option value="disposed">
                    {"❌"} Disposed
                  </option>
                </select>
                <ChevronDown className="h-3 w-3 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-50 text-white" />
              </div>
            ) : admin ? (
              <Link
                href={`/admin/items/${item.id}`}
                onClick={(e) => {
                  e.stopPropagation();
                }}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-mono text-[10px] font-bold tracking-wider uppercase border shadow-sm backdrop-blur-md bg-black/80 hover:bg-black/90 transition-colors",
                  statusStyles[currentItem.status],
                )}
              >
                {statusIcons[currentItem.status]}
                {currentItem.status}
              </Link>
            ) : (
              <div
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-mono text-[10px] font-bold tracking-wider uppercase border shadow-sm backdrop-blur-md bg-black/80",
                  statusStyles[currentItem.status],
                )}
              >
                {statusIcons[currentItem.status]}
                {currentItem.status}
              </div>
            )}
          </div>
        </div>

        {/* Content Section */}
        <div className="flex flex-col p-4 flex-1 backdrop-blur-sm z-10 bg-surface/50">
          <div className="flex items-start justify-between gap-2">
            {isEditing ? (
              <input
                autoFocus
                value={currentItem.name}
                onChange={(e) => updateField("name", e.target.value)}
                className="w-full bg-surface-active border border-border-hover rounded px-2 py-1 text-sm font-semibold text-text-main focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/50 transition-all font-mono"
              />
            ) : (
              <h3 className="line-clamp-1 text-sm font-semibold text-text-main opacity-90 pr-2">
                {currentItem.name}
              </h3>
            )}

            {admin && !isEditing && (
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsEditing(true);
                  }}
                  className="p-1.5 text-text-muted hover:text-brand bg-surface-hover rounded-md transition-colors"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    updateField("status", "disposed");
                    setIsEditing(true);
                  }}
                  className="p-1.5 text-text-muted hover:text-red-500 bg-surface-hover rounded-md transition-colors"
                  title="Quick Dispose"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>

          <div className="mt-1.5">
            {isEditing ? (
              <textarea
                value={currentItem.description || ""}
                onChange={(e) => updateField("description", e.target.value)}
                placeholder="Description..."
                rows={2}
                className="w-full bg-surface-active border border-border-hover rounded px-2 py-1 text-xs text-text-main focus:border-brand focus:outline-none resize-none hide-scrollbar font-mono"
              />
            ) : (
              <p className="line-clamp-2 text-xs leading-relaxed text-text-muted">
                {currentItem.description || "No description provided."}
              </p>
            )}
          </div>

          <div className="mt-4 flex flex-row justify-between gap-2 border-t border-border-main/50 pt-3">
            <div className="flex items-center gap-2 font-mono text-[10px] text-text-dim">
              <Calendar className="h-3 w-3" />
              {format(new Date(currentItem.date_found), "MMM dd, yyyy")}
            </div>
            {currentItem.location && (
              <div className="flex items-center gap-2 font-mono text-[10px] text-text-dim">
                <MapPin className="h-3 w-3" />
                {currentItem.location}
              </div>
            )}
          </div>

          {/* Conditional Claim / Dispose Input sliding down */}
          {isEditing &&
            (currentItem.status === "claimed" ||
              currentItem.status === "disposed") && (
              <div className="mt-3 animate-in fade-in slide-in-from-top-2 flex flex-col gap-2 p-2 rounded-lg bg-surface-active border border-border-hover">
                <div className="space-y-1">
                  <label className="text-[9px] font-mono uppercase tracking-widest text-text-dim px-1">
                    {currentItem.status === "claimed"
                      ? "Claimed By *"
                      : "Disposed By *"}
                  </label>
                  <input
                    value={
                      currentItem.status === "claimed"
                        ? currentItem.claimed_by || ""
                        : currentItem.disposed_by || ""
                    }
                    onChange={(e) =>
                      updateField(
                        currentItem.status === "claimed"
                          ? "claimed_by"
                          : "disposed_by",
                        e.target.value,
                      )
                    }
                    placeholder="Enter name..."
                    className={cn(
                      "w-full bg-surface border rounded px-2 py-1.5 text-xs text-text-main focus:outline-none transition-colors",
                      currentItem.status === "claimed"
                        ? "border-emerald-500/30 focus:border-emerald-500 placeholder-emerald-500/30"
                        : "border-red-500/30 focus:border-red-500 placeholder-red-500/30",
                    )}
                  />
                </div>
              </div>
            )}

          {/* Editing Save/Cancel Action Group */}
          {isEditing && (
            <div className="mt-3 flex flex-col sm:flex-row items-center gap-1.5 animate-in fade-in zoom-in-95">
              <button
                onClick={cancelEdits}
                disabled={loading}
                className="p-1 px-2 rounded font-mono text-[9px] uppercase tracking-widest text-text-dim hover:text-text-main hover:bg-surface-active transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={saveEdits}
                disabled={
                  loading ||
                  (currentItem.status === "claimed" &&
                    !currentItem.claimed_by) ||
                  (currentItem.status === "disposed" &&
                    !currentItem.disposed_by)
                }
                className="p-1 px-3 rounded font-mono text-[9px] font-bold uppercase tracking-widest bg-brand text-black hover:bg-brand-dim transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "..." : "Save"}
              </button>
            </div>
          )}

          {/* Contextual indicators when NOT editing */}
          {!isEditing &&
            admin &&
            currentItem.claimed_by &&
            currentItem.status === "claimed" && (
              <span className="text-[9px] font-mono text-emerald-500 opacity-80 uppercase tracking-tighter truncate max-w-[100px]">
                By {currentItem.claimed_by}
              </span>
            )}
          {!isEditing &&
            admin &&
            currentItem.disposed_by &&
            currentItem.status === "disposed" && (
              <span className="text-[9px] font-mono text-red-500 opacity-80 uppercase tracking-tighter truncate max-w-[100px]">
                By {currentItem.disposed_by}
              </span>
            )}
        </div>
      </div>

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Item Permanently"
        description={`Are you sure you want to delete "${currentItem.name}"? This action cannot be undone.`}
        confirmText="Delete"
        loading={loading}
      />
    </>
  );
}
