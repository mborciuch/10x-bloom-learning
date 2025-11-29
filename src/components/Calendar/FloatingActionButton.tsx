import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import type { FloatingActionButtonProps } from "./calendar.types";

/**
 * Floating Action Button (FAB) for mobile
 *
 * Fixed position in bottom-right corner (mobile only)
 * Opens AddSessionModal when clicked
 * Material Design inspired circular button with shadow
 *
 * @example
 * <FloatingActionButton
 *   onAddSession={() => setIsAddModalOpen(true)}
 * />
 */
export function FloatingActionButton({ onAddSession }: FloatingActionButtonProps) {
  return (
    <Button
      size="lg"
      className="floating-action-button fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg md:hidden z-50"
      onClick={onAddSession}
      aria-label="Add new session"
    >
      <Plus className="h-6 w-6" />
    </Button>
  );
}
