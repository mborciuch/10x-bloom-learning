import type { ReactNode } from "react";

interface CreatePlanLayoutProps {
  children: ReactNode;
}

/**
 * Layout wrapper for the create study plan form
 * Centers the form and limits maximum width for optimal readability
 */
export function CreatePlanLayout({ children }: CreatePlanLayoutProps) {
  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 md:py-12">
      <div className="mx-auto max-w-[700px] md:max-w-[600px]">
        <h1 className="mb-6 text-3xl font-bold">Stwórz nowy plan nauki</h1>
        {children}
      </div>
    </div>
  );
}
