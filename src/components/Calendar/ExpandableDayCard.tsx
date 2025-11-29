import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { format } from "date-fns";
import { SessionCardMini } from "./SessionCardMini";
import type { ExpandableDayCardProps } from "./calendar.types";

/**
 * Expandable Day Card component for mobile view
 *
 * Shows a collapsible card for each day with sessions
 * Header always visible with date, session count badge, and chevron
 * Content (sessions list) expands/collapses on click
 * Default expanded for current week
 *
 * @example
 * <ExpandableDayCard
 *   date={new Date()}
 *   sessions={[...]}
 *   isToday={true}
 *   defaultExpanded={true}
 *   onSessionClick={handleClick}
 *   onQuickComplete={handleComplete}
 *   onSessionEdit={handleEdit}
 *   onSessionDelete={handleDelete}
 * />
 */
export function ExpandableDayCard({
  date,
  sessions,
  isToday,
  defaultExpanded,
  onSessionClick,
  onQuickComplete,
  onSessionEdit,
  onSessionDelete,
}: ExpandableDayCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  // Format date for display
  const dayName = format(date, "EEEE"); // e.g., "Monday"
  const dateFormatted = format(date, "MMMM d"); // e.g., "November 27"

  return (
    <Card
      className={`expandable-day-card ${isToday ? "border-primary border-2" : ""}`}
      data-date={format(date, "yyyy-MM-dd")}
    >
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild>
          <CardHeader className={`cursor-pointer hover:bg-accent transition-colors ${isToday ? "bg-primary/5" : ""}`}>
            <div className="flex items-center justify-between">
              {/* Date display */}
              <div className="flex-1">
                <h3 className={`font-semibold text-base ${isToday ? "text-primary" : ""}`}>{dayName}</h3>
                <p className="text-sm text-muted-foreground">{dateFormatted}</p>
              </div>

              {/* Session count badge */}
              <Badge variant={isToday ? "default" : "secondary"} className="mr-2">
                {sessions.length} {sessions.length === 1 ? "session" : "sessions"}
              </Badge>

              {/* Chevron indicator */}
              <ChevronDown
                className={`h-5 w-5 text-muted-foreground transition-transform ${isExpanded ? "rotate-180" : ""}`}
              />
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0 pb-4 space-y-2">
            {sessions.map((session) => (
              <SessionCardMini
                key={session.id}
                session={session}
                onSessionClick={onSessionClick}
                onQuickComplete={onQuickComplete}
                onSessionEdit={onSessionEdit}
                onSessionDelete={onSessionDelete}
              />
            ))}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
