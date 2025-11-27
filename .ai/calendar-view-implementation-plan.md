# Plan implementacji widoku Kalendarz

## 1. Przegląd

Widok Kalendarz jest głównym interfejsem aplikacji Bloom Learning po zalogowaniu użytkownika. Umożliwia przeglądanie zaplanowanych sesji powtórkowych w formie miesięcznego kalendarza, szybki dostęp do sesji, dodawanie nowych sesji oraz oznaczanie ich jako ukończone. Widok dostosowuje się do różnych rozmiarów ekranów (desktop/tablet/mobile) z dedykowanymi układami dla każdej platformy.

## 2. Routing widoku

**Ścieżka**: `/app/calendar`  
**Typ**: Chroniony (wymaga uwierzytelnienia)  
**Plik**: `src/pages/app/calendar.astro`  
**Domyślny widok**: Po zalogowaniu użytkownik zostaje przekierowany na tę ścieżkę

## 3. Struktura komponentów

```
CalendarView (Astro page: src/pages/app/calendar.astro)
├── AppLayout (src/layouts/AppLayout.astro)
│   ├── Sidebar (desktop/tablet)
│   ├── BottomNav (mobile)
│   └── Main Content Area
│       └── CalendarViewContent (React: src/components/Calendar/CalendarViewContent.tsx)
│           ├── CalendarHeader (src/components/Calendar/CalendarHeader.tsx)
│           │   ├── MonthYearNav (prev/next buttons)
│           │   ├── TodayButton
│           │   └── FilterDropdown
│           ├── CalendarGrid (Desktop/Tablet) (src/components/Calendar/CalendarGrid.tsx)
│           │   └── CalendarDayCell[] (src/components/Calendar/CalendarDayCell.tsx)
│           │       └── SessionCardMini[] (src/components/Calendar/SessionCardMini.tsx)
│           │           └── SessionPopover (src/components/Calendar/SessionPopover.tsx)
│           ├── CalendarDayList (Mobile) (src/components/Calendar/CalendarDayList.tsx)
│           │   └── ExpandableDayCard[] (src/components/Calendar/ExpandableDayCard.tsx)
│           │       └── SessionCardMini[]
│           ├── FloatingActionButton (Mobile) (src/components/Calendar/FloatingActionButton.tsx)
│           ├── AddSessionModal (src/components/Calendar/AddSessionModal.tsx)
│           │   └── AddSessionForm (src/components/Calendar/AddSessionForm.tsx)
│           └── EmptyStateCard (src/components/Calendar/EmptyStateCard.tsx)
```

## 4. Szczegóły komponentów

### CalendarViewContent (Component główny)

**Opis**: Kontener główny widoku kalendarza, zarządza stanem widoku, ładowaniem sesji i filtrowaniem. Renderuje odpowiedni layout (grid/list) w zależności od rozmiaru ekranu.

**Główne elementy**:

- `<div className="calendar-view-container">` - kontener główny z padding i max-width
- `<CalendarHeader />` - nagłówek z nawigacją i filtrami
- Warunkowe renderowanie: `<CalendarGrid />` (desktop/tablet) lub `<CalendarDayList />` (mobile)
- `<AddSessionModal />` - modal dodawania sesji (kontrolowany przez state)
- `<EmptyStateCard />` - conditional render gdy brak sesji

**Obsługiwane interakcje**:

- Zmiana miesiąca (prev/next)
- Skok do dzisiejszej daty
- Filtrowanie sesji według planu
- Otwieranie/zamykanie modalu dodawania sesji
- Kliknięcie na sesję → nawigacja do szczegółów
- Quick complete z popover
- Dodawanie nowej sesji

**Obsługiwana walidacja**:

- Sprawdzenie czy użytkownik jest zalogowany (middleware Astro)
- Walidacja dat (miesiąc w zakresie +/- 5 lat od dzisiaj)
- Walidacja filtrów (prawidłowy UUID planu lub null)

**Typy**:

- `CalendarViewState` (ViewModel stanu widoku)
- `ReviewSessionDto` (z `src/types.ts`)
- `StudyPlanListItemDto` (z `src/types.ts`)
- `CalendarDateRange` (zakres dat do pobrania)
- `SessionsByDate` (mapa sesji pogrupowanych po datach)

**Propsy**: Brak (jest to komponent top-level dla widoku)

---

### CalendarHeader

**Opis**: Nagłówek kalendarza zawierający nawigację miesiąc/rok, przycisk "Dzisiaj" oraz dropdown filtrowania według planu nauki. Sticky na urządzeniach mobilnych.

**Główne elementy**:

- `<header className="calendar-header">` z flexbox layout
- Sekcja nawigacji:
  - `<Button variant="ghost">` z ArrowLeft icon (poprzedni miesiąc)
  - `<h2>` z nazwą miesiąca i rokiem (np. "Listopad 2025")
  - `<Button variant="ghost">` z ArrowRight icon (następny miesiąc)
- `<Button variant="outline">` "Dzisiaj"
- `<Select>` (shadcn) z listą planów nauki do filtrowania

**Obsługiwane interakcje**:

- `onPrevMonth()` - przejście do poprzedniego miesiąca
- `onNextMonth()` - przejście do następnego miesiąca
- `onToday()` - skok do bieżącego miesiąca i dnia
- `onFilterChange(planId: string | null)` - filtrowanie sesji według planu

**Obsługiwana walidacja**:

- Walidacja czy można przejść dalej wstecz/wprzód (zakres +/- 5 lat)
- Disabled state dla przycisków gdy limit osiągnięty

**Typy**:

- `CalendarHeaderProps` - interfejs propsów komponentu
- `StudyPlanListItemDto[]` - lista planów do filtra

**Propsy**:

```typescript
interface CalendarHeaderProps {
  currentDate: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
  selectedPlanId: string | null;
  onFilterChange: (planId: string | null) => void;
  studyPlans: StudyPlanListItemDto[];
  canGoPrev: boolean;
  canGoNext: boolean;
}
```

---

### CalendarGrid (Desktop/Tablet)

**Opis**: Siatka 7x(5-6) reprezentująca dni miesiąca w układzie tygodniowym. Każdy dzień to osobna komórka z listą sesji. Widoczna tylko na desktop i tablet (≥768px).

**Główne elementy**:

- `<div className="calendar-grid">` z CSS Grid (7 kolumn)
- Header row z nazwami dni tygodnia: `<div className="day-header">Pon, Wt, Śr, Czw, Pt, Sob, Nie</div>`
- Grid cells (5-6 wierszy x 7 kolumn):
  - `<CalendarDayCell />` dla każdego dnia miesiąca
  - Puste komórki dla dni spoza bieżącego miesiąca (z klasą `out-of-month`)

**Obsługiwane interakcje**:

- Keyboard navigation: Arrow keys (lewo/prawo/góra/dół) między dniami
- Enter na komórce: focus pierwszej sesji lub otwarcie dnia
- Tab navigation: przez sesje w dniu
- Escape: zamknięcie popover

**Obsługiwana walidacja**: Brak (czysta prezentacja)

**Typy**:

- `CalendarGridProps`
- `CalendarDay` (data + lista sesji)
- `SessionsByDate` (mapa `Record<string, ReviewSessionDto[]>`)

