'use client'

import { useState } from 'react'
import { Camera, Save, Globe, Lock } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { type ItemStatus } from '@/components/ui/StatusBadge'
import { createClient } from '@/utils/supabase/client'
import { type Item } from '@/components/ui/ItemCard'

interface ItemFormProps {
  initialData?: Item
}

export function ItemForm({ initialData }: ItemFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(
    initialData?.photo_path 
      ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/item-images/${initialData.photo_path}` 
      : null
  )

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const date_found = formData.get('date_found') as string
    const location = formData.get('location') as string
    const status = formData.get('status') as ItemStatus
    const is_public = formData.get('is_public') === 'on'

    try {
      let photo_path = initialData?.photo_path || null

      // Handle Image Upload
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop()
        const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('item-images')
          .upload(fileName, imageFile)

        if (uploadError) throw uploadError
        photo_path = uploadData.path
      }

      const itemData = {
        name,
        description,
        date_found,
        location,
        status,
        is_public,
        photo_path,
        updated_at: new Date().toISOString(),
      }

      if (initialData?.id) {
        const { error } = await supabase
          .from('found_items')
          .update(itemData)
          .eq('id', initialData.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('found_items')
          .insert([{ ...itemData }])
        if (error) throw error
      }

      router.push('/admin/dashboard')
      router.refresh()
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      alert(`Error saving item: ${message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => setImagePreview(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-8 bg-surface p-8 rounded-2xl border border-border-main shadown-2xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Column: Inputs */}
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="font-mono text-[10px] uppercase tracking-widest text-text-dim">Item Name *</label>
            <input
              required
              name="name"
              defaultValue={initialData?.name ?? ''}
              placeholder="e.g. Black Umbrella"
              className="w-full bg-bg border border-border-hover rounded-lg px-4 py-2.5 text-sm text-text-main focus:border-brand focus:outline-none transition-colors"
            />
          </div>

          <div className="space-y-2">
            <label className="font-mono text-[10px] uppercase tracking-widest text-text-dim">Description</label>
            <textarea
              name="description"
              defaultValue={initialData?.description ?? ''}
              placeholder="Features, color, brand..."
              rows={3}
              className="w-full bg-bg border border-border-hover rounded-lg px-4 py-2.5 text-sm text-text-main focus:border-brand focus:outline-none transition-colors resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="font-mono text-[10px] uppercase tracking-widest text-text-dim">Date Found *</label>
              <input
                required
                type="date"
                name="date_found"
                defaultValue={initialData?.date_found ?? new Date().toISOString().split('T')[0]}
                className="w-full bg-bg border border-border-hover rounded-lg px-4 py-2.5 text-sm text-text-main focus:border-brand focus:outline-none transition-colors"
              />
            </div>
            <div className="space-y-2">
              <label className="font-mono text-[10px] uppercase tracking-widest text-text-dim">Status</label>
              <select
                name="status"
                defaultValue={initialData?.status || 'unclaimed'}
                className="w-full bg-bg border border-border-hover rounded-lg px-4 py-2.5 text-sm text-text-main focus:border-brand focus:outline-none transition-colors"
              >
                <option value="unclaimed">Unclaimed</option>
                <option value="claimed">Claimed</option>
                <option value="disposed">Disposed</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="font-mono text-[10px] uppercase tracking-widest text-text-dim">Location Found</label>
            <input
              name="location"
              defaultValue={initialData?.location ?? ''}
              placeholder="e.g. Main Sanctuary, 2nd Floor"
              className="w-full bg-bg border border-border-hover rounded-lg px-4 py-2.5 text-sm text-text-main focus:border-brand focus:outline-none transition-colors"
            />
          </div>

          {/* Security Toggle */}
          <div className="pt-4 border-t border-border-main">
             <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative">
                  <input 
                    type="checkbox" 
                    name="is_public" 
                    defaultChecked={initialData?.is_public || false} 
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-border-main rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand"></div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-text-main">Publicly listed</span>
                  {initialData?.is_public ? (
                    <Globe className="h-3 w-3 text-brand" />
                  ) : (
                    <Lock className="h-3 w-3 text-text-dim" />
                  )}
                </div>
             </label>
             <p className="mt-1 text-[10px] text-text-dim uppercase tracking-tighter ml-13">
               If enabled, this item will appear in the public catalog.
             </p>
          </div>
        </div>

        {/* Right Column: Photo */}
        <div className="space-y-6">
          <label className="font-mono text-[10px] uppercase tracking-widest text-text-dim">Item Photo</label>
          <div 
            className="aspect-square w-full rounded-xl border-2 border-dashed border-border-hover bg-bg flex flex-col items-center justify-center relative overflow-hidden group cursor-pointer hover:border-brand/40 transition-colors"
            onClick={() => document.getElementById('photo-input')?.click()}
          >
            {imagePreview ? (
              <>
                <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Camera className="h-8 w-8 text-white" />
                  <span className="ml-2 text-white font-mono text-xs font-bold uppercase tracking-widest">Change Photo</span>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-3 text-text-dim group-hover:text-brand transition-colors">
                <Camera className="h-10 w-10 opacity-40" />
                <div className="text-center">
                  <p className="text-xs font-bold uppercase tracking-widest font-mono">Click to Upload</p>
                  <p className="text-[10px] mt-1 font-mono uppercase tracking-tighter opacity-60">JPG, PNG or WebP</p>
                </div>
              </div>
            )}
            <input 
              id="photo-input"
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={handleImageChange}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-4 pt-6 border-t border-border-main">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2 rounded-lg text-sm font-mono font-bold uppercase tracking-widest text-text-dim hover:text-text-main transition-colors"
        >
          Cancel
        </button>
        <button
          disabled={loading}
          type="submit"
          className="inline-flex items-center gap-2 rounded-lg bg-brand px-8 py-2.5 text-sm font-bold text-black hover:bg-brand-dim transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {initialData?.id ? 'Update Item' : 'Save Item'}
        </button>
      </div>
    </form>
  )
}
