import { Button } from "@/components/ui/button";
import type { PlansPaginationProps } from "./plans.types";

function getPageBounds(page: number, pageSize: number, total: number) {
  if (total === 0) {
    return { from: 0, to: 0 };
  }

  const safePage = Math.max(1, page);
  const from = (safePage - 1) * pageSize + 1;
  const to = Math.min(total, safePage * pageSize);

  return { from, to };
}

export function PlansPagination({ page, pageSize, total, onPageChange }: PlansPaginationProps) {
  if (total <= pageSize) {
    return null;
  }

  const maxPage = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), maxPage);
  const { from, to } = getPageBounds(safePage, pageSize, total);

  const canGoPrev = safePage > 1;
  const canGoNext = safePage < maxPage;

  const handlePrev = () => {
    if (canGoPrev) {
      onPageChange(safePage - 1);
    }
  };

  const handleNext = () => {
    if (canGoNext) {
      onPageChange(safePage + 1);
    }
  };

  return (
    <nav
      aria-label="Study plans pagination"
      className="mt-6 flex items-center justify-between gap-4 border-t pt-4 text-xs text-muted-foreground sm:text-sm"
    >
      <span>
        Showing{" "}
        <span className="font-medium text-foreground">
          {from}–{to}
        </span>{" "}
        of <span className="font-medium text-foreground">{total}</span> plans
      </span>
      <div className="flex items-center gap-2">
        <Button type="button" variant="outline" size="sm" onClick={handlePrev} disabled={!canGoPrev}>
          Previous
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={handleNext} disabled={!canGoNext}>
          Next
        </Button>
      </div>
    </nav>
  );
}



