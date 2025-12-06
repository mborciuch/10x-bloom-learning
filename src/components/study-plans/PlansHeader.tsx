import type { ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { PlansHeaderProps } from "./plans.types";

/**
 * Top toolbar for the study plans page.
 * Contains search input, status filter and CTA to create a new plan.
 */
export function PlansHeader({ search, status, onSearchChange, onStatusChange, onCreateClick }: PlansHeaderProps) {
  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    // Enforce max length at UI level; trimming for API is handled in the hook
    const value = event.target.value.slice(0, 200);
    onSearchChange(value);
  };

  const handleStatusChange = (value: string) => {
    if (value === "all" || value === "active" || value === "archived") {
      onStatusChange(value);
    }
  };

  return (
    <header
      className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
      aria-label="Study plans filters"
    >
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Plany nauki</h1>
        <p className="text-sm text-muted-foreground">Przeglądaj, filtruj i zarządzaj swoimi planami nauki.</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <Input
            type="search"
            value={search}
            onChange={handleSearchChange}
            placeholder="Search plans…"
            maxLength={200}
            aria-label="Search study plans"
            className="w-full sm:w-64"
          />
          <Select value={status} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-[140px]" aria-label="Filter by status">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button type="button" onClick={onCreateClick} className="w-full sm:w-auto">
          Utwórz nowy plan
        </Button>
      </div>
    </header>
  );
}
