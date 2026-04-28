"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  Edit2,
  MapPin,
  Plus,
  RefreshCw,
  Save,
  ShieldAlert,
  SlidersHorizontal,
  Tag,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import {
  deleteCategory,
  getCategories,
  upsertCategory,
} from "@/app/admin/actions/categories";
import { deleteVenue, getVenues, upsertVenue } from "@/app/admin/actions/venues";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { cn } from "@/utils/cn";

interface Category {
  slug: string;
  name: string;
  prefix: string;
  created_at: string;
}

interface Venue {
  slug: string;
  name: string;
  parent_slug: string | null;
  display_order: number;
  created_at: string;
}

type SettingsTab = "categories" | "venues" | "advanced";

export default function SettingsPage() {
  const [tab, setTab] = useState<SettingsTab>("categories");

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-sans font-black uppercase tracking-tight text-text-main">
            Settings
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Manage catalog structure and advanced admin tools.
          </p>
        </div>
        <div className="inline-flex rounded-xl border border-border-main bg-surface p-1">
          <TabButton
            active={tab === "categories"}
            icon={<Tag className="h-3.5 w-3.5" />}
            label="Categories"
            onClick={() => setTab("categories")}
          />
          <TabButton
            active={tab === "venues"}
            icon={<MapPin className="h-3.5 w-3.5" />}
            label="Venues"
            onClick={() => setTab("venues")}
          />
          <TabButton
            active={tab === "advanced"}
            icon={<SlidersHorizontal className="h-3.5 w-3.5" />}
            label="Advanced"
            onClick={() => setTab("advanced")}
          />
        </div>
      </div>

      {tab === "categories" && <CategoriesSettings />}
      {tab === "venues" && <VenuesSettings />}
      {tab === "advanced" && <AdvancedSettings />}
    </div>
  );
}

