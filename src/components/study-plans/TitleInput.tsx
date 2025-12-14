import type { FieldError } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export interface TitleInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: FieldError;
  autoFocus?: boolean;
}

/**
 * Input field for study plan title with character counter and validation
 * Uses shadcn Input component with real-time validation
 */
export function TitleInput({ value, onChange, error, autoFocus }: TitleInputProps) {
  const maxLength = 200;
  const currentLength = value.length;
  const isOverLimit = currentLength > maxLength;

  return (
    <div className="space-y-2">
      <Label htmlFor="title">Tytuł planu</Label>

      <Input
        id="title"
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={maxLength}
        // eslint-disable-next-line jsx-a11y/no-autofocus
        autoFocus={autoFocus}
        aria-invalid={!!error}
        aria-describedby={error ? "title-error" : "title-counter"}
        placeholder="Wprowadź tytuł planu nauki..."
        className={cn(error && "border-destructive")}
        data-test-id="create-plan-title-input"
      />

      <div className="flex items-center justify-between gap-2">
        {/* Error Message */}
        {error && (
          <span id="title-error" role="alert" className="text-sm font-medium text-destructive">
            {error.message}
          </span>
        )}

        {/* Character Counter */}
        <span
          id="title-counter"
          className={cn(
            "ml-auto text-sm font-medium tabular-nums",
            isOverLimit ? "text-destructive" : "text-muted-foreground"
          )}
          aria-label={`${currentLength} z ${maxLength} znaków`}
        >
          {currentLength}/{maxLength}
        </span>
      </div>
    </div>
  );
}
