import { useEffect, useRef, type KeyboardEvent, type ReactNode } from "react"

import { cn } from "@/client/lib/cn"

export interface DialogProps {
  open: boolean
  onClose: () => void
  id?: string
  className?: string
  children: ReactNode
}

export const Dialog = ({ open, onClose, id, className, children }: DialogProps) => {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    if (open) {
      dialogRef.current?.showModal()
    } else {
      dialogRef.current?.close()
    }
  }, [open])

  // Lock page scroll while open: mobile browsers otherwise let the page behind
  // a modal <dialog> scroll.
  useEffect(() => {
    if (!open) return
    const root = document.documentElement
    const previousOverflow = root.style.overflow
    root.style.overflow = 'hidden'
    return () => {
      root.style.overflow = previousOverflow
    }
  }, [open])

  if (!open) return null

  const handleKeyDown = (e: KeyboardEvent<HTMLDialogElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/60 sm:items-center">
      <dialog
        ref={dialogRef}
        id={id}
        onKeyDown={handleKeyDown}
        onCancel={(e) => {
          e.preventDefault()
          onClose()
        }}
        className={cn(
          // Anchored with `fixed` (to the viewport, not the document): showModal()
          // moves the dialog into the top layer, outside the wrapper div, so a
          // non-fixed position would scroll with the page.
          "fixed inset-x-0 top-auto bottom-0 mx-auto my-0 max-h-[86dvh] w-full max-w-md overflow-y-auto overscroll-contain rounded-t-2xl border-4 border-b-0 border-ink bg-card p-6 shadow-none sm:inset-0 sm:m-auto sm:rounded-2xl sm:border-b-4",
          className,
        )}
      >
        {children}
      </dialog>
    </div>
  )
}

Dialog.displayName = "Dialog"