function TabButton({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-[10px] font-sans font-bold uppercase tracking-widest transition-all",
        active
          ? "bg-brand text-white shadow-sm shadow-brand/20"
          : "text-text-dim hover:bg-surface-hover hover:text-text-main",
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function CategoriesSettings() {
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);
  const [reassignTo, setReassignTo] = useState("");
  const [formData, setFormData] = useState({ slug: "", name: "", prefix: "" });

  const categoriesQuery = useQuery({
    queryKey: ["found-item-categories"],
    queryFn: async () => (await getCategories()) as Category[],
  });
  const categories = categoriesQuery.data ?? [];

  const upsertMutation = useMutation({
    mutationFn: upsertCategory,
    onSuccess: async () => {
      setIsAdding(false);
      setEditingSlug(null);
      setFormData({ slug: "", name: "", prefix: "" });
      await queryClient.invalidateQueries({ queryKey: ["found-item-categories"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: ({
      slug,
      reassignToSlug,
    }: {
      slug: string;
      reassignToSlug: string;
    }) => deleteCategory(slug, reassignToSlug),
    onSuccess: async () => {
      setShowDeleteModal(null);
      setReassignTo("");
      await queryClient.invalidateQueries({ queryKey: ["found-item-categories"] });
    },
  });

  const handleUpsert = async (e: FormEvent) => {
    e.preventDefault();

    toast.promise(upsertMutation.mutateAsync(formData), {
      loading: "Saving category...",
      success: "Category saved!",
      error: (err) => err.message || "Failed to save category",
    });
  };

  const handleDelete = async () => {
    if (!showDeleteModal || !reassignTo) return;

    toast.promise(
      deleteMutation.mutateAsync({
        slug: showDeleteModal,
        reassignToSlug: reassignTo,
      }),
      {
      loading: "Deleting category and reassigning items...",
      success: "Category deleted and items reassigned!",
      error: (err) => err.message || "Failed to delete category",
      },
    );
  };

  const startEdit = (cat: Category) => {
    setEditingSlug(cat.slug);
    setFormData({ slug: cat.slug, name: cat.name, prefix: cat.prefix });
  };

  return (
    <SettingsTableShell
      title="Item Categories"
      description="Manage categories and their item code prefixes."
      icon={<Tag className="h-5 w-5" />}
      buttonLabel="New Category"
      onAdd={() => {
        setIsAdding(true);
        setEditingSlug(null);
        setFormData({ slug: "", name: "", prefix: "" });
      }}
    >
      {(isAdding || editingSlug) && (
        <div className="bg-surface border border-brand/20 rounded-2xl p-6 shadow-xl animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-xl bg-brand/10 flex items-center justify-center text-brand">
              <Tag className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-sans font-black uppercase text-text-main">
              {editingSlug ? "Edit Category" : "New Category"}
            </h2>
          </div>

          <form
            onSubmit={handleUpsert}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            <TextField
              label="Display Name"
              required
              value={formData.name}
              onChange={(name) =>
                setFormData((prev) => ({
                  ...prev,
                  name,
                  slug: editingSlug ? prev.slug : slugify(name),
                }))
              }
              placeholder="e.g. Mobile Phones"
            />
            <TextField
              label="Slug (Internal ID)"
              required
              disabled={!!editingSlug}
              value={formData.slug}
              onChange={(slug) => setFormData({ ...formData, slug })}
              placeholder="mobile_phones"
            />
            <TextField
              label="Code Prefix (2-4 Letters)"
              required
              value={formData.prefix}
              onChange={(prefix) =>
                setFormData({
                  ...formData,
                  prefix: prefix.toUpperCase().slice(0, 4),
                })
              }
              placeholder="PHN"
              className="font-bold tracking-widest"
            />
            <FormActions
              submitLabel={editingSlug ? "Update Category" : "Create Category"}
              onCancel={() => {
                setIsAdding(false);
                setEditingSlug(null);
              }}
            />
          </form>
        </div>
      )}

      <div className="bg-surface border border-border-main rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-border-main bg-surface-active/50">
                <HeaderCell>Category Name</HeaderCell>
                <HeaderCell>Slug</HeaderCell>
                <HeaderCell>Prefix</HeaderCell>
                <HeaderCell className="text-right">Actions</HeaderCell>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-main">
              {categoriesQuery.isLoading ? (
                <LoadingRow colSpan={4} label="Loading categories..." />
              ) : categoriesQuery.isError ? (
                <EmptyRow colSpan={4} label="Failed to load categories." />
              ) : categories.length === 0 ? (
                <EmptyRow colSpan={4} label="No categories found." />
              ) : (
                categories.map((cat) => (
                  <tr
                    key={cat.slug}
                    className="hover:bg-surface-active/30 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-surface-active border border-border-main flex items-center justify-center text-brand font-bold text-xs">
                          {cat.prefix}
                        </div>
                        <span className="text-sm font-semibold text-text-main">
                          {cat.name}
                        </span>
                      </div>
                    </td>
                    <SlugCell slug={cat.slug} />
                    <td className="px-6 py-4">
                      <span className="text-xs font-sans font-bold tracking-widest text-brand">
                        {cat.prefix}
                      </span>
                    </td>
                    <ActionCell
                      onEdit={() => startEdit(cat)}
                      onDelete={() => {
                        setShowDeleteModal(cat.slug);
                        setReassignTo(
                          categories.find((c) => c.slug !== cat.slug)?.slug ||
                            "",
                        );
                      }}
                    />
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ReassignModal
        isOpen={!!showDeleteModal}
        title="Delete Category"
        entityLabel="category"
        entitySlug={showDeleteModal}
        options={categories.filter((c) => c.slug !== showDeleteModal)}
        reassignTo={reassignTo}
        onReassignToChange={setReassignTo}
        onClose={() => setShowDeleteModal(null)}
        onConfirm={handleDelete}
      />
    </SettingsTableShell>
  );
}

function VenuesSettings() {
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);
  const [reassignTo, setReassignTo] = useState("");
  const [formData, setFormData] = useState<{
    slug: string;
    name: string;
    parent_slug: string;
  }>({ slug: "", name: "", parent_slug: "" });

  const venuesQuery = useQuery({
    queryKey: ["found-item-venues"],
    queryFn: async () => (await getVenues()) as Venue[],
  });
  const venues = venuesQuery.data ?? [];

  const upsertMutation = useMutation({
    mutationFn: upsertVenue,
    onSuccess: async () => {
      setIsAdding(false);
      setEditingSlug(null);
      setFormData({ slug: "", name: "", parent_slug: "" });
      await queryClient.invalidateQueries({ queryKey: ["found-item-venues"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: ({
      slug,
      reassignToSlug,
    }: {
      slug: string;
      reassignToSlug: string;
    }) => deleteVenue(slug, reassignToSlug),
    onSuccess: async () => {
      setShowDeleteModal(null);
      setReassignTo("");
      await queryClient.invalidateQueries({ queryKey: ["found-item-venues"] });
    },
  });

  const handleUpsert = async (e: FormEvent) => {
    e.preventDefault();

    toast.promise(
      upsertMutation.mutateAsync({
        ...formData,
        parent_slug: formData.parent_slug || null,
      }),
      {
        loading: "Saving venue...",
        success: "Venue saved!",
        error: (err) => err.message || "Failed to save venue",
      },
    );
  };

  const handleDelete = async () => {
    if (!showDeleteModal || !reassignTo) return;

    toast.promise(
      deleteMutation.mutateAsync({
        slug: showDeleteModal,
        reassignToSlug: reassignTo,
      }),
      {
        loading: "Deleting venue and reassigning items...",
        success: "Venue deleted and items reassigned!",
        error: (err) => err.message || "Failed to delete venue",
      },
    );
  };

  const startEdit = (venue: Venue) => {
    setEditingSlug(venue.slug);
    setFormData({
      slug: venue.slug,
      name: venue.name,
      parent_slug: venue.parent_slug || "",
    });
  };

  const venuesBySlug = new Map(venues.map((v) => [v.slug, v]));
  const venueHasChildren = (slug: string) =>
    venues.some((v) => v.parent_slug === slug);
  const parentOptions = venues.filter((v) => {
    if (v.slug === formData.slug) return false;
    if (v.parent_slug) return false;
    if (editingSlug && venueHasChildren(editingSlug)) return false;
    return true;
  });

  return (
    <SettingsTableShell
      title="Venues"
      description="Manage structured venues for catalog filtering."
      icon={<MapPin className="h-5 w-5" />}
      buttonLabel="New Venue"
      onAdd={() => {
        setIsAdding(true);
        setEditingSlug(null);
        setFormData({ slug: "", name: "", parent_slug: "" });
      }}
    >
      {(isAdding || editingSlug) && (
        <div className="bg-surface border border-brand/20 rounded-2xl p-6 shadow-xl animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-xl bg-brand/10 flex items-center justify-center text-brand">
              <MapPin className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-sans font-black uppercase text-text-main">
              {editingSlug ? "Edit Venue" : "New Venue"}
            </h2>
          </div>

          <form
            onSubmit={handleUpsert}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            <TextField
              label="Display Name"
              required
              value={formData.name}
              onChange={(name) =>
                setFormData((prev) => ({
                  ...prev,
                  name,
                  slug: editingSlug ? prev.slug : slugify(name),
                }))
              }
              placeholder="e.g. Shang Office"
            />
            <TextField
              label="Slug (Internal ID)"
              required
              disabled={!!editingSlug}
              value={formData.slug}
              onChange={(slug) => setFormData({ ...formData, slug })}
              placeholder="shang_office"
            />
            <SelectField
              label="Parent Venue (Optional)"
              value={formData.parent_slug}
              onChange={(parent_slug) =>
                setFormData({ ...formData, parent_slug })
              }
              options={[
                { value: "", label: "(Top-level)" },
                ...parentOptions.map((v) => ({
                  value: v.slug,
                  label: v.name,
                })),
              ]}
              disabled={
                !!editingSlug && venueHasChildren(editingSlug)
              }
              hint={
                editingSlug && venueHasChildren(editingSlug)
                  ? "Cannot nest: this venue already has children."
                  : "Group this venue under a top-level venue."
              }
            />
            <FormActions
              submitLabel={editingSlug ? "Update Venue" : "Create Venue"}
              onCancel={() => {
                setIsAdding(false);
                setEditingSlug(null);
              }}
            />
          </form>
        </div>
      )}

      <div className="bg-surface border border-border-main rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-border-main bg-surface-active/50">
                <HeaderCell>Venue Name</HeaderCell>
                <HeaderCell>Slug</HeaderCell>
                <HeaderCell>Parent</HeaderCell>
                <HeaderCell className="text-right">Actions</HeaderCell>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-main">
              {venuesQuery.isLoading ? (
                <LoadingRow colSpan={4} label="Loading venues..." />
              ) : venuesQuery.isError ? (
                <EmptyRow colSpan={4} label="Failed to load venues." />
              ) : venues.length === 0 ? (
                <EmptyRow colSpan={4} label="No venues found." />
              ) : (
                venues.map((venue) => (
                  <tr
                    key={venue.slug}
                    className="hover:bg-surface-active/30 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "h-8 w-8 rounded-lg bg-surface-active border border-border-main flex items-center justify-center text-brand",
                            venue.parent_slug && "ml-4 opacity-70",
                          )}
                        >
                          <MapPin className="h-4 w-4" />
                        </div>
                        <span className="text-sm font-semibold text-text-main">
                          {venue.name}
                        </span>
                      </div>
                    </td>
                    <SlugCell slug={venue.slug} />
                    <td className="px-6 py-4">
                      {venue.parent_slug ? (
                        <span className="text-xs text-text-muted">
                          {venuesBySlug.get(venue.parent_slug)?.name ||
                            venue.parent_slug}
                        </span>
                      ) : (
                        <span className="text-[10px] font-sans font-bold uppercase tracking-widest text-text-dim">
                          Top-level
                        </span>
                      )}
                    </td>
                    <ActionCell
                      onEdit={() => startEdit(venue)}
                      onDelete={() => {
                        setShowDeleteModal(venue.slug);
                        setReassignTo(
                          venues.find((v) => v.slug !== venue.slug)?.slug ||
                            "",
                        );
                      }}
                    />
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ReassignModal
        isOpen={!!showDeleteModal}
        title="Delete Venue"
        entityLabel="venue"
        entitySlug={showDeleteModal}
        options={venues.filter((v) => v.slug !== showDeleteModal)}
        reassignTo={reassignTo}
        onReassignToChange={setReassignTo}
        onClose={() => setShowDeleteModal(null)}
        onConfirm={handleDelete}
      />
    </SettingsTableShell>
  );
}

function AdvancedSettings() {
  return (
    <div className="rounded-2xl border border-border-main bg-surface p-6 shadow-sm">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-4">
          <div className="h-11 w-11 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center border border-red-500/20">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-sans font-black uppercase text-text-main">
              System Cleanup
            </h2>
            <p className="mt-1 max-w-xl text-sm text-text-muted">
              Archive resolved items and run maintenance tools from the advanced
              admin area.
            </p>
          </div>
        </div>
        <Link
          href="/admin/cleanup"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-sans font-bold uppercase tracking-widest text-white shadow-lg shadow-brand/20 hover:bg-brand-dim transition-all"
        >
          <ShieldAlert className="h-4 w-4" />
          Open Cleanup
        </Link>
      </div>
    </div>
  );
}

function SettingsTableShell({
  title,
  description,
  icon,
  buttonLabel,
  onAdd,
  children,
}: {
  title: string;
  description: string;
  icon: ReactNode;
  buttonLabel: string;
  onAdd: () => void;
  children: ReactNode;
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-start gap-4">
          <div className="h-11 w-11 rounded-xl bg-brand/10 text-brand flex items-center justify-center border border-brand/20">
            {icon}
          </div>
          <div>
            <h2 className="text-lg font-sans font-black uppercase tracking-tight text-text-main">
              {title}
            </h2>
            <p className="text-sm text-text-muted mt-1">{description}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-sans font-bold uppercase tracking-widest text-white shadow-lg shadow-brand/20 hover:bg-brand-dim transition-all"
        >
          <Plus className="h-4 w-4" />
          {buttonLabel}
        </button>
      </div>
      {children}
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false,
  className,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-sans font-bold uppercase tracking-widest text-text-dim px-1">
        {label}
      </label>
      <input
        required={required}
        disabled={disabled}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "w-full bg-bg border border-border-hover rounded-xl px-4 py-3 text-sm focus:border-brand focus:outline-none transition-colors disabled:opacity-50",
          className,
        )}
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  disabled = false,
  hint,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  disabled?: boolean;
  hint?: string;
}) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-sans font-bold uppercase tracking-widest text-text-dim px-1">
        {label}
      </label>
      <select
        disabled={disabled}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-bg border border-border-hover rounded-xl px-4 py-3 text-sm focus:border-brand focus:outline-none transition-colors disabled:opacity-50"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {hint && (
        <p className="text-[10px] text-text-dim px-1">{hint}</p>
      )}
    </div>
  );
}

function FormActions({
  submitLabel,
  onCancel,
}: {
  submitLabel: string;
  onCancel: () => void;
}) {
  return (
    <div className="md:col-span-full flex items-center justify-end gap-3 pt-4">
      <button
        type="button"
        onClick={onCancel}
        className="px-6 py-2.5 text-sm font-sans font-bold uppercase tracking-widest text-text-dim hover:text-text-main transition-colors"
      >
        Cancel
      </button>
      <button
        type="submit"
        className="inline-flex items-center gap-2 rounded-xl bg-brand px-8 py-2.5 text-sm font-sans font-bold uppercase tracking-widest text-white hover:bg-brand-dim transition-all"
      >
        <Save className="h-4 w-4" />
        {submitLabel}
      </button>
    </div>
  );
}

function HeaderCell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <th
      className={cn(
        "px-6 py-4 text-left text-[10px] font-sans font-black uppercase tracking-widest text-text-dim",
        className,
      )}
    >
      {children}
    </th>
  );
}

function SlugCell({ slug }: { slug: string }) {
  return (
    <td className="px-6 py-4">
      <code className="text-[10px] font-mono bg-bg border border-border-main rounded px-1.5 py-0.5 text-text-muted">
        {slug}
      </code>
    </td>
  );
}

function ActionCell({
  onEdit,
  onDelete,
}: {
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <td className="px-6 py-4 text-right">
      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          type="button"
          onClick={onEdit}
          className="p-2 text-text-dim hover:text-brand bg-surface-active rounded-lg transition-colors"
          title="Edit"
        >
          <Edit2 className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="p-2 text-text-dim hover:text-red-500 bg-surface-active rounded-lg transition-colors"
          title="Delete"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </td>
  );
}

function LoadingRow({ colSpan, label }: { colSpan: number; label: string }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-6 py-12 text-center">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="h-6 w-6 text-brand animate-spin" />
          <span className="text-xs font-sans font-bold uppercase tracking-widest text-text-dim">
            {label}
          </span>
        </div>
      </td>
    </tr>
  );
}

function EmptyRow({ colSpan, label }: { colSpan: number; label: string }) {
  return (
    <tr>
      <td
        colSpan={colSpan}
        className="px-6 py-12 text-center text-text-dim italic"
      >
        {label}
      </td>
    </tr>
  );
}

function ReassignModal({
  isOpen,
  title,
  entityLabel,
  entitySlug,
  options,
  reassignTo,
  onReassignToChange,
  onClose,
  onConfirm,
}: {
  isOpen: boolean;
  title: string;
  entityLabel: string;
  entitySlug: string | null;
  options: Array<{ slug: string; name: string }>;
  reassignTo: string;
  onReassignToChange: (value: string) => void;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <ConfirmModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title={title}
      confirmText="Delete & Reassign"
      loading={false}
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-4 bg-red-500/5 border border-red-500/20 rounded-xl text-red-500">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-bold">Important Notice</p>
            <p className="mt-1 opacity-80">
              You are about to delete the{" "}
              <span className="font-bold">&quot;{entitySlug}&quot;</span>{" "}
              {entityLabel}. Existing items assigned here must be reassigned.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-sans font-bold uppercase tracking-widest text-text-dim">
            Reassign Items To:
          </label>
          <select
            value={reassignTo}
            onChange={(e) => onReassignToChange(e.target.value)}
            className="w-full bg-bg border border-border-hover rounded-xl px-4 py-3 text-sm focus:border-brand focus:outline-none transition-colors"
          >
            <option value="" disabled>
              Select a {entityLabel}...
            </option>
            {options.map((option) => (
              <option key={option.slug} value={option.slug}>
                {option.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </ConfirmModal>
  );
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\w ]+/g, "")
    .replace(/ +/g, "_");
}