**Propsy**:

```typescript
interface CalendarGridProps {
  currentMonth: Date;
  sessions: SessionsByDate;
  onSessionClick: (sessionId: string) => void;
  onQuickComplete: (sessionId: string) => Promise<void>;
  onSessionEdit: (sessionId: string) => void;
  onSessionDelete: (sessionId: string) => Promise<void>;
  selectedDate: Date | null;
  onDateSelect: (date: Date) => void;
}
```

---

### CalendarDayCell

**Opis**: Pojedyncza komórka dnia w kalendarzu (grid). Wyświetla datę oraz listę sesji zaplanowanych na ten dzień (max 3 widoczne, reszta w scrollable area). Dzień dzisiejszy jest highlighted.

**Główne elementy**:

- `<div className="day-cell">` z conditional classes: `today`, `has-sessions`, `selected`, `out-of-month`
- `<div className="day-number">` - numer dnia (1-31)
- `<Badge>` - liczba sesji jeśli >3
- `<div className="sessions-list">` - scrollable lista:
  - `<SessionCardMini />` dla każdej sesji (max 3 widoczne bez scroll)

**Obsługiwane interakcje**:

- Kliknięcie na komórkę: `onDayClick(date)`
- Kliknięcie na sesję: delegowane do `SessionCardMini`
- Focus/hover states dla accessibility

**Obsługiwana walidacja**: Brak

**Typy**:

- `CalendarDayCellProps`
- `ReviewSessionDto[]`

**Propsy**:

```typescript
interface CalendarDayCellProps {
  date: Date;
  sessions: ReviewSessionDto[];
  isToday: boolean;
  isSelected: boolean;
  isCurrentMonth: boolean;
  onDayClick: (date: Date) => void;
  onSessionClick: (sessionId: string) => void;
  onQuickComplete: (sessionId: string) => Promise<void>;
  onSessionEdit: (sessionId: string) => void;
  onSessionDelete: (sessionId: string) => Promise<void>;
}
```

---

### SessionCardMini

**Opis**: Miniaturowa karta sesji wyświetlana w kalendarzu. Pokazuje nazwę planu, etykietę ćwiczenia, status (pending/completed) oraz poziom taksonomii. Hover/click otwiera popover z quick actions.

**Główne elementy**:

- `<div className="session-card-mini">` z flex layout, conditional classes: `completed`, `pending`
- `<div className="plan-title">` - nazwa planu (truncated jeśli za długa)
- `<div className="exercise-label">` - typ ćwiczenia
- `<Badge variant={status}>` - status badge (pending/completed)
- `<Badge variant="secondary">` - poziom taksonomii (Remember, Understand, Apply, etc.)
- `<SessionPopover>` - popover z quick actions (trigger: hover lub click)

**Obsługiwane interakcje**:

- Kliknięcie: nawigacja do `/app/review-sessions/{sessionId}`
- Hover: otwiera popover z quick actions (desktop)
- Długie naciśnięcie (mobile): otwiera popover
- Keyboard: Enter/Space → otwiera sesję, Tab → focus next session

**Obsługiwana walidacja**: Brak

**Typy**:

- `SessionCardMiniProps`
- `ReviewSessionDto`

**Propsy**:

```typescript
interface SessionCardMiniProps {
  session: ReviewSessionDto;
  onSessionClick: (sessionId: string) => void;
  onQuickComplete: (sessionId: string) => Promise<void>;
  onSessionEdit: (sessionId: string) => void;
  onSessionDelete: (sessionId: string) => Promise<void>;
}
```

---

### SessionPopover

**Opis**: Popover (shadcn) z quick actions dla sesji. Wyświetla się po hover/click na SessionCardMini. Zawiera przyciski: View Details, Quick Complete, Edit, Delete.

**Główne elementy**:

- `<Popover>` (shadcn) z trigger i content
- `<PopoverContent>` z listą akcji:
  - `<Button variant="ghost">` "Zobacz szczegóły" → nawigacja
  - `<Button variant="ghost">` "Oznacz jako ukończone" (jeśli pending)
  - `<Button variant="ghost">` "Edytuj"
  - `<Separator />`
  - `<Button variant="destructive" size="sm">` "Usuń"

**Obsługiwane interakcje**:

- `onViewDetails()` - nawigacja do `/app/review-sessions/{sessionId}`
- `onQuickComplete()` - oznaczenie jako completed (optimistic update)
- `onEdit()` - otwiera modal edycji sesji
- `onDelete()` - pokazuje confirmation dialog, następnie usuwa sesję
- Escape: zamknięcie popover
- Click outside: zamknięcie popover

**Obsługiwana walidacja**:

- Quick complete dostępne tylko dla sesji w statusie "pending"
- Delete wymaga potwierdzenia (confirmation dialog)

**Typy**:

- `SessionPopoverProps`
- `ReviewSessionDto`

**Propsy**:

```typescript
interface SessionPopoverProps {
  session: ReviewSessionDto;
  onQuickComplete: (sessionId: string) => Promise<void>;
  onEdit: (sessionId: string) => void;
  onDelete: (sessionId: string) => Promise<void>;
  trigger: React.ReactNode;
}
```

---

### CalendarDayList (Mobile)

**Opis**: Lista dni z sesjami dla widoku mobilnego (<768px). Alternatywa dla CalendarGrid. Każdy dzień to expandable card. Current week domyślnie expanded.

**Główne elementy**:

- `<div className="calendar-day-list">` - scrollable container
- `<ExpandableDayCard />` dla każdego dnia z sesjami w bieżącym miesiącu
- Grouping: tydzień po tygodniu, separatory między tygodniami

**Obsługiwane interakcje**:

- Scroll do dzisiejszej daty przy montowaniu
- Kliknięcie na dzień: expand/collapse
- Kliknięcie na sesję: nawigacja do szczegółów

**Obsługiwana walidacja**: Brak

**Typy**:

- `CalendarDayListProps`
- `SessionsByDate`

**Propsy**:

```typescript
interface CalendarDayListProps {
  currentMonth: Date;
  sessions: SessionsByDate;
  onSessionClick: (sessionId: string) => void;
  onQuickComplete: (sessionId: string) => Promise<void>;
  onSessionEdit: (sessionId: string) => void;
  onSessionDelete: (sessionId: string) => Promise<void>;
}
```

---

### ExpandableDayCard

**Opis**: Expandable card dla pojedynczego dnia w mobile layout. Zawiera datę, liczbę sesji oraz listę sesji (collapsed domyślnie, expanded dla current week).

**Główne elementy**:

- `<Card>` (shadcn) z flexbox layout
- Header (zawsze widoczny):
  - `<div className="day-header">` - data (np. "Poniedziałek, 27 listopada")
  - `<Badge>` - liczba sesji
  - `<ChevronDown />` icon (rotate 180deg gdy expanded)
- Content (collapsible):
  - `<Collapsible>` (shadcn)
  - `<SessionCardMini />` dla każdej sesji

**Obsługiwane interakcje**:

- Kliknięcie na header: toggle expand/collapse
- Kliknięcie na sesję: delegowane do SessionCardMini

**Obsługiwana walidacja**: Brak

