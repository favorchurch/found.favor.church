'use client'

import { AlertTriangle, X } from 'lucide-react'

interface DeleteConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  itemName: string
  loading?: boolean
}

export function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  itemName,
  loading = false,
}: DeleteConfirmModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-md animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      {/* Modal content */}
      <div className="relative w-full max-w-md bg-surface border border-red-500/20 rounded-2xl shadow-2xl shadow-red-500/10 overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="h-10 w-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 shadow-inner">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <button 
              onClick={onClose}
              className="p-1 rounded-lg text-text-dim hover:text-text-main transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-bold text-text-main uppercase font-mono tracking-wider">{title}</h3>
              <p className="mt-2 text-xs text-text-muted leading-relaxed">
                You are about to permanently delete <span className="text-text-main font-bold">&quot;{itemName}&quot;</span>. 
                This action will also remove the associated image from storage and cannot be undone.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:flex-1 px-4 py-2.5 rounded-xl text-[10px] font-mono font-bold uppercase tracking-widest text-text-dim hover:text-text-main hover:bg-surface-active transition-all border border-border-main"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={onConfirm}
                className="w-full sm:flex-1 px-4 py-2.5 rounded-xl text-[10px] font-mono font-bold uppercase tracking-widest bg-red-600 text-white hover:bg-red-500 active:bg-red-700 transition-all shadow-lg shadow-red-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading && <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />}
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
