import { ChevronLeft, ChevronRight } from "lucide-react"

import { Button } from "@/client/ui/Button"

export interface CollectionPaginationProps {
  page: number
  totalPages: number
  onPrevious: () => void
  onNext: () => void
}

const CollectionPagination = ({ page, totalPages, onPrevious, onNext }: CollectionPaginationProps) => (
  <div className="flex items-center justify-center gap-3">
    <Button variant="ghost" size="sm" onClick={onPrevious} disabled={page <= 1} aria-label="Previous page">
      <ChevronLeft className="h-4 w-4" aria-hidden="true" />
    </Button>
    <span className="text-sm font-extrabold text-ink-soft">
      Page {page} of {totalPages}
    </span>
    <Button variant="ghost" size="sm" onClick={onNext} disabled={page >= totalPages} aria-label="Next page">
      <ChevronRight className="h-4 w-4" aria-hidden="true" />
    </Button>
  </div>
)

export default CollectionPagination