**Typy**:

- `ExpandableDayCardProps`
- `ReviewSessionDto[]`

**Propsy**:

```typescript
interface ExpandableDayCardProps {
  date: Date;
  sessions: ReviewSessionDto[];
  isToday: boolean;
  defaultExpanded: boolean;
  onSessionClick: (sessionId: string) => void;
  onQuickComplete: (sessionId: string) => Promise<void>;
  onSessionEdit: (sessionId: string) => void;
  onSessionDelete: (sessionId: string) => Promise<void>;
}
```

---

### FloatingActionButton (FAB, Mobile)

**Opis**: Floating Action Button w prawym dolnym rogu (mobile tylko). Otwiera modal dodawania nowej sesji.

**Główne elementy**:

- `<Button className="floating-action-button">` z fixed position
- `<PlusIcon />` lub `<Plus />` icon

**Obsługiwane interakcje**:

- Kliknięcie: `onAddSession()` → otwiera AddSessionModal

**Obsługiwana walidacja**: Brak

**Typy**:

- `FloatingActionButtonProps`

**Propsy**:

```typescript
interface FloatingActionButtonProps {
  onAddSession: () => void;
}
```

---

### AddSessionModal

**Opis**: Modal (Dialog shadcn) do dodawania nowej sesji powtórkowej. Zawiera formularz wyboru planu, daty, typu ćwiczenia (predefined lub custom).

**Główne elementy**:

- `<Dialog>` (shadcn) z controlled state (open/onOpenChange)
- `<DialogContent>`
  - `<DialogHeader>`
    - `<DialogTitle>` "Dodaj nową sesję"
  - `<AddSessionForm />` - formularz
  - `<DialogFooter>`
    - `<Button variant="outline">` "Anuluj"
    - `<Button type="submit">` "Dodaj sesję"

**Obsługiwane interakcje**:

- Otwieranie/zamykanie modalu
- Submit formularza: POST `/api/review-sessions`
- Cancel: zamknięcie bez zapisywania
- Escape: zamknięcie modalu

**Obsługiwana walidacja**:

- Walidacja formularza (delegowana do AddSessionForm)

**Typy**:

- `AddSessionModalProps`
- `CreateReviewSessionCommand` (z `src/types.ts`)

**Propsy**:

```typescript
interface AddSessionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studyPlans: StudyPlanListItemDto[];
  onSubmitSuccess: () => void;
}
```

---

### AddSessionForm

**Opis**: Formularz dodawania sesji (React Hook Form + Zod). Wybór planu, daty, exercise template lub custom exercise, taxonomy level, content (questions/answers).

**Główne elementy**:

- `<Form>` (shadcn/react-hook-form)
- `<FormField>` "Plan nauki": `<Select>` z listą planów
- `<FormField>` "Data powtórki": `<DatePicker>` (shadcn Calendar)
- `<FormField>` "Typ ćwiczenia":
  - `<RadioGroup>`: "Wybierz szablon" / "Własne ćwiczenie"
  - Conditional: `<Select>` z templates LUB `<Input>` custom label
- `<FormField>` "Poziom taksonomii": `<Select>` (Remember, Understand, Apply, etc.)
- `<FormField>` "Pytania": `<Textarea>` (jedno pytanie na linię)
- `<FormField>` "Odpowiedzi": `<Textarea>` (jedna odpowiedź na linię)
- `<FormField>` "Notatki" (opcjonalne): `<Textarea>`

**Obsługiwane interakcje**:

- Zmiana planu: aktualizacja state
- Zmiana daty: walidacja czy data nie jest za daleko w przeszłości/przyszłości
- Wybór template vs custom: conditional rendering
- Submit: walidacja i POST `/api/review-sessions`

**Obsługiwana walidacja**:

- Plan: wymagany (UUID)
- Data: wymagana, nie może być > 1 rok w przeszłości lub > 5 lat w przyszłości
- Exercise label: wymagane (jeśli custom, min 3 znaki, max 200)
- Taxonomy level: wymagany
- Content.questions: wymagane, min 1 pytanie, max 50 pytań
- Content.answers: wymagane, liczba odpowiedzi = liczba pytań
- Notes: opcjonalne, max 1000 znaków

**Typy**:

- `AddSessionFormProps`
- `AddSessionFormData` (ViewModel formularza)
- `CreateReviewSessionCommand` (DTO wysyłane do API)

**Propsy**:

```typescript
interface AddSessionFormProps {
  studyPlans: StudyPlanListItemDto[];
  onSubmit: (command: CreateReviewSessionCommand) => Promise<void>;
  onCancel: () => void;
}
```

---

### EmptyStateCard

**Opis**: Card wyświetlany gdy użytkownik nie ma żadnych planów nauki ani sesji (onboarding). Zachęta do utworzenia pierwszego planu.

**Główne elementy**:

- `<Card>` (shadcn) z centered content
- Ilustracja/ikona (np. CalendarIcon lub BookIcon)
- `<h2>` "Witaj w Bloom Learning!"
- `<p>` "Utwórz swój pierwszy plan nauki, aby rozpocząć organizowanie wiedzy z powtórkami opartymi na AI."
- `<Button>` "Utwórz pierwszy plan" → nawigacja do `/app/plans/new`

**Obsługiwane interakcje**:

- Kliknięcie przycisku: nawigacja do `/app/plans/new`

**Obsługiwana walidacja**: Brak

**Typy**:

- `EmptyStateCardProps`

**Propsy**:

```typescript
interface EmptyStateCardProps {
  onCreatePlan: () => void;
}
```

---

## 5. Typy

### ViewModels (nowe typy dla widoku)

```typescript
// Stan główny widoku kalendarza
interface CalendarViewState {
  currentMonth: Date;
  selectedDate: Date | null;
  selectedPlanId: string | null;
  isAddSessionModalOpen: boolean;
  isLoading: boolean;
}

// Mapa sesji pogrupowanych po datach (klucz: YYYY-MM-DD)
type SessionsByDate = Record<string, ReviewSessionDto[]>;

// Zakres dat do pobrania sesji
interface CalendarDateRange {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
}

// Dzień kalendarza z sesjami
interface CalendarDay {
  date: Date;
  sessions: ReviewSessionDto[];
  isToday: boolean;
  isCurrentMonth: boolean;
}

// Dane formularza dodawania sesji (przed mapowaniem do CreateReviewSessionCommand)
interface AddSessionFormData {
  studyPlanId: string;
  reviewDate: Date;
  exerciseType: "template" | "custom";
  exerciseTemplateId?: string;
  customExerciseLabel?: string;
  taxonomyLevel: TaxonomyLevel;
  questionsText: string; // jeden na linię, będzie split na array
  answersText: string; // jeden na linię, będzie split na array
  notes?: string;
}
```

### DTOs używane z src/types.ts

- `ReviewSessionDto` - pełna reprezentacja sesji
- `StudyPlanListItemDto` - dane planu w liście
- `CreateReviewSessionCommand` - komenda tworzenia sesji
- `CompleteReviewSessionCommand` - komenda oznaczania jako completed
- `TaxonomyLevel` - enum poziomów taksonomii
- `ReviewStatus` - enum statusów sesji

---

## 6. Zarządzanie stanem

