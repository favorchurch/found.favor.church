# Remove Item Photo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow users to remove a photo from an item in the `ItemForm` component, including orphaned cleanup in Supabase storage.

**Architecture:** Add a removal state to `ItemForm`. Display a "trash" button on hover over the image preview. When clicked, mark for removal. On submit, perform the storage cleanup if the photo was removed.

**Tech Stack:** React, Supabase JS, Lucide React

---

### Task 1: Update ItemForm State and UI

**Files:**
- Modify: `src/components/ui/ItemForm.tsx`

- [ ] **Step 1: Add state for pending removal**

In `ItemForm.tsx`, add:
```tsx
const [removedPhoto, setRemovedPhoto] = useState(false);
```

- [ ] **Step 2: Add removal button UI**

Inside the `imagePreview` conditional in the right column, update the overlay:
```tsx
{imagePreview && (
  <>
    <img
      src={imagePreview}
      alt="Preview"
      className="h-full w-full object-cover"
    />
    {/* Keep existing overlay for change */}
    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
      <button
        type="button"
        className="p-2 bg-white/20 hover:bg-red-500 rounded-full transition-colors"
        onClick={(e) => {
          e.stopPropagation();
          setRemovedPhoto(true);
          setImagePreview(null);
          setImageFile(null);
        }}
      >
        <Trash2 className="h-6 w-6 text-white" />
      </button>
      <div className="flex items-center gap-2">
        <Camera className="h-6 w-6 text-white" />
        <span className="text-white font-mono text-xs font-bold uppercase tracking-widest">
          Change
        </span>
      </div>
    </div>
  </>
)}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/ItemForm.tsx
git commit -m "feat: add photo removal button to ItemForm"
```

### Task 2: Implement Storage Cleanup in handleSubmit

**Files:**
- Modify: `src/components/ui/ItemForm.tsx`

- [ ] **Step 1: Update handleSubmit logic**

Update the storage cleanup logic:
```tsx
// Handle Image Upload / Removal
let photo_path = initialData?.photo_path || null;

if (removedPhoto && initialData?.photo_path) {
  await supabase.storage
    .from("item-images")
    .remove([initialData.photo_path]);
  photo_path = null;
} else if (imageFile) {
  // ... existing upload logic ...
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ui/ItemForm.tsx
git commit -m "feat: implement storage cleanup on photo removal"
```
