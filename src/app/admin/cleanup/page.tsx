'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Trash2, ShieldAlert, Archive, RefreshCw, AlertTriangle, CheckCircle2, Search } from 'lucide-react'
import { toast } from 'sonner'
import { archiveOldItems } from '@/app/admin/actions/items'
import { ConfirmModal } from '@/components/ui/ConfirmModal'

export default function CleanupPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(false)
  const [archiving, setArchiving] = useState(false)
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false)
  const [orphans, setOrphans] = useState<string[]>([])
  const [stats, setStats] = useState({ totalFiles: 0, linkedFiles: 0 })

  const checkOrphans = async () => {
    setChecking(true)
    try {
      // 1. List all files in storage
      const { data: files, error: storageError } = await supabase.storage
        .from('item-images')
        .list('', { limit: 1000 })
      
      if (storageError) throw storageError

      // 2. Get all photo_paths from DB
      const { data: items, error: dbError } = await supabase
        .from('found_items')
        .select('photo_path')
      
      if (dbError) throw dbError

      const linkedPaths = new Set(items.map(i => i.photo_path).filter(Boolean))
      const foundOrphans = (files || [])
        .filter(f => f.name !== '.emptyFolderPlaceholder')
        .filter(f => !linkedPaths.has(f.name))
        .map(f => f.name)

      setOrphans(foundOrphans)
      setStats({
        totalFiles: files?.length || 0,
        linkedFiles: linkedPaths.size
      })
      
      if (foundOrphans.length === 0) {
        toast.success("No orphaned images found! Storage is clean.")
      }
    } catch (error) {
      console.error("Cleanup check failed:", error)
      toast.error("Failed to scan storage")
    } finally {
      setChecking(false)
    }
  }

  const runCleanup = async () => {
    if (orphans.length === 0) return
    setLoading(true)
    try {
      const { error } = await supabase.storage
        .from('item-images')
        .remove(orphans)
      
      if (error) throw error
      
      toast.success(`Successfully deleted ${orphans.length} orphaned images`)
      setOrphans([])
    } catch (error) {
      console.error("Cleanup execution failed:", error)
      toast.error("Failed to delete orphaned images")
    } finally {
      setLoading(false)
    }
  }

  const handleArchive = async () => {
    setArchiving(true)
    setShowArchiveConfirm(false)
    try {
      await archiveOldItems()
      toast.success("Archival sequence complete")
    } catch (error: any) {
      toast.error(`Archival failed: ${error.message}`)
    } finally {
      setArchiving(false)
    }
  }

  return (
    <div className="p-8 space-y-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-brand uppercase font-mono">System Cleanup</h1>
        <p className="text-[10px] text-text-dim uppercase tracking-widest mt-1">Maintenance tools for performance and data integrity</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Storage Cleanup Section */}
        <div className="bg-surface border border-border-main rounded-2xl overflow-hidden flex flex-col">
          <div className="p-6 border-b border-border-main bg-surface-active/30 flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
              <Search className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-text-main uppercase font-mono tracking-widest">Image Storage</h3>
              <p className="text-[9px] text-text-dim uppercase font-mono">Cleanup unlinked item photos</p>
            </div>
          </div>
          
          <div className="p-8 flex-1 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-bg border border-border-hover/50">
                <p className="text-[9px] font-mono text-text-dim uppercase tracking-tighter">Files in Bucket</p>
                <p className="text-xl font-bold text-text-main mt-1 font-mono">{stats.totalFiles}</p>
              </div>
              <div className="p-4 rounded-xl bg-bg border border-border-hover/50">
                <p className="text-[9px] font-mono text-text-dim uppercase tracking-tighter">Database Links</p>
                <p className="text-xl font-bold text-text-main mt-1 font-mono">{stats.linkedFiles}</p>
              </div>
            </div>

            {orphans.length > 0 ? (
              <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/10 flex items-start gap-4">
                <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-red-500 uppercase font-mono">Found {orphans.length} Orphans</p>
                  <p className="text-[10px] text-red-500/70 mt-1 leading-relaxed">
                    These files exist in storage but are not attached to any entry. They are safe to delete.
                  </p>
                </div>
              </div>
            ) : stats.totalFiles > 0 && !checking && (
              <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10 flex items-start gap-4">
                <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-emerald-500 uppercase font-mono">Storage Optimized</p>
                  <p className="text-[10px] text-emerald-500/70 mt-1 leading-relaxed">
                    All currently stored images are correctly linked to database records.
                  </p>
                </div>
              </div>
            )}

            <div className="pt-4 flex flex-col gap-3">
              <button
                disabled={checking}
                onClick={checkOrphans}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-surface-active border border-border-hover text-[10px] font-mono font-bold uppercase tracking-widest text-text-muted hover:text-text-main hover:bg-surface-hover transition-all"
              >
                <RefreshCw className={`h-4 w-4 ${checking ? 'animate-spin' : ''}`} />
                {checking ? 'Scanning Storage...' : 'Scan for Orphans'}
              </button>
              
              {orphans.length > 0 && (
                <button
                  disabled={loading}
                  onClick={runCleanup}
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-red-500 text-white text-[10px] font-mono font-bold uppercase tracking-widest hover:bg-red-600 transition-all shadow-lg shadow-red-500/20"
                >
                  <Trash2 className="h-4 w-4" />
                  {loading ? 'Cleaning Up...' : `Delete ${orphans.length} Orphans`}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Data Archival Section */}
        <div className="bg-surface border border-border-main rounded-2xl overflow-hidden flex flex-col">
          <div className="p-6 border-b border-border-main bg-surface-active/30 flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-brand/10 flex items-center justify-center text-brand">
              <Archive className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-text-main uppercase font-mono tracking-widest">Data Maintenance</h3>
              <p className="text-[9px] text-text-dim uppercase font-mono">Archive old records</p>
            </div>
          </div>

          <div className="p-8 flex-1 space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <p className="text-xs text-text-muted leading-relaxed">
                Move resolved items (Claimed or Disposed) older than 30 days to the archive to keep the active dashboard clean.
              </p>
              <div className="flex items-center gap-3 font-mono text-[10px] text-text-dim uppercase tracking-tighter bg-bg/50 px-4 py-3 rounded-lg border border-border-hover/50">
                <ShieldAlert className="h-4 w-4 text-brand" />
                Recommended frequency: Monthly
              </div>
            </div>

            <button 
              type="button"
              disabled={archiving}
              onClick={() => setShowArchiveConfirm(true)}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-brand text-black text-[10px] font-mono font-bold uppercase tracking-widest hover:bg-brand-dim transition-all shadow-lg shadow-brand/10 disabled:opacity-50"
            >
              <Archive className="h-4 w-4" />
              {archiving ? 'Processing...' : 'Run Archival Sequence'}
            </button>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={showArchiveConfirm}
        onClose={() => setShowArchiveConfirm(false)}
        onConfirm={handleArchive}
        title="Confirm Archival"
        description="This will move all claimed and disposed items found more than 30 days ago to the archive. These items will no longer appear on the main dashboard."
        confirmText="Archive Now"
        variant="warning"
        loading={archiving}
      />
    </div>
  )
}
