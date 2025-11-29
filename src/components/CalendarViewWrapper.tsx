import { QueryProvider } from "@/components/providers/QueryProvider";
import { CalendarView } from "@/components/CalendarView";

/**
 * Client-side wrapper for CalendarView with QueryProvider
 * This component must be rendered with client:only="react" in Astro
 */
export function CalendarViewWrapper() {
  return (
    <QueryProvider>
      <CalendarView />
    </QueryProvider>
  );
}
