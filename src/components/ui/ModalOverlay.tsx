'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef } from 'react'

export function ModalOverlay({ children }: { children: React.ReactNode }) {
  const overlay = useRef<HTMLDivElement>(null)
  const wrapper = useRef<HTMLDivElement>(null)
  const router = useRouter()

  const onDismiss = useCallback(() => {
    router.back()
  }, [router])

  const onClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === overlay.current || e.target === wrapper.current) {
        if (onDismiss) onDismiss()
      }
    },
    [onDismiss]
  )

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onDismiss()
    },
    [onDismiss]
  )

  useEffect(() => {
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onKeyDown])

  return (
    <div
      ref={overlay}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md transition-opacity"
      onClick={onClick}
    >
      <div
        ref={wrapper}
        className="fixed inset-0 top-0 left-0 right-0 bottom-0 flex items-center justify-center p-4 sm:p-6"
      >
        <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto no-scrollbar relative animate-in fade-in zoom-in-95 duration-200 bg-surface rounded-2xl shadow-2xl ring-1 ring-white/10">
          <button 
             onClick={onDismiss}
             className="absolute top-4 right-4 z-50 p-2 rounded-full bg-surface-active/50 hover:bg-surface-active text-text-dim hover:text-text-main transition-colors backdrop-blur-sm"
          >
             <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
          {children}
        </div>
      </div>
    </div>
  )
}
