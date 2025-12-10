import { QueryProvider } from "@/components/providers/QueryProvider";
import { AiReviewPage } from "./AiReviewPage";

interface AiReviewPageWrapperProps {
  planId: string;
}

export function AiReviewPageWrapper({ planId }: AiReviewPageWrapperProps) {
  return (
    <QueryProvider>
      <AiReviewPage planId={planId} />
    </QueryProvider>
  );
}



