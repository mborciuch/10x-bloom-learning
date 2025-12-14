# Zależności komponentów w `src/components` (ASCII)

Ten dokument pokazuje zależności typu **“kto importuje / renderuje kogo”** w obrębie `src/components`, zgrupowane wokół głównych entrypointów.

Legenda:

- `A -> B`: komponent `A` zależy od `B` (import / render).
- `ui/*`, `hooks/*`, `providers/*`: współdzielone moduły w `src/components`.
- `lib/*`, `types`: zależności spoza `src/components` (np. `src/lib`, `src/types.ts`).

```text
CalendarViewWrapper.tsx
  -> providers/QueryProvider.tsx (@tanstack/react-query QueryClientProvider)
  -> CalendarView.tsx
     -> hooks/useStudyPlans.ts
     -> hooks/useCalendarSessions.ts
     -> hooks/useReviewSessionMutations.ts (useCompleteSession, useDeleteSession)
     -> LoadingSpinner.tsx
     -> ErrorState.tsx
     -> EmptyStateOnboarding.tsx
     -> Calendar/calendar.utils.ts
     -> Calendar/CalendarHeader.tsx
        -> ui/button.tsx, ui/select.tsx
        -> Calendar/calendar.types.ts
     -> Calendar/CalendarGrid.tsx
        -> Calendar/calendar.utils.ts
        -> Calendar/CalendarDayCell.tsx
           -> Calendar/SessionCardMini.tsx
              -> Calendar/SessionPopover.tsx
                 -> ui/popover.tsx, ui/alert-dialog.tsx, ui/button.tsx, ui/separator.tsx
     -> Calendar/CalendarDayList.tsx
        -> Calendar/ExpandableDayCard.tsx
           -> Calendar/SessionCardMini.tsx
              -> Calendar/SessionPopover.tsx
                 -> ui/popover.tsx, ui/alert-dialog.tsx, ui/button.tsx, ui/separator.tsx
     -> Calendar/FloatingActionButton.tsx
     -> Calendar/AddSessionModal.tsx
        -> ui/dialog.tsx
        -> Calendar/AddSessionForm.tsx
           -> ui/form.tsx, ui/input.tsx, ui/textarea.tsx, ui/select.tsx, ui/popover.tsx, ui/calendar.tsx, ui/radio-group.tsx, ui/button.tsx
           -> Calendar/addSessionSchema.ts
        -> hooks/useReviewSessionMutations.ts (useCreateSession)
        -> hooks/useExerciseTemplates.ts

ai-review/AiReviewPageWrapper.tsx
  -> providers/QueryProvider.tsx
  -> ai-review/AiReviewPage.tsx
     -> ai-review/AiReviewHeader.tsx
     -> ai-review/SessionReviewCard.tsx (ui/* + react-hook-form + lucide-react)
     -> hooks/useExerciseTemplates.ts
     -> hooks/useReviewSessionMutations.ts (useUpdateSession)
     -> ConfirmDialog.tsx (-> ui/alert-dialog.tsx)
     -> LoadingSpinner.tsx, ErrorState.tsx
     -> lib/hooks (useAiReviewSessions, useStudyPlanDetails)
     -> sonner (toast)

review-session/SessionDetailPageWrapper.tsx
  -> providers/QueryProvider.tsx
  -> review-session/SessionDetailPage.tsx
     -> hooks/useReviewSession.ts
     -> hooks/useReviewSessionMutations.ts (useCompleteSession)
     -> lib/hooks/useStudyPlanDetails
     -> LoadingSpinner.tsx, ErrorState.tsx
     -> review-session/SessionHeader.tsx (ui/button.tsx, ui/badge.tsx, lib/utils cn)
     -> review-session/QuestionList.tsx
        -> review-session/QuestionCard.tsx (ui/button.tsx, ui/badge.tsx, lib/utils cn)

study-plans/PlansPageWrapper.tsx
  -> @tanstack/react-query QueryClientProvider (własny QueryClient w wrapperze)
  -> study-plans/PlansPage.tsx
     -> study-plans/PlansHeader.tsx (ui/button.tsx, ui/input.tsx, ui/select.tsx)
     -> study-plans/PlansContent.tsx
        -> LoadingSpinner.tsx, ErrorState.tsx
        -> study-plans/PlansEmptyState.tsx -> EmptyStateOnboarding.tsx
        -> study-plans/PlansGrid.tsx -> study-plans/PlanCard.tsx (ui/card.tsx, ui/badge.tsx)
        -> study-plans/plans.mappers.ts
     -> study-plans/PlansPagination.tsx (ui/button.tsx)
     -> ConfirmDialog.tsx
     -> study-plans/ai-generation/AiGenerationDialog.tsx (ui/dialog.tsx)
        -> study-plans/ai-generation/AiGenerationForm.tsx (ui/form.tsx, ui/input.tsx, ui/button.tsx, ui/checkbox.tsx, ui/tooltip.tsx)
     -> lib/hooks (useStudyPlans, useDeletePlan, useUpdatePlanStatus, useAiGenerationMutation, useDebounce)
     -> sonner (toast)

auth/*
  -> ui/form.tsx, ui/input.tsx, ui/button.tsx, ui/checkbox.tsx, ui/alert.tsx
  -> lib/validation/auth.schema (walidacja)

landing/*.astro
  -> landing/landing.types.ts (typy)
  -> landing/HeroSection.astro dodatkowo: ui/button.tsx
```
