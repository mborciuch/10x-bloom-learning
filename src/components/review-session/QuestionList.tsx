import { useCallback, useEffect, useState } from "react";
import type { ReviewSessionDto } from "@/types";
import { QuestionCard } from "./QuestionCard";

interface QuestionListProps {
  session: ReviewSessionDto;
}

export function QuestionList({ session }: QuestionListProps) {
  const totalQuestions = session.content.questions.length;
  const [openMap, setOpenMap] = useState<Record<number, boolean>>({});

  useEffect(() => {
    setOpenMap({});
  }, [session.id]);

  const handleToggle = useCallback((index: number, nextValue: boolean) => {
    setOpenMap((prev) => ({
      ...prev,
      [index]: nextValue,
    }));
  }, []);

  if (totalQuestions === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-border/70 bg-muted/40 p-6 text-center text-sm text-muted-foreground">
        No questions available for this session.
      </div>
    );
  }

  return (
    <section className="space-y-4" aria-label="Review questions">
      {session.content.questions.map((question, index) => (
        <QuestionCard
          key={`${session.id}-${index}`}
          index={index}
          total={totalQuestions}
          question={question}
          answer={session.content.answers[index] ?? "Answer unavailable."}
          hint={session.content.hints?.[index]}
          isOpen={Boolean(openMap[index])}
          onToggle={(next) => handleToggle(index, next)}
        />
      ))}
    </section>
  );
}

