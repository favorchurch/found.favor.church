"use client";

import { AlertTriangle, X } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  children?: ReactNode;
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
  children,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger",
  loading = false,
}: ConfirmModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div 
        ref={overlayRef}
        className="absolute inset-0 bg-black/80 backdrop-blur-md animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-md bg-surface border border-border-main rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className={`p-3 rounded-xl shrink-0 ${
              variant === "danger" ? "bg-red-500/10 text-red-500" : 
              variant === "warning" ? "bg-yellow-500/10 text-yellow-500" : 
              "bg-brand/10 text-brand"
            }`}>
              <AlertTriangle className="h-6 w-6" />
            </div>
            <button 
              onClick={onClose}
              className="p-1 rounded-lg text-text-dim hover:text-text-main transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-1">
            <h3 className="text-lg font-bold text-text-main font-sans uppercase tracking-widest">
              {title}
            </h3>
            {description && (
              <p className="text-xs text-text-dim font-sans uppercase leading-relaxed tracking-tighter">
                {description}
              </p>
            )}
          </div>
          {children && <div className="mt-5">{children}</div>}
        </div>

        <div className="bg-surface-active/30 p-4 flex sm:justify-end gap-2 border-t border-border-main/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-sans font-bold uppercase tracking-widest text-text-dim hover:text-text-main hover:bg-surface-active transition-all"
          >
            {cancelText}
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className={`px-6 py-2 rounded-lg text-xs font-sans font-bold uppercase tracking-widest transition-all shadow-lg ${
              variant === "danger" ? "bg-red-500 text-white hover:bg-red-600 shadow-red-500/20" : 
              variant === "warning" ? "bg-yellow-500 text-black hover:bg-yellow-600 shadow-yellow-500/20" : 
              "bg-brand text-black hover:bg-brand-dim shadow-brand/20"
            } disabled:opacity-50 flex items-center justify-center gap-2`}
          >
            {loading && <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
