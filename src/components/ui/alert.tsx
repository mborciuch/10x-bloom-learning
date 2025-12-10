import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const alertVariants = cva(
  "relative flex w-full gap-3 rounded-lg border px-4 py-3 text-sm [&>svg]:mt-0.5 [&>svg]:size-4 [&>svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-card text-card-foreground border-border",
        info: "border-primary/30 bg-primary/5 text-primary",
        success:
          "border-emerald-300/70 bg-emerald-50 text-emerald-700 dark:border-emerald-400/50 dark:bg-emerald-950/40 dark:text-emerald-200",
        destructive: "border-destructive/40 bg-destructive/10 text-destructive",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

interface AlertProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof alertVariants> {}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert({ className, variant, ...props }, ref) {
  return <div ref={ref} role="alert" className={cn(alertVariants({ variant }), className)} {...props} />;
});

const AlertTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(function AlertTitle(
  { className, children, ...props },
  ref
) {
  return (
    <h3 ref={ref} className={cn("font-semibold leading-none tracking-tight", className)} {...props}>
      {children}
    </h3>
  );
});

const AlertDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  function AlertDescription({ className, children, ...props }, ref) {
    return (
      <p ref={ref} className={cn("text-muted-foreground text-sm", className)} {...props}>
        {children}
      </p>
    );
  }
);

export { Alert, AlertTitle, AlertDescription };