### Local Component State (useState)

**W CalendarViewContent**:

```typescript
const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
const [selectedDate, setSelectedDate] = useState<Date | null>(null);
const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
const [isAddSessionModalOpen, setIsAddSessionModalOpen] = useState(false);
```

### Server State (React Query)

**Custom hook: `useCalendarSessions`** (nowy plik: `src/lib/hooks/useCalendarSessions.ts`)

```typescript
export function useCalendarSessions(dateRange: CalendarDateRange, planId: string | null) {
  return useQuery({
    queryKey: ["review-sessions", dateRange, planId],
    queryFn: async () => {
      const params = new URLSearchParams({
        dateFrom: dateRange.startDate,
        dateTo: dateRange.endDate,
        ...(planId && { planId }),
      });

      const response = await fetch(`/api/review-sessions?${params}`);
      if (!response.ok) throw new Error("Failed to fetch sessions");

      return response.json() as Promise<ReviewSessionDto[]>;
    },
    staleTime: 1 * 60 * 1000, // 1 minuta
    refetchOnWindowFocus: true,
  });
}
```

**Custom hook: `useStudyPlans`** (istniejący lub nowy)

```typescript
export function useStudyPlans() {
  return useQuery({
    queryKey: ["study-plans"],
    queryFn: async () => {
      const response = await fetch("/api/study-plans");
      if (!response.ok) throw new Error("Failed to fetch plans");

      const data = await response.json();
      return data.items as StudyPlanListItemDto[];
    },
    staleTime: 5 * 60 * 1000, // 5 minut
  });
}
```

**Mutations**:

```typescript
// useCompleteSession
const completeSessionMutation = useMutation({
  mutationFn: async (sessionId: string) => {
    const response = await fetch(`/api/review-sessions/${sessionId}/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    if (!response.ok) throw new Error("Failed to complete session");
    return response.json();
  },
  onMutate: async (sessionId) => {
    // Optimistic update
    await queryClient.cancelQueries({ queryKey: ["review-sessions"] });

    const previousSessions = queryClient.getQueryData<ReviewSessionDto[]>(["review-sessions"]);

    queryClient.setQueryData<ReviewSessionDto[]>(["review-sessions"], (old) =>
      old?.map((s) =>
        s.id === sessionId ? { ...s, status: "completed", isCompleted: true, completedAt: new Date().toISOString() } : s
      )
    );

    return { previousSessions };
  },
  onError: (err, sessionId, context) => {
    // Rollback na błąd
    queryClient.setQueryData(["review-sessions"], context?.previousSessions);
    toast.error("Nie udało się oznaczyć sesji jako ukończonej");
  },
  onSuccess: () => {
    toast.success("Sesja oznaczona jako ukończona!");
  },
});

// useDeleteSession
const deleteSessionMutation = useMutation({
  mutationFn: async (sessionId: string) => {
    const response = await fetch(`/api/review-sessions/${sessionId}`, {
      method: "DELETE",
    });

    if (!response.ok) throw new Error("Failed to delete session");
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["review-sessions"] });
    toast.success("Sesja została usunięta");
  },
  onError: () => {
    toast.error("Nie udało się usunąć sesji");
  },
});

// useCreateSession
const createSessionMutation = useMutation({
  mutationFn: async (command: CreateReviewSessionCommand) => {
    const response = await fetch("/api/review-sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(command),
    });

    if (!response.ok) throw new Error("Failed to create session");
    return response.json() as Promise<ReviewSessionDto>;
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["review-sessions"] });
    toast.success("Sesja została utworzona!");
  },
  onError: () => {
    toast.error("Nie udało się utworzyć sesji");
  },
});
```

### Derived State (useMemo)

```typescript
// Grupowanie sesji po datach
const sessionsByDate = useMemo(() => {
  if (!sessions) return {};

  return sessions.reduce<SessionsByDate>((acc, session) => {
    const dateKey = format(new Date(session.reviewDate), "yyyy-MM-dd");

    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }

    acc[dateKey].push(session);
    return acc;
  }, {});
}, [sessions]);

