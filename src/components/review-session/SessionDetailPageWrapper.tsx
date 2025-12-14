import { QueryProvider } from "@/components/providers/QueryProvider";
import { SessionDetailPage } from "./SessionDetailPage";

interface SessionDetailPageWrapperProps {
  sessionId: string;
}

export function SessionDetailPageWrapper({ sessionId }: SessionDetailPageWrapperProps) {
  return (
    <QueryProvider>
      <SessionDetailPage sessionId={sessionId} />
    </QueryProvider>
  );
}







