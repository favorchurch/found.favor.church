"use client";

import { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, Tag, Save, AlertCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { getCategories, upsertCategory, deleteCategory } from "@/app/admin/actions/categories";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

interface Category {
  slug: string;
  name: string;
  prefix: string;
  created_at: string;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);
  const [reassignTo, setReassignTo] = useState("");

  const [formData, setFormData] = useState({
    slug: "",
    name: "",
    prefix: "",
  });

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const data = await getCategories();
      setCategories(data as Category[]);
    } catch {
      toast.error("Failed to fetch categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCategories();
  }, []);

  const handleUpsert = async (e: React.FormEvent) => {
    e.preventDefault();
    const promise = async () => {
      await upsertCategory(formData);
      setIsAdding(false);
      setEditingSlug(null);
      setFormData({ slug: "", name: "", prefix: "" });
      await fetchCategories();
    };

    toast.promise(promise(), {
      loading: "Saving category...",
      success: "Category saved!",
      error: (err) => err.message || "Failed to save category",
    });
  };

  const handleDelete = async () => {
    if (!showDeleteModal || !reassignTo) return;

    const promise = async () => {
      await deleteCategory(showDeleteModal, reassignTo);
      setShowDeleteModal(null);
      setReassignTo("");
      await fetchCategories();
    };

    toast.promise(promise(), {
      loading: "Deleting category and reassigning items...",
      success: "Category deleted and items reassigned!",
      error: (err) => err.message || "Failed to delete category",
    });
  };

  const startEdit = (cat: Category) => {
    setEditingSlug(cat.slug);
    setFormData({
      slug: cat.slug,
      name: cat.name,
      prefix: cat.prefix,
    });
  };

  const slugify = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^\w ]+/g, "")
      .replace(/ +/g, "_");
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-sans font-black uppercase tracking-tight text-text-main">
            Item Categories
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Manage categories and their item code prefixes.
          </p>
        </div>
        <button
          onClick={() => {
            setIsAdding(true);
            setEditingSlug(null);
            setFormData({ slug: "", name: "", prefix: "" });
          }}
          className="inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-sans font-bold uppercase tracking-widest text-white shadow-lg shadow-brand/20 hover:bg-brand-dim transition-all"
        >
          <Plus className="h-4 w-4" />
          New Category
        </button>
      </div>

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

          <form onSubmit={handleUpsert} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-sans font-bold uppercase tracking-widest text-text-dim px-1">
                Display Name
              </label>
              <input
                required
                value={formData.name}
                onChange={(e) => {
                  const name = e.target.value;
                  setFormData((prev) => ({
                    ...prev,
                    name,
                    slug: editingSlug ? prev.slug : slugify(name),
                  }));
                }}
                placeholder="e.g. Mobile Phones"
                className="w-full bg-bg border border-border-hover rounded-xl px-4 py-3 text-sm focus:border-brand focus:outline-none transition-colors"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-sans font-bold uppercase tracking-widest text-text-dim px-1">
                Slug (Internal ID)
              </label>
              <input
                required
                disabled={!!editingSlug}
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="mobile_phones"
                className="w-full bg-bg border border-border-hover rounded-xl px-4 py-3 text-sm focus:border-brand focus:outline-none transition-colors disabled:opacity-50"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-sans font-bold uppercase tracking-widest text-text-dim px-1">
                Code Prefix (2-4 Letters)
              </label>
              <input
                required
                value={formData.prefix}
                onChange={(e) => setFormData({ ...formData, prefix: e.target.value.toUpperCase().slice(0, 4) })}
                placeholder="PHN"
                className="w-full bg-bg border border-border-hover rounded-xl px-4 py-3 text-sm font-bold tracking-widest focus:border-brand focus:outline-none transition-colors"
              />
            </div>

            <div className="md:col-span-3 flex items-center justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setIsAdding(false);
                  setEditingSlug(null);
                }}
                className="px-6 py-2.5 text-sm font-sans font-bold uppercase tracking-widest text-text-dim hover:text-text-main transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-xl bg-brand px-8 py-2.5 text-sm font-sans font-bold uppercase tracking-widest text-white hover:bg-brand-dim transition-all"
              >
                <Save className="h-4 w-4" />
                {editingSlug ? "Update Category" : "Create Category"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-surface border border-border-main rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-border-main bg-surface-active/50">
                <th className="px-6 py-4 text-left text-[10px] font-sans font-black uppercase tracking-widest text-text-dim">
                  Category Name
                </th>
                <th className="px-6 py-4 text-left text-[10px] font-sans font-black uppercase tracking-widest text-text-dim">
                  Slug
                </th>
                <th className="px-6 py-4 text-left text-[10px] font-sans font-black uppercase tracking-widest text-text-dim">
                  Prefix
                </th>
                <th className="px-6 py-4 text-right text-[10px] font-sans font-black uppercase tracking-widest text-text-dim">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-main">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <RefreshCw className="h-6 w-6 text-brand animate-spin" />
                      <span className="text-xs font-sans font-bold uppercase tracking-widest text-text-dim">
                        Loading categories...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : categories.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-text-dim italic">
                    No categories found.
                  </td>
                </tr>
              ) : (
                categories.map((cat) => (
                  <tr key={cat.slug} className="hover:bg-surface-active/30 transition-colors group">
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
                    <td className="px-6 py-4">
                      <code className="text-[10px] font-mono bg-bg border border-border-main rounded px-1.5 py-0.5 text-text-muted">
                        {cat.slug}
                      </code>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-sans font-bold tracking-widest text-brand">
                        {cat.prefix}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => startEdit(cat)}
                          className="p-2 text-text-dim hover:text-brand bg-surface-active rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            setShowDeleteModal(cat.slug);
                            setReassignTo(categories.find(c => c.slug !== cat.slug)?.slug || "");
                          }}
                          className="p-2 text-text-dim hover:text-red-500 bg-surface-active rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmModal
        isOpen={!!showDeleteModal}
        onClose={() => setShowDeleteModal(null)}
        onConfirm={handleDelete}
        title="Delete Category"
        confirmText="Delete & Reassign"
        loading={false}
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-red-500/5 border border-red-500/20 rounded-xl text-red-500">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-bold">Important Security Notice</p>
              <p className="mt-1 opacity-80">
              You are about to delete the <span className="font-bold">&quot;{showDeleteModal}&quot;</span> category. Existing items in this category must be reassigned to another category.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-sans font-bold uppercase tracking-widest text-text-dim">
              Reassign Items To:
            </label>
            <select
              value={reassignTo}
              onChange={(e) => setReassignTo(e.target.value)}
              className="w-full bg-bg border border-border-hover rounded-xl px-4 py-3 text-sm focus:border-brand focus:outline-none transition-colors"
            >
              <option value="" disabled>Select a category...</option>
              {categories
                .filter((c) => c.slug !== showDeleteModal)
                .map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.name}
                  </option>
                ))}
            </select>
          </div>
        </div>
      </ConfirmModal>
    </div>
  );
}