// Generowanie dni miesiąca
const calendarDays = useMemo(() => {
  const firstDayOfMonth = startOfMonth(currentMonth);
  const lastDayOfMonth = endOfMonth(currentMonth);
  const startDate = startOfWeek(firstDayOfMonth, { weekStartsOn: 1 }); // Poniedziałek
  const endDate = endOfWeek(lastDayOfMonth, { weekStartsOn: 1 });

  const days: CalendarDay[] = [];
  let currentDate = startDate;

  while (currentDate <= endDate) {
    const dateKey = format(currentDate, "yyyy-MM-dd");
    const sessionsForDay = sessionsByDate[dateKey] || [];

    days.push({
      date: currentDate,
      sessions: sessionsForDay,
      isToday: isToday(currentDate),
      isCurrentMonth: isSameMonth(currentDate, currentMonth),
    });

    currentDate = addDays(currentDate, 1);
  }

  return days;
}, [currentMonth, sessionsByDate]);
```

---

## 7. Integracja API

### Endpoint: GET /api/review-sessions

**Ścieżka**: `/api/review-sessions`  
**Metoda**: GET  
**Query params**:

- `dateFrom` (string, required): Data początku zakresu (YYYY-MM-DD)
- `dateTo` (string, required): Data końca zakresu (YYYY-MM-DD)
- `planId` (string, optional): UUID planu do filtrowania
- `status` (string, optional): Status sesji (pending/completed)

**Request type**: Brak body (GET)

**Response type**: `ReviewSessionDto[]`

**Przykład użycia**:

```typescript
const { data: sessions, isLoading } = useCalendarSessions(
  { startDate: "2025-11-01", endDate: "2025-11-30" },
  selectedPlanId
);
```

---

### Endpoint: POST /api/review-sessions

**Ścieżka**: `/api/review-sessions`  
**Metoda**: POST  
**Request type**: `CreateReviewSessionCommand`

```typescript
{
  studyPlanId: string;
  exerciseTemplateId?: string;
  exerciseLabel: string;
  reviewDate: string; // YYYY-MM-DD
  taxonomyLevel: TaxonomyLevel;
  content: {
    questions: string[];
    answers: string[];
    hints?: string[];
  };
  notes?: string;
}
```

**Response type**: `ReviewSessionDto`

**Przykład użycia**:

```typescript
await createSessionMutation.mutateAsync({
  studyPlanId: formData.studyPlanId,
  exerciseLabel:
    formData.exerciseType === "custom"
      ? formData.customExerciseLabel!
      : templates.find((t) => t.id === formData.exerciseTemplateId)!.name,
  exerciseTemplateId: formData.exerciseType === "template" ? formData.exerciseTemplateId : undefined,
  reviewDate: format(formData.reviewDate, "yyyy-MM-dd"),
  taxonomyLevel: formData.taxonomyLevel,
  content: {
    questions: formData.questionsText.split("\n").filter((q) => q.trim()),
    answers: formData.answersText.split("\n").filter((a) => a.trim()),
  },
  notes: formData.notes,
});
```

---

### Endpoint: POST /api/review-sessions/{sessionId}/complete

**Ścieżka**: `/api/review-sessions/{sessionId}/complete`  
**Metoda**: POST  
**Params**: `sessionId` (string, UUID)  
**Request type**: `CompleteReviewSessionCommand` (może być puste `{}`)

```typescript
{
  completedAt?: string; // ISO timestamp, optional (domyślnie now())
}
```

**Response type**: `ReviewSessionDto`

**Przykład użycia**:

```typescript
await completeSessionMutation.mutateAsync(sessionId);
```

---

### Endpoint: DELETE /api/review-sessions/{sessionId}

**Ścieżka**: `/api/review-sessions/{sessionId}`  
**Metoda**: DELETE  
**Params**: `sessionId` (string, UUID)  
**Request type**: Brak body  
**Response type**: `204 No Content`

**Przykład użycia**:

```typescript
await deleteSessionMutation.mutateAsync(sessionId);
```

---

### Endpoint: GET /api/study-plans

**Ścieżka**: `/api/study-plans`  
**Metoda**: GET  
**Request type**: Brak body  
**Response type**: `Paginated<StudyPlanListItemDto>`

```typescript
{
  items: StudyPlanListItemDto[];
  page: number;
  pageSize: number;
  total: number;
}
```

**Przykład użycia**:

```typescript
const { data: plansData } = useStudyPlans();
const plans = plansData?.items || [];
```

---

## 8. Interakcje użytkownika

### 1. Nawigacja między miesiącami

**Akcja**: Użytkownik klika przycisk "Poprzedni miesiąc" lub "Następny miesiąc"

**Flow**:

1. Kliknięcie przycisku wywołuje `onPrevMonth()` lub `onNextMonth()`
2. State `currentMonth` jest aktualizowany (`setCurrentMonth(subMonths(currentMonth, 1))`)
3. `useCalendarSessions` automatycznie refetch z nowym zakresem dat (React Query dependency)
4. Kalendarz re-renderuje z nowymi sesjami

**Edge cases**:

- Jeśli osiągnięty limit (+/- 5 lat): przycisk disabled, tooltip informuje o limicie
- Podczas ładowania: pokazać skeleton loader w komórkach

---

### 2. Skok do dzisiejszej daty

**Akcja**: Użytkownik klika przycisk "Dzisiaj"

**Flow**:

1. Kliknięcie wywołuje `onToday()`
2. `setCurrentMonth(new Date())` - ustawienie na bieżący miesiąc
3. `setSelectedDate(new Date())` - highlight dzisiejszego dnia
4. Scroll do dzisiejszej komórki (desktop) lub dnia (mobile)

---

### 3. Filtrowanie według planu

**Akcja**: Użytkownik wybiera plan z dropdown w CalendarHeader

**Flow**:

1. Zmiana w `<Select>` wywołuje `onFilterChange(planId)`
2. State `selectedPlanId` jest aktualizowany
3. `useCalendarSessions` refetch z nowym filtrem (query key zmienia się)
4. Kalendarz pokazuje tylko sesje wybranego planu
5. Wybranie opcji "Wszystkie plany" ustawia `selectedPlanId` na `null` → pokazuje wszystkie sesje

---

### 4. Kliknięcie na sesję

**Akcja**: Użytkownik klika na `SessionCardMini` w kalendarzu

**Flow**:

1. Kliknięcie wywołuje `onSessionClick(sessionId)`
2. Nawigacja do `/app/review-sessions/{sessionId}` (Astro navigate lub window.location)
3. Użytkownik widzi szczegóły sesji (osobny widok Review Session Detail)

---

### 5. Quick Complete sesji (z popover)

**Akcja**: Użytkownik hover na `SessionCardMini` (desktop) → otwiera popover → klika "Oznacz jako ukończone"

**Flow**:

1. Hover otwiera `<SessionPopover>`
2. Kliknięcie "Oznacz jako ukończone" wywołuje `onQuickComplete(sessionId)`
3. Wywołanie `completeSessionMutation.mutateAsync(sessionId)`
4. **Optimistic update**: Sesja natychmiast zmienia wygląd na "completed" (zielony badge, przekreślone)
5. POST `/api/review-sessions/{sessionId}/complete`
6. Na sukces: Toast "Sesja oznaczona jako ukończona!", cache invalidation
7. Na błąd: Rollback optimistic update, Toast "Nie udało się oznaczyć sesji"

**Edge cases**:

- Jeśli sesja już completed: przycisk nie jest widoczny w popover
- Jeśli offline: pokazać komunikat i kolejkować akcję (future PWA feature)

---

### 6. Usuwanie sesji (z popover)

**Akcja**: Użytkownik klika "Usuń" w popover sesji

**Flow**:

1. Kliknięcie wywołuje `onDelete(sessionId)`
2. Wyświetlenie confirmation dialog: "Czy na pewno chcesz usunąć tę sesję? Tej operacji nie można cofnąć."
3. Użytkownik potwierdza → `deleteSessionMutation.mutateAsync(sessionId)`
4. DELETE `/api/review-sessions/{sessionId}`
5. Na sukces: Sesja znika z kalendarza (cache invalidation), Toast "Sesja została usunięta"
6. Na błąd: Toast "Nie udało się usunąć sesji"

**Edge cases**:

- Undo toast (5s) po usunięciu: użytkownik może cofnąć (POST ponownie z tym samym contentem)

---

### 7. Dodawanie nowej sesji

**Akcja Desktop/Tablet**: Użytkownik klika na pustą komórkę dnia LUB przycisk "Dodaj sesję" w header  
**Akcja Mobile**: Użytkownik klika FAB (+) w prawym dolnym rogu

**Flow**:

1. Kliknięcie otwiera `AddSessionModal` (`setIsAddSessionModalOpen(true)`)
2. Modal wyświetla `AddSessionForm`
3. Użytkownik wypełnia formularz:
   - Wybiera plan nauki (required)
   - Wybiera datę (required, pre-filled na kliknięty dzień jeśli applicable)
   - Wybiera "Szablon" lub "Własne ćwiczenie"
   - Jeśli szablon: wybiera z listy templates (GET `/api/exercise-templates`)
   - Jeśli custom: wpisuje nazwę ćwiczenia
   - Wybiera poziom taksonomii (required)
   - Wpisuje pytania (jedno na linię)
   - Wpisuje odpowiedzi (jedno na linię)
   - Opcjonalnie: notatki
4. Kliknięcie "Dodaj sesję" wywołuje validation (React Hook Form + Zod)
5. Jeśli valid: `createSessionMutation.mutateAsync(command)`
6. POST `/api/review-sessions`
7. Na sukces: Modal zamyka się, Toast "Sesja została utworzona!", cache invalidation, nowa sesja pojawia się w kalendarzu
8. Na błąd: Inline errors w formularzu, Toast "Nie udało się utworzyć sesji"

**Walidacje**:

- Plan wymagany
- Data wymagana, nie może być > 1 rok wstecz lub > 5 lat naprzód
- Exercise label wymagane (min 3, max 200 znaków)
- Pytania: min 1, max 50
- Odpowiedzi: liczba musi być równa liczbie pytań
- Notatki: max 1000 znaków

---

### 8. Edycja sesji (z popover)

**Akcja**: Użytkownik klika "Edytuj" w popover sesji

**Flow** (uproszczone dla MVP):

1. Kliknięcie wywołuje `onEdit(sessionId)`
2. Otwiera modal edycji (podobny do AddSessionModal, ale z pre-filled danymi)
3. Formularz: `EditSessionForm` (podobny do AddSessionForm)
4. Użytkownik edytuje pola, klika "Zapisz"
5. PATCH `/api/review-sessions/{sessionId}`
6. Na sukces: Modal zamyka się, Toast "Sesja zaktualizowana", cache invalidation

**Alternatywa**: Można nawigować do osobnej strony `/app/review-sessions/{sessionId}/edit` (jeśli modal za mały)

---

### 9. Empty State - pierwszy plan

**Akcja**: Nowy użytkownik otwiera kalendarz, nie ma żadnych planów

**Flow**:

1. `useStudyPlans()` zwraca pustą listę
2. `useCalendarSessions()` zwraca pustą listę
3. Conditional render: zamiast kalendarza wyświetla się `<EmptyStateCard />`
4. Kliknięcie "Utwórz pierwszy plan" → nawigacja do `/app/plans/new`

---

### 10. Keyboard Navigation (Desktop)

**Akcja**: Użytkownik używa klawiatury do nawigacji w kalendarzu

**Flow**:

- Arrow Left/Right/Up/Down: Przesuwa focus między komórkami dni
- Enter na komórce: Focus pierwszej sesji lub otwiera dzień
- Tab: Przechodzi przez sesje w dniu
- Escape: Zamyka popover lub modal
- Space: Toggle answer (w Review Session Detail) lub Select day

**Implementacja**:

- `onKeyDown` handler w `CalendarGrid`
- State `focusedDateIndex` do śledzenia focused day
- `useRef` dla każdej komórki, focus() programmatically

---

## 9. Warunki i walidacja

### Warunki weryfikowane przez interfejs

**1. Użytkownik zalogowany**

- **Gdzie**: Middleware Astro (`src/middleware/index.ts`)
- **Weryfikacja**: Sprawdzenie tokenu Supabase w cookies/headers
- **Wpływ na UI**: Jeśli niezalogowany → redirect do `/login` z `returnUrl=/app/calendar`

**2. Zakres dat (miesiąc)**

- **Gdzie**: `CalendarHeader` (prev/next buttons)
- **Weryfikacja**: `currentMonth` nie może być < 5 lat wstecz ani > 5 lat naprzód
- **Wpływ na UI**: Przyciski prev/next disabled gdy limit osiągnięty, tooltip z komunikatem

**3. Data dodawania sesji**

- **Gdzie**: `AddSessionForm` (datepicker validation)
- **Weryfikacja**: Data nie może być > 1 rok wstecz lub > 5 lat naprzód
- **Wpływ na UI**: Datepicker blokuje niedozwolone daty, inline error jeśli próba submit

**4. Sesja już ukończona**

- **Gdzie**: `SessionPopover` (quick complete button)
- **Weryfikacja**: `session.status === 'completed'` lub `session.isCompleted === true`
- **Wpływ na UI**: Przycisk "Oznacz jako ukończone" jest ukryty, pokazuje tylko "Zobacz szczegóły"

**5. Liczba pytań = liczba odpowiedzi**

- **Gdzie**: `AddSessionForm` (custom validation)
- **Weryfikacja**: `questions.length === answers.length` (po split('\n'))
- **Wpływ na UI**: Inline error pod polem answers: "Liczba odpowiedzi musi być równa liczbie pytań (X)"

**6. Minimum 1 pytanie**

- **Gdzie**: `AddSessionForm` (Zod schema)
- **Weryfikacja**: `questions.length >= 1`
- **Wpływ na UI**: Inline error: "Wprowadź co najmniej jedno pytanie"

**7. Maximum 50 pytań**

- **Gdzie**: `AddSessionForm` (Zod schema)
- **Weryfikacja**: `questions.length <= 50`
- **Wpływ na UI**: Inline error: "Maksymalnie 50 pytań dozwolonych"

**8. Exercise label (custom)**

- **Gdzie**: `AddSessionForm` (conditional validation)
- **Weryfikacja**: Jeśli `exerciseType === 'custom'`: label wymagany, min 3 znaki, max 200
- **Wpływ na UI**: Inline error pod polem custom label

**9. Plan wybrany**

- **Gdzie**: `AddSessionForm` (required field)
- **Weryfikacja**: `studyPlanId` nie może być pusty
- **Wpływ na UI**: Disabled submit button jeśli nie wybrany, inline error po próbie submit

**10. Empty State**

- **Gdzie**: `CalendarViewContent` (conditional rendering)
- **Weryfikacja**: `studyPlans.length === 0 && sessions.length === 0`
- **Wpływ na UI**: Kalendarz ukryty, `<EmptyStateCard />` wyświetlony

---

## 10. Obsługa błędów

### 1. Błąd ładowania sesji (GET /api/review-sessions)

**Scenariusz**: API zwraca 500 lub timeout

**Obsługa**:

- `useCalendarSessions` hook zwraca `isError: true, error: Error`
- UI: Wyświetl error state w miejscu kalendarza:
  ```tsx
  <Card>
    <CardContent>
      <AlertCircle className="text-destructive" />
      <p>Nie udało się załadować sesji.</p>
      <Button onClick={() => refetch()}>Spróbuj ponownie</Button>
    </CardContent>
  </Card>
  ```

---

### 2. Błąd ładowania planów (GET /api/study-plans)

**Scenariusz**: API zwraca błąd

**Obsługa**:

- Filter dropdown wyświetla placeholder "Błąd ładowania planów"
- AddSessionForm: Select planów disabled, komunikat "Nie można pobrać listy planów"
- Toast error: "Nie udało się załadować planów nauki"

---

### 3. Błąd Quick Complete (POST /api/review-sessions/{id}/complete)

**Scenariusz**: API zwraca 500 lub network error

**Obsługa**:

- **Optimistic update rollback**: Sesja wraca do stanu "pending"
- Toast error: "Nie udało się oznaczyć sesji jako ukończonej. Spróbuj ponownie."
- Retry button w toast (optional)

---

### 4. Błąd usuwania sesji (DELETE /api/review-sessions/{id})

**Scenariusz**: API zwraca błąd

**Obsługa**:

- Toast error: "Nie udało się usunąć sesji. Spróbuj ponownie."
- Sesja pozostaje w kalendarzu
- Undo toast (jeśli był optimistic update) anulowany

---

### 5. Błąd tworzenia sesji (POST /api/review-sessions)

**Scenariusz**: API zwraca 400 (validation error) lub 500

**Obsługa**:

- 400: Inline errors w formularzu (mapowanie API error details do pól)
  ```typescript
  if (error.code === "VALIDATION_ERROR") {
    error.details.forEach((issue) => {
      form.setError(issue.path[0], { message: issue.message });
    });
  }
  ```
- 500: Toast error: "Wystąpił błąd podczas tworzenia sesji. Spróbuj ponownie."
- Modal pozostaje otwarty (aby nie utracić danych formularza)

---

### 6. Sesja nie istnieje (404)

**Scenariusz**: Użytkownik klika na sesję, która została usunięta przez inny tab/urządzenie

**Obsługa**:

- Nawigacja do `/app/review-sessions/{sessionId}` zwraca 404
- Toast error: "Ta sesja już nie istnieje."
- Redirect do `/app/calendar`
- Invalidate cache: `queryClient.invalidateQueries(['review-sessions'])`

---

### 7. Offline (brak internetu)

**Scenariusz**: Użytkownik traci połączenie

**Obsługa** (MVP podstawowe):

- React Query automatycznie retry (3x z exponential backoff)
- Po 3 nieudanych próbach: Toast error: "Brak połączenia z internetem. Sprawdź połączenie."
- UI: Loading states pozostają, ale z komunikatem "Łączenie..."

**Obsługa** (future PWA):

- Offline indicator w header (pasek: "Jesteś offline")
- Akcje kolejkowane do wysłania po powrocie online
- Service worker cache dla kalendarza

---

### 8. Wolne API (>3s response)

**Scenariusz**: API odpowiada, ale bardzo wolno

**Obsługa**:

- Skeleton loader przez pierwsze 3s
- Po 3s: Pokazać komunikat "Ładowanie trwa dłużej niż zwykle..."
- Loading state nie blokuje UI (calendar grid renderuje z pustymi komórkami)

---

### 9. Validacja po stronie API różni się od klienta

**Scenariusz**: Backend odrzuca dane, które przeszły walidację Zod na kliencie (zmiana w API)

**Obsługa**:

- API zwraca 400 z `error.details` (Zod issues)
- Mapowanie do inline errors w formularzu
- Toast warning: "Niektóre pola wymagają poprawy."
- Logowanie do console (dev mode) dla debugowania

---

### 10. Concurrent edit conflict

**Scenariusz**: Użytkownik edytuje sesję w dwóch zakładkach jednocześnie

**Obsługa** (MVP: last-write-wins):

- Brak optymistic lockingu
- Druga aktualizacja nadpisuje pierwszą
- Toast info (optional): "Ta sesja mogła być zmodyfikowana w innym miejscu."

**Obsługa** (future):

- ETag w response headers
- If-Match w request headers dla PATCH
- 409 Conflict jeśli ETag nie pasuje
- UI: Warning modal "Ta sesja została zmodyfikowana. Odśwież i spróbuj ponownie."

---

## 11. Kroki implementacji

### Faza 1: Setup i struktura (2-3h)

1. **Utworzenie struktury plików**

   ```
   src/pages/app/calendar.astro
   src/components/Calendar/
     ├── CalendarViewContent.tsx
     ├── CalendarHeader.tsx
     ├── CalendarGrid.tsx
     ├── CalendarDayCell.tsx
     ├── SessionCardMini.tsx
     ├── SessionPopover.tsx
     ├── CalendarDayList.tsx
     ├── ExpandableDayCard.tsx
     ├── FloatingActionButton.tsx
     ├── AddSessionModal.tsx
     ├── AddSessionForm.tsx
     └── EmptyStateCard.tsx
   src/lib/hooks/
     ├── useCalendarSessions.ts
     ├── useStudyPlans.ts (jeśli nie istnieje)
     └── useReviewSessionMutations.ts
   ```

2. **Konfiguracja React Query**
   - Utworzenie `QueryClientProvider` w `src/layouts/AppLayout.astro` (jeśli nie istnieje)
   - Konfiguracja default options (staleTime, retry)

3. **Utworzenie custom hooków**
   - `useCalendarSessions` - fetch sesji z filtrowaniem po dacie i planie
   - `useCompleteSession` - mutation do oznaczania jako completed
   - `useDeleteSession` - mutation do usuwania
   - `useCreateSession` - mutation do tworzenia

4. **Definicja typów ViewModels**
   - `CalendarViewState`
   - `SessionsByDate`
   - `CalendarDay`
   - `AddSessionFormData`
   - Dodać do `src/types.ts` lub osobny plik `src/types/calendar.ts`

---

### Faza 2: Komponenty core (desktop) (4-5h)

5. **CalendarViewContent**
   - Setup stanu lokalnego (currentMonth, selectedDate, selectedPlanId)
   - Integracja z `useCalendarSessions` i `useStudyPlans`
   - Logika grupowania sesji po datach (`sessionsByDate`)
   - Conditional rendering: EmptyState vs Calendar
   - Responsywność: conditional render Grid vs List

6. **CalendarHeader**
   - Layout: flex z nawigacją i filtrami
   - Implementacja prev/next month handlers
   - Today button handler
   - Filter dropdown (Select z listą planów)
   - Disabled states dla limitów dat
   - Formatowanie nazwy miesiąca i roku

7. **CalendarGrid**
   - CSS Grid 7 kolumn
   - Generowanie dni miesiąca (42-49 komórek: 6-7 wierszy x 7 dni)
   - Header row z nazwami dni (Pon-Nie)
   - Renderowanie `CalendarDayCell` dla każdego dnia
   - Keyboard navigation (arrow keys) - podstawowa implementacja

8. **CalendarDayCell**
   - Layout: numer dnia + lista sesji
   - Conditional classes: `today`, `has-sessions`, `out-of-month`
   - Badge z liczbą sesji (jeśli >3)
   - Scrollable area dla sesji
   - Hover/focus states

9. **SessionCardMini**
   - Layout: truncated title, exercise label, badges
   - Status badge (pending/completed) - color coding
   - Taxonomy level badge
   - Trigger dla SessionPopover
   - Click handler → navigation do session detail

---

### Faza 3: Interakcje i mutations (3-4h)

10. **SessionPopover**
    - Shadcn Popover integration
    - Lista akcji: View Details, Quick Complete, Edit, Delete
    - Conditional rendering (Quick Complete tylko dla pending)
    - Event handlers z propsów
    - Confirmation dialog dla Delete (shadcn AlertDialog)

11. **Implementacja Quick Complete**
    - Hook `useCompleteSession` z optimistic update
    - Toast notifications (success/error)
    - Rollback na błąd
    - Testing manual: kliknąć, sprawdzić czy badge zmienia się natychmiast

12. **Implementacja Delete Session**
    - Hook `useDeleteSession`
    - Confirmation dialog przed usunięciem
    - Toast notifications
    - Cache invalidation po sukcesie
    - Undo toast (opcjonalnie, zaawansowane)

---

### Faza 4: Dodawanie sesji (4-5h)

13. **AddSessionModal**
    - Shadcn Dialog setup
    - State `open` controlled przez CalendarViewContent
    - Integration z AddSessionForm

14. **AddSessionForm**
    - React Hook Form setup
    - Zod schema validation:
      - `studyPlanId`: required UUID
      - `reviewDate`: required, w zakresie +1 rok wstecz do +5 lat
      - `exerciseType`: radio 'template' | 'custom'
      - `exerciseLabel`: conditional (jeśli custom, min 3, max 200)
      - `taxonomyLevel`: required enum
      - `questionsText`: required, będzie split na array
      - `answersText`: required, będzie split na array
      - Custom validation: liczba pytań = liczba odpowiedzi
      - `notes`: optional, max 1000 znaków
    - Conditional rendering: template Select vs custom Input
    - Submit handler: transform FormData → CreateReviewSessionCommand
    - Error mapping: API errors → inline form errors

15. **FloatingActionButton (Mobile)**
    - Fixed position (bottom-right)
    - Plus icon
    - Otwiera AddSessionModal

16. **Hook useCreateSession**
    - Mutation POST `/api/review-sessions`
    - Cache invalidation po sukcesie
    - Toast notifications
    - Error handling

---

### Faza 5: Mobile layout (3-4h)

17. **CalendarDayList**
    - Conditional render (<768px)
    - Lista `ExpandableDayCard` dla dni z sesjami
    - Grouping: tydzień po tygodniu (separatory)
    - Scroll do dzisiejszej daty przy montowaniu (useEffect + ref)

18. **ExpandableDayCard**
    - Shadcn Card + Collapsible
    - Header: data, badge liczby sesji, chevron icon
    - Content: lista `SessionCardMini`
    - Default expanded dla current week
    - Toggle expand/collapse

19. **Responsywność CalendarViewContent**
    - `useMediaQuery` hook (shadcn lub custom) dla breakpoints
    - Conditional render: `<CalendarGrid />` vs `<CalendarDayList />`
    - FAB widoczny tylko mobile

---

### Faza 6: Empty State i onboarding (1-2h)

20. **EmptyStateCard**
    - Shadcn Card centered
    - Ikona (CalendarIcon lub BookIcon)
    - Heading: "Witaj w Bloom Learning!"
    - Description: instrukcja
    - CTA Button: "Utwórz pierwszy plan" → navigation do `/app/plans/new`

21. **Conditional rendering w CalendarViewContent**
    - Logika: `studyPlans.length === 0 && sessions.length === 0`
    - EmptyState vs Calendar

---

### Faza 7: Accessibility i keyboard navigation (2-3h)

22. **ARIA labels**
    - Calendar grid: `<div role="grid" aria-label="Kalendarz sesji">`
    - Day cells: `<div role="gridcell" aria-label="Poniedziałek 27 listopada, 2 sesje">`
    - Dzisiejsza data: `aria-current="date"`
    - Buttons: `aria-label` dla icon-only buttons

23. **Keyboard navigation**
    - Arrow keys w CalendarGrid
    - Enter/Space na day cell
    - Tab przez sesje
    - Escape zamyka popover/modal
    - Focus management: return focus po zamknięciu modalu

24. **Screen reader support**
    - Live regions: `aria-live="polite"` dla toast notifications
    - Status announcements: "Sesja oznaczona jako ukończona" (screen reader only text)
    - Focus indicators: outline na focused elements

25. **Color contrast**
    - Sprawdzenie wszystkich kolorów (badges, buttons, text) z narzędziami (axe DevTools)
    - Poprawki jeśli kontrast <4.5:1

---

### Faza 8: Error handling i edge cases (2-3h)

26. **Error states UI**
    - Loading: skeleton loader w day cells
    - Error: error state card z "Retry" button
    - Empty (no sessions for month): subtle message w calendar

27. **Error boundary**
    - Wrap CalendarViewContent w ErrorBoundary
    - Fallback UI: error message + "Reload" button

28. **Toast notifications**
    - Setup shadcn Toaster (jeśli nie istnieje)
    - Success: "Sesja utworzona", "Sesja ukończona", "Sesja usunięta"
    - Error: "Nie udało się...", "Spróbuj ponownie"

29. **Optimistic updates**
    - Testing: symulacja wolnego API, sprawdzenie czy optimistic update działa
    - Testing rollback: symulacja błędu API, sprawdzenie czy rollback działa

---

### Faza 9: Styling i polish (2-3h)

30. **Tailwind classes**
    - Responsive breakpoints (mobile/tablet/desktop)
    - Hover/focus states
    - Transitions (smooth animations dla expand/collapse, hover)
    - Dark mode support (jeśli w projekcie)

31. **Spacing i alignment**
    - Consistent padding/margins
    - Grid gap w CalendarGrid
    - Card spacing w mobile list

32. **Icons**
    - Import z lucide-react: ArrowLeft, ArrowRight, Calendar, Plus, Check, X, ChevronDown, AlertCircle
    - Consistent size i color

33. **Badges**
    - Status badges: pending (yellow), completed (green)
    - Taxonomy badges: różne kolory dla poziomów (Remember: blue, Understand: purple, Apply: orange, Analyze: red, Evaluate: pink, Create: teal)

---

### Faza 10: Testing i debugging (3-4h)

34. **Manual testing - Happy paths**
    - Zalogować się → zobaczyć kalendarz
    - Nawigacja prev/next month
    - Kliknięcie "Dzisiaj"
    - Filtrowanie według planu
    - Kliknięcie na sesję → nawigacja do detail
    - Quick complete z popover
    - Dodanie nowej sesji (template)
    - Dodanie nowej sesji (custom)
    - Usunięcie sesji

35. **Manual testing - Edge cases**
    - Brak sesji w miesiącu (empty state w komórkach)
    - Brak planów (Empty State card)
    - > 3 sesje w jednym dniu (scroll w komórce)
    - Sesja już completed (brak quick complete button)
    - Błąd API (disconnect network, sprawdzić error states)

36. **Responsiveness testing**
    - Desktop (≥1024px): grid widoczny, FAB ukryty
    - Tablet (768-1023px): grid widoczny, collapsed sidebar
    - Mobile (<768px): list widoczny, FAB widoczny, bottom nav

37. **Accessibility testing**
    - Keyboard-only navigation (odłączyć mysz, użyć tylko Tab/Enter/Arrows)
    - Screen reader testing (NVDA na Windows lub VoiceOver na Mac)
    - axe DevTools scan
    - Color contrast check

38. **Performance testing**
    - Lighthouse audit (Performance, Accessibility, Best Practices, SEO)
    - Network throttling (slow 3G)
    - Large dataset (100+ sesji w miesiącu)

---

### Faza 11: Dokumentacja i finalizacja (1-2h)

39. **Komentarze w kodzie**
    - JSDoc dla funkcji i komponentów
    - Inline comments dla skomplikowanej logiki

40. **README dla komponentów** (optional)
    - Krótki opis każdego komponentu
    - Propsy i usage examples

41. **Commit i push**
    - Uporządkowane commity (atomic commits)
    - Descriptive commit messages

42. **Demo dla stakeholderów**
    - Przygotowanie scenariusza demo
    - Nagranie video (optional) lub live demo

---

**Łączny szacowany czas**: 30-40 godzin pracy programistycznej

**Priorytety dla MVP**:

- Fazy 1-4: Krytyczne (core functionality)
- Faza 5: Ważne (mobile support)
- Faza 6: Ważne (onboarding)
- Faza 7: Średnie (accessibility - można iteracyjnie poprawiać)
- Faza 8: Ważne (error handling)
- Fazy 9-11: Nice-to-have (polish, można iterować post-MVP)

**Zależności między fazami**:

- Faza 2 wymaga Fazy 1
- Faza 3 wymaga Fazy 2
- Faza 4 równoległa z Fazą 3 (można robić jednocześnie)
- Faza 5 wymaga Fazy 2
- Fazy 7-11 mogą być robione równolegle po zakończeniu Faz 1-6
