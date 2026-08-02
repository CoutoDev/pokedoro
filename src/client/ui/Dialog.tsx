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
          "relative m-0 top-auto max-h-[86vh] w-full max-w-md overflow-y-auto rounded-t-2xl border-4 border-b-0 border-ink bg-card p-6 shadow-none sm:rounded-2xl sm:border-b-4 sm:m-auto sm:top-0",
          className,
        )}
      >
        {children}
      </dialog>
    </div>
  )
}

Dialog.displayName = "Dialog"
