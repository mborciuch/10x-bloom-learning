import { useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, MoreVertical } from "lucide-react";
import { SessionPopover } from "./SessionPopover";
import type { ReviewSessionDto } from "@/types";

interface SessionCardMiniProps {
  session: ReviewSessionDto;
  onSessionClick: (sessionId: string) => void;
  onQuickComplete: (sessionId: string) => Promise<void>;
  onSessionEdit: (sessionId: string) => void;
  onSessionDelete: (sessionId: string) => Promise<void>;
}

/**
 * Mini Session Card component
 *
 * Compact representation of a review session displayed in calendar
 * Shows: exercise label, status badge, taxonomy level badge
 *
 * Features:
 * - Color-coded status (pending/completed)
 * - Taxonomy level display
 * - Truncated text for long labels
 * - Click to navigate to session details
 * - Hover state for popover trigger
 *
 * @example
 * <SessionCardMini
 *   session={sessionDto}
 *   onSessionClick={(id) => navigate(`/app/review-sessions/${id}`)}
 *   onQuickComplete={completeSession}
 *   onSessionEdit={openEditModal}
 *   onSessionDelete={deleteSession}
 * />
 */
export function SessionCardMini({
  session,
  onSessionClick,
  onQuickComplete,
  onSessionEdit,
  onSessionDelete,
}: SessionCardMiniProps) {
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const isCompleted = session.isCompleted;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Don't navigate if clicking the actions button
    if ((e.target as HTMLElement).closest(".actions-button")) {
      return;
    }
    onSessionClick(session.id);
  };

  // Long press for mobile
  const handleTouchStart = () => {
    longPressTimer.current = setTimeout(() => {
      // Open popover on long press
    }, 500);
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
  };

  // Color mapping for taxonomy levels
  const getTaxonomyColor = (level: string): string => {
    const colorMap: Record<string, string> = {
      remember: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      understand: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      apply: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
      analyze: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      evaluate: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
      create: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200",
    };
    return colorMap[level.toLowerCase()] || "bg-gray-100 text-gray-800";
  };

  // Format taxonomy level for display
  const formatTaxonomyLevel = (level: string): string => {
    return level.charAt(0).toUpperCase() + level.slice(1).toLowerCase();
  };

  const cardContent = (
    <div
      className={`
        session-card-mini group relative
        p-2 rounded-lg border transition-all cursor-pointer
        ${isCompleted ? "bg-green-50/50 border-green-200 dark:bg-green-950/20 dark:border-green-800" : "bg-card border-border hover:border-primary/50"}
        ${isCompleted ? "opacity-80" : ""}
        hover:shadow-sm
      `}
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick(e as unknown as React.MouseEvent);
        }
      }}
    >
      {/* Exercise Label */}
      <div className="flex items-start gap-2 mb-1.5">
        <div className="flex-1 min-w-0">
          <p
            className={`text-xs font-medium truncate ${isCompleted ? "line-through text-muted-foreground" : ""}`}
            title={session.exerciseLabel}
          >
            {session.exerciseLabel}
          </p>
        </div>

        {/* Actions button (visible on hover or always on mobile) */}
        <button
          className="actions-button opacity-0 group-hover:opacity-100 md:group-hover:opacity-100 p-0.5 hover:bg-accent rounded transition-opacity flex-shrink-0"
          onClick={(e) => {
            e.stopPropagation();
          }}
          aria-label="Session actions"
        >
          <MoreVertical className="h-3.5 w-3.5 text-muted-foreground" />
        </button>

        {/* Status Icon */}
        {isCompleted ? (
          <CheckCircle2 className="h-3.5 w-3.5 text-green-600 dark:text-green-400 flex-shrink-0" />
        ) : (
          <Clock className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
        )}
      </div>

      {/* Badges Row */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {/* Status Badge */}
        <Badge
          variant={isCompleted ? "default" : "secondary"}
          className={`text-[10px] px-1.5 py-0 h-4 ${
            isCompleted
              ? "bg-green-600 hover:bg-green-600 dark:bg-green-700"
              : "bg-yellow-100 text-yellow-800 hover:bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-200"
          }`}
        >
          {isCompleted ? "Done" : "Pending"}
        </Badge>

        {/* Taxonomy Level Badge */}
        <Badge
          variant="outline"
          className={`text-[10px] px-1.5 py-0 h-4 border-0 ${getTaxonomyColor(session.taxonomyLevel)}`}
        >
          {formatTaxonomyLevel(session.taxonomyLevel)}
        </Badge>
      </div>

      {/* Notes indicator (if present) */}
      {session.notes && (
        <div className="mt-1 text-[10px] text-muted-foreground truncate" title={session.notes}>
          📝 {session.notes}
        </div>
      )}
    </div>
  );

  return (
    <SessionPopover
      session={session}
      onQuickComplete={onQuickComplete}
      onEdit={onSessionEdit}
      onDelete={onSessionDelete}
      trigger={cardContent}
    />
  );
}
