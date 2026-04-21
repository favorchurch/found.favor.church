"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ModalOverlay";
import { AlertTriangle } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
  loading?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger",
  loading = false,
}: ConfirmModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px] bg-surface border-border-main p-0 overflow-hidden rounded-2xl">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-xl shrink-0 ${
              variant === "danger" ? "bg-red-500/10 text-red-500" : 
              variant === "warning" ? "bg-yellow-500/10 text-yellow-500" : 
              "bg-brand/10 text-brand"
            }`}>
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <DialogTitle className="text-lg font-bold text-text-main font-mono uppercase tracking-widest">
                {title}
              </DialogTitle>
              <DialogDescription className="text-xs text-text-dim font-mono uppercase leading-relaxed tracking-tighter">
                {description}
              </DialogDescription>
            </div>
          </div>
        </div>

        <DialogFooter className="bg-surface-active/30 p-4 flex sm:justify-end gap-2 border-t border-border-main/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-mono font-bold uppercase tracking-widest text-text-dim hover:text-text-main hover:bg-surface-active transition-all"
          >
            {cancelText}
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className={`px-6 py-2 rounded-lg text-xs font-mono font-bold uppercase tracking-widest transition-all shadow-lg ${
              variant === "danger" ? "bg-red-500 text-white hover:bg-red-600 shadow-red-500/20" : 
              variant === "warning" ? "bg-yellow-500 text-black hover:bg-yellow-600 shadow-yellow-500/20" : 
              "bg-brand text-black hover:bg-brand-dim shadow-brand/20"
            } disabled:opacity-50`}
          >
            {loading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              confirmText
            )}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
