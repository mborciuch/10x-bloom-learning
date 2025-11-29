import type { FieldError } from "react-hook-form";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export interface SourceMaterialTextareaProps {
  value: string;
  onChange: (value: string) => void;
  error?: FieldError;
  wordCount: number;
}

/**
 * Large textarea for pasting source material with word count tracking
 * Uses shadcn Textarea component with vertical resize capability
 */
export function SourceMaterialTextarea({ value, onChange, error, wordCount }: SourceMaterialTextareaProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="sourceMaterial">Materiał źródłowy</Label>

      <p className="text-sm text-muted-foreground">Wklej tutaj materiał do nauki (min. 200 słów, max. 5000 słów)</p>

      <Textarea
        id="sourceMaterial"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn("min-h-[300px] resize-y", error && "border-destructive")}
        placeholder="Wklej lub wpisz materiał źródłowy, który chcesz wykorzystać do nauki..."
        aria-invalid={!!error}
        aria-describedby={error ? "source-error" : "source-helper"}
      />

      {/* Error Message */}
      {error && (
        <span id="source-error" role="alert" className="block text-sm font-medium text-destructive">
          {error.message}
        </span>
      )}

      {/* Helper text for screen readers */}
      <span id="source-helper" className="sr-only">
        Materiał musi zawierać między 200 a 5000 słów. Aktualnie: {wordCount} słów.
      </span>
    </div>
  );
}
