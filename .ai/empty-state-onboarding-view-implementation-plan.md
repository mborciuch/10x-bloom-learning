# Plan implementacji widoku Empty State (Onboarding)

## 1. Przegląd

Empty State (Onboarding) to komponent wyświetlany podczas pierwszego zalogowania nowego użytkownika do aplikacji Bloom Learning. Jego głównym celem jest przywitanie użytkownika i skierowanie go do utworzenia pierwszego planu nauki. Komponent wyświetla się warunkowo w widoku kalendarza (`/app/calendar`) gdy użytkownik nie posiada jeszcze żadnych planów nauki (`studyPlansCount === 0`).

Widok składa się z przyjaznej wiadomości powitalnej, krótkiego wyjaśnienia pierwszego kroku oraz wyraźnego przycisku call-to-action (CTA), który przekierowuje do formularza tworzenia planu nauki. Design jest minimalistyczny, zachęcający i nie intimidujący dla nowych użytkowników.

## 2. Routing widoku

**Ścieżka**: `/app/calendar` (conditional render)

Empty State nie jest osobną stroną, ale komponentem renderowanym warunkowo wewnątrz głównego widoku kalendarza. Komponent wyświetla się jako overlay lub primary content gdy spełniony jest warunek:

- Użytkownik jest zalogowany
- Liczba planów nauki użytkownika (`studyPlansCount`) wynosi 0

Po kliknięciu w przycisk CTA, użytkownik jest przekierowywany do `/app/plans/new`.

## 3. Struktura komponentów

```
CalendarPage.astro (src/pages/app/calendar.astro)
└── CalendarView (React Component, client:load)
    ├── EmptyStateOnboarding (React Component)
    │   ├── Card (shadcn/ui)
    │   │   ├── CardContent
    │   │   │   ├── Icon/Illustration (BookOpen, GraduationCap, lub custom)
    │   │   │   ├── Heading (h2)
    │   │   │   ├── Subheading (p)
    │   │   │   └── Button (shadcn/ui, primary, large)
    │   │   │       └── "Create Your First Study Plan" + Arrow Icon
    └── CalendarGrid (wyświetlany gdy studyPlansCount > 0)
```

**Hierarchia komponentów**:

- `CalendarPage.astro` - główna strona Astro (SSR)
- `CalendarView.tsx` - główny React komponent z logiką warunkową
- `EmptyStateOnboarding.tsx` - dedykowany komponent Empty State
- `Card`, `CardContent`, `Button` - komponenty z shadcn/ui

## 4. Szczegóły komponentów

### 4.1. CalendarPage.astro

**Opis komponentu**: Główna strona Astro dla widoku kalendarza. Odpowiedzialna za renderowanie layoutu aplikacji i osadzenie interaktywnego komponentu React `CalendarView`.

**Główne elementy**:

- `<AppLayout>` - wrapper z nawigacją (sidebar/bottom nav)
- `<CalendarView client:load>` - React komponent z pełną logiką kalendarza i empty state

**Obsługiwane zdarzenia**: Brak (strona Astro)

**Warunki walidacji**:

- Sprawdzenie czy użytkownik jest zalogowany (auth middleware)
- Jeśli nie zalogowany: redirect do `/login?returnUrl=/app/calendar`

**Typy**:

- Brak własnych typów (użycie Astro API types)

**Propsy**: Brak (top-level page)

---

### 4.2. CalendarView.tsx

**Opis komponentu**: Główny React komponent odpowiedzialny za wyświetlanie widoku kalendarza lub Empty State w zależności od liczby planów nauki użytkownika. Komponent zawiera logikę warunkowego renderowania oraz zarządzanie stanem ładowania danych.

**Główne elementy**:

```tsx
// Conditional rendering
{
  isLoading ? (
    <LoadingSpinner />
  ) : studyPlansCount === 0 ? (
    <EmptyStateOnboarding />
  ) : (
    <CalendarGrid sessions={sessions} />
  );
}
```

Struktura HTML:

- `<div className="calendar-view-container">` - główny kontener
  - `<LoadingSpinner />` - podczas ładowania
  - `<EmptyStateOnboarding />` - gdy brak planów
  - `<CalendarGrid />` - standardowy kalendarz z sesjami

**Obsługiwane zdarzenia**:

- Brak bezpośrednich event handlers (delegowane do child components)

**Warunki walidacji**:

- Warunek wyświetlania Empty State: `studyPlansCount === 0`
- Warunek wyświetlania LoadingSpinner: `isLoading === true`
- Warunek wyświetlania CalendarGrid: `!isLoading && studyPlansCount > 0`

**Typy**:

- `StudyPlanListItemDto[]` - lista planów nauki (z types.ts)
- `ReviewSessionDto[]` - lista sesji (jeśli potrzebne dla kalendarza)

**Propsy**: Brak (top-level component w context Astro)

**State**:

- Używa custom hook `useStudyPlans()` do pobrania listy planów
- `studyPlansCount` - obliczony z `plans?.length ?? 0`
- `isLoading` - status ładowania z React Query

---

### 4.3. EmptyStateOnboarding.tsx

**Opis komponentu**: Dedykowany komponent wyświetlający empty state dla nowych użytkowników. Zawiera kartę z ikoną, welcome message, opisem i dużym przyciskiem CTA. Komponent jest w pełni dostępny (accessible) z odpowiednimi ARIA attributes i focus management.

**Główne elementy**:

```tsx
<section className="empty-state-container" aria-labelledby="empty-state-heading">
  <Card className="empty-state-card">
    <CardContent>
      {/* Icon/Illustration */}
      <div className="icon-container">
        <BookOpenIcon /> {/* lub GraduationCapIcon z lucide-react */}
      </div>

      {/* Heading */}
      <h2 id="empty-state-heading">Welcome to Bloom Learning!</h2>

      {/* Subheading */}
      <p className="description">
        Create your first study plan to start organizing your learning journey with AI-powered repetitions.
      </p>

      {/* CTA Button */}
      <Button size="lg" onClick={handleCreatePlan} autoFocus>
        Create Your First Study Plan
        <ArrowRightIcon />
      </Button>

      {/* Optional future: Watch Tutorial link */}
      {/* <a href="#" className="tutorial-link">Watch Tutorial</a> */}
    </CardContent>
  </Card>
</section>
```

**Obsługiwane zdarzenia**:

- `onClick` na Button: `handleCreatePlan()` - nawigacja do `/app/plans/new`

**Warunki walidacji**:

- Komponent renderuje się tylko gdy wywołany przez parent (CalendarView) na podstawie warunku `studyPlansCount === 0`
- Brak wewnętrznej walidacji

**Typy**:

```typescript
interface EmptyStateOnboardingProps {
  // Komponent może działać bez propsów (autonomiczny)
  // lub przyjąć opcjonalne propsy dla customizacji
  onCreateClick?: () => void; // opcjonalny custom handler
}
```

**Propsy**:

- `onCreateClick?: () => void` - opcjonalny custom handler do nawigacji (domyślnie: nawigacja do `/app/plans/new`)

**Style (Tailwind classes)**:

- Kontener: `flex items-center justify-center min-h-[60vh] p-4`
- Card: `max-w-md w-full text-center shadow-lg`
- Icon: `mx-auto mb-6 text-primary` (wielkość 64x64)
- Heading: `text-2xl font-bold mb-3 text-foreground`
- Description: `text-muted-foreground mb-6 text-base leading-relaxed`
- Button: `size="lg"` (z shadcn), `w-full sm:w-auto`

---

### 4.4. useStudyPlans (Custom Hook)

**Opis komponentu**: Custom React hook wykorzystujący React Query do pobierania listy planów nauki z API. Hook zwraca dane, status ładowania, błędy i funkcję refetch.

**Implementacja**:

```typescript
// src/components/hooks/useStudyPlans.ts
import { useQuery } from "@tanstack/react-query";
import type { StudyPlanListItemDto } from "@/types";

export function useStudyPlans() {
  return useQuery<StudyPlanListItemDto[]>({
    queryKey: ["study-plans"],
    queryFn: async () => {
      const response = await fetch("/api/study-plans");

      if (!response.ok) {
        throw new Error("Failed to fetch study plans");
      }

      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
  });
}
```

**Returns**:

```typescript
{
  data: StudyPlanListItemDto[] | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
}
```

**Typy**:

- Request: Brak (GET endpoint bez parametrów)
- Response: `StudyPlanListItemDto[]` (z src/types.ts)

**Obsługiwane zdarzenia**: Brak (hook)

**Warunki walidacji**:

- Walidacja odpowiedzi: sprawdzenie `response.ok`
- Error handling: throw Error jeśli request failed

---

### 4.5. LoadingSpinner (Utility Component)

**Opis komponentu**: Reusable loading indicator wyświetlany podczas ładowania danych planów nauki.

**Główne elementy**:

```tsx
<div className="loading-spinner-container" role="status" aria-live="polite">
  <div className="spinner" /> {/* CSS animation */}
  <span className="sr-only">Loading study plans...</span>
</div>
```

**Propsy**:

```typescript
interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  label?: string;
}
```

**Style**:

- Kontener: `flex items-center justify-center min-h-[60vh]`
- Spinner: `animate-spin rounded-full border-4 border-primary border-t-transparent` (wielkość zależna od prop `size`)

---

## 5. Typy

### 5.1. Typy z src/types.ts (istniejące)

```typescript
// Używane w komponencie
import type { StudyPlanListItemDto } from "@/types";

// Interfejs dla pojedynczego planu nauki
interface StudyPlanListItemDto {
  id: string;
  title: string;
  sourceMaterial: string;
  wordCount: number;
  status: "active" | "archived";
  createdAt: string;
  updatedAt: string;
  pendingAiGeneration: boolean;
}
```

### 5.2. Nowe typy (ViewModel)

```typescript
// src/components/EmptyStateOnboarding.types.ts

/**
 * Props dla komponentu EmptyStateOnboarding
 * Komponent może działać autonomicznie lub z custom handlerem
 */
export interface EmptyStateOnboardingProps {
  /**
   * Opcjonalny custom handler dla przycisku CTA
   * Domyślnie: nawigacja do /app/plans/new
   */
  onCreateClick?: () => void;
}

/**
 * Typ dla stanu w CalendarView
 */
export interface CalendarViewState {
  studyPlansCount: number;
  isLoading: boolean;
  error: Error | null;
}
```

### 5.3. Typy dla React Query

```typescript
// QueryKey type dla study plans
type StudyPlansQueryKey = ["study-plans"];

// Hook return type
interface UseStudyPlansReturn {
  data: StudyPlanListItemDto[] | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => Promise<QueryObserverResult<StudyPlanListItemDto[]>>;
}
```

---

## 6. Zarządzanie stanem

### 6.1. Server State (React Query)

**Query Key**: `['study-plans']`

**Data fetching**:

- Hook: `useStudyPlans()`
- Endpoint: `GET /api/study-plans`
- Response type: `StudyPlanListItemDto[]`
- Stale time: 5 minut
- Retry: 3 próby

**Cache strategy**:

- Cache jest współdzielony przez wszystkie komponenty używające tego samego query key
- Automatyczne cache invalidation po utworzeniu nowego planu (w `useCreatePlan` hook)
- Background refetch gdy dane są stale

### 6.2. Local Component State

**CalendarView.tsx**:

```typescript
// Derived state z React Query
const { data: plans, isLoading, isError, error } = useStudyPlans();
const studyPlansCount = plans?.length ?? 0;

// Conditional rendering logic
const shouldShowEmptyState = !isLoading && studyPlansCount === 0;
const shouldShowCalendar = !isLoading && studyPlansCount > 0;
```

**EmptyStateOnboarding.tsx**:

```typescript
// Brak lokalnego state
// Całą logikę nawigacji można zaimplementować jako:

const handleCreatePlan = useCallback(() => {
  window.location.href = "/app/plans/new";
  // lub jeśli używamy router:
  // router.push('/app/plans/new');
}, []);
```

### 6.3. No Global State Required

Empty State nie wymaga globalnego state (Context). Komponent jest w pełni niezależny i bazuje na:

- Server state (React Query) dla liczby planów
- Local handlers dla nawigacji

---

## 7. Integracja API

### 7.1. Endpoint: GET /api/study-plans

**Request**:

- Method: `GET`
- URL: `/api/study-plans`
- Headers: `Authorization: Bearer <token>` (automatycznie przez Supabase client)
- Body: Brak

**Response**:

```typescript
// Success (200 OK)
StudyPlanListItemDto[]

// Przykład:
[
  {
    id: "uuid-1",
    title: "React Advanced Patterns",
    sourceMaterial: "...",
    wordCount: 1500,
    status: "active",
    createdAt: "2025-11-20T10:00:00Z",
    updatedAt: "2025-11-20T10:00:00Z",
    pendingAiGeneration: false
  }
]

// Empty array gdy brak planów
[]

// Error (401 Unauthorized)
{
  error: {
    code: "UNAUTHORIZED",
    message: "Authentication required"
  }
}

// Error (500 Internal Server Error)
{
  error: {
    code: "INTERNAL_SERVER_ERROR",
    message: "Failed to fetch study plans"
  }
}
```

### 7.2. Error Handling

**Scenariusze błędów**:

1. **401 Unauthorized** (użytkownik niezalogowany):
   - Action: Redirect do `/login?returnUrl=/app/calendar`
   - Handled przez: Astro middleware (nie powinno dotrzeć do komponentu)

2. **500 Internal Server Error** (problem z API):
   - Action: Wyświetl error state w CalendarView
   - Component: `<ErrorBoundary>` lub custom error UI
   - Message: "Failed to load your study plans. Please try again."
   - CTA: "Retry" button wywołujący `refetch()`

3. **Network Error** (brak połączenia):
   - Action: Wyświetl offline indicator
   - Message: "No internet connection. Please check your network."
   - Retry logic: Automatic retry przez React Query (3 próby)

**Implementacja error handling w CalendarView**:

```typescript
const { data: plans, isLoading, isError, error, refetch } = useStudyPlans();

if (isError) {
  return (
    <ErrorState
      message="Failed to load your study plans"
      onRetry={refetch}
    />
  );
}
```

---

## 8. Interakcje użytkownika

### 8.1. Główna interakcja: Kliknięcie przycisku CTA

**Trigger**: Click na "Create Your First Study Plan" button

**Flow**:

1. User klika button
2. `handleCreatePlan()` jest wywołane
3. Nawigacja do `/app/plans/new` (client-side navigation lub window.location)
4. Użytkownik widzi formularz tworzenia planu

**Accessibility**:

- Button ma `autoFocus` - automatyczny focus dla keyboard users
- Enter lub Space key trigger action
- ARIA labels: przycisk ma wyraźny text label (nie wymaga aria-label)

### 8.2. Keyboard Navigation

**Shortcuts**:

- **Tab**: Focus na przycisk CTA
- **Enter / Space**: Aktywacja przycisku (nawigacja do create plan)
- **Shift + Tab**: Focus poprzedni element (jeśli jest)

**Focus management**:

- Auto-focus na CTA button przy pierwszym renderze
- Visible focus indicator (Tailwind focus-visible:)

### 8.3. Screen Reader Support

**ARIA attributes**:

```tsx
<section aria-labelledby="empty-state-heading" role="region">
  <h2 id="empty-state-heading">Welcome to Bloom Learning!</h2>
  <p>Create your first study plan...</p>
  <Button autoFocus>
    Create Your First Study Plan
    <span className="sr-only">(opens create plan form)</span>
  </Button>
</section>
```

**Announcements**:

- Heading jest automatycznie announced przez screen reader
- Button label jest wyraźny i opisowy
- Optional: aria-live region dla dynamicznych zmian (jeśli dodamy loading state)

### 8.4. Mobile Interactions

**Touch targets**:

- Button: minimum 44x44px (spełnione przez size="lg" z shadcn)
- Touch feedback: subtle scale animation on tap

**Responsive layout**:

- Card: `max-w-md` z padding dla narrow viewports
- Button: `w-full sm:w-auto` - full width na mobile, auto na desktop
- Spacing: dostosowane marginesy dla mobile (mniejsze padding)

---

## 9. Warunki i walidacja

### 9.1. Warunek wyświetlania Empty State

**Lokalizacja**: `CalendarView.tsx`

**Warunek**:

```typescript
const shouldShowEmptyState = !isLoading && studyPlansCount === 0;
```

**Składowe warunku**:

1. `!isLoading` - dane zostały załadowane (nie pokazujemy empty state podczas ładowania)
2. `studyPlansCount === 0` - użytkownik nie ma żadnych planów nauki

**Logika**:

- Jeśli `isLoading === true` → pokaż LoadingSpinner
- Jeśli `isLoading === false && studyPlansCount === 0` → pokaż EmptyStateOnboarding
- Jeśli `isLoading === false && studyPlansCount > 0` → pokaż CalendarGrid
- Jeśli `isError === true` → pokaż ErrorState

**Wpływ na UI**:

- Empty State wypełnia viewport (centered vertically and horizontally)
- Całkowicie zastępuje CalendarGrid (nie overlay, ale primary content)

### 9.2. Walidacja autoryzacji

**Lokalizacja**: Astro middleware (`src/middleware/index.ts`)

**Warunek**:

```typescript
// Middleware sprawdza sesję przed renderowaniem strony
const {
  data: { user },
  error,
} = await supabase.auth.getUser();

if (error || !user) {
  return context.redirect("/login?returnUrl=/app/calendar");
}
```

**Składowe**:

- Sprawdzenie czy użytkownik jest zalogowany
- Redirect do `/login` z parametrem `returnUrl` jeśli nie zalogowany

**Wpływ na UI**:

- Użytkownik niezalogowany nigdy nie zobaczy Empty State
- Automatyczny redirect do login page

### 9.3. Walidacja dostępności danych

**Lokalizacja**: `useStudyPlans` hook

**Warunki**:

1. Response status OK (200): `response.ok === true`
2. Response body jest valid JSON array
3. Each item w array ma required fields (type safety z TypeScript)

**Error handling**:

```typescript
if (!response.ok) {
  throw new Error("Failed to fetch study plans");
}

const data = await response.json();

// TypeScript type checking zapewnia valid structure
// Runtime validation może być dodana z Zod jeśli needed
```

**Wpływ na UI**:

- Invalid response → isError state → ErrorState component
- Empty array `[]` → studyPlansCount = 0 → EmptyStateOnboarding
- Valid array with items → CalendarGrid

---

## 10. Obsługa błędów

### 10.1. Błędy sieciowe (Network Errors)

**Scenariusz**: Brak połączenia z internetem podczas pobierania planów

**Handling**:

```typescript
// React Query automatycznie retry (3 próby)
// Po 3 nieudanych próbach: isError = true

{isError && (
  <div className="error-state">
    <AlertCircleIcon />
    <p>Failed to load your study plans.</p>
    <p className="text-muted-foreground">
      Please check your internet connection and try again.
    </p>
    <Button onClick={() => refetch()}>Retry</Button>
  </div>
)}
```

**User feedback**:

- Error icon (AlertCircle)
- Jasny error message
- Retry button
- Optional: offline indicator w top bar

### 10.2. Błędy autoryzacji (401 Unauthorized)

**Scenariusz**: Sesja wygasła podczas korzystania z aplikacji

**Handling**:

```typescript
// W fetch interceptor lub React Query error handler
if (response.status === 401) {
  // Auto-logout
  await supabase.auth.signOut();
  // Redirect z return URL
  window.location.href = "/login?returnUrl=/app/calendar";
}
```

**User feedback**:

- Toast notification: "Your session has expired. Please login again."
- Automatyczny redirect do login page
- Return URL preserved dla post-login redirect

### 10.3. Błędy serwera (500 Internal Server Error)

**Scenariusz**: Problem z backendem lub bazą danych

**Handling**:

```typescript
if (response.status >= 500) {
  throw new Error('Server error. Please try again later.');
}

// W komponencie:
{isError && error?.message.includes('Server error') && (
  <ErrorState
    title="Something went wrong"
    message="We're having trouble loading your data. Our team has been notified."
    onRetry={refetch}
  />
)}
```

**User feedback**:

- User-friendly error message (nie technical details)
- Retry button
- Optional: "Contact Support" link
- Error logged w error tracking service (Sentry)

### 10.4. Empty State jako "No Data" (nie error)

**Scenariusz**: Użytkownik po prostu nie ma jeszcze planów (expected state)

**Handling**:

```typescript
// To NIE jest error - to expected empty state
if (!isLoading && studyPlansCount === 0) {
  return <EmptyStateOnboarding />;
}
```

**User feedback**:

- Pozytywny, zachęcający tone (nie error message)
- Welcome message + explanation
- Wyraźny CTA do akcji
- Przyjazny design (nie error red colors)

### 10.5. Edge Cases

#### 10.5.1. Race Condition: Plan utworzony w innej zakładce

**Scenariusz**: Użytkownik ma otwarte 2 zakładki, tworzy plan w jednej

**Handling**:

- React Query cache synchronization (jeśli refetch triggered)
- Możliwe cache invalidation przez BroadcastChannel API (future enhancement)
- Manual refresh: user odświeża stronę → nowe dane

**Current MVP**: Acceptable - refresh page to see changes

#### 10.5.2. Bardzo wolne połączenie

**Scenariusz**: Loading trwa bardzo długo (>10s)

**Handling**:

```typescript
// React Query timeout
useQuery({
  // ...
  timeout: 10000, // 10 seconds
  retry: 2,
});

// Dodatkowy feedback po 3s loading:
const [showSlowWarning, setShowSlowWarning] = useState(false);

useEffect(() => {
  if (isLoading) {
    const timer = setTimeout(() => {
      setShowSlowWarning(true);
    }, 3000);
    return () => clearTimeout(timer);
  }
}, [isLoading]);

// UI:
{isLoading && showSlowWarning && (
  <p className="text-muted-foreground">
    This is taking longer than usual...
  </p>
)}
```

---

## 11. Kroki implementacji

### Krok 1: Przygotowanie środowiska i zależności

**Zadania**:

1. Upewnij się, że `@tanstack/react-query` jest zainstalowane
   ```bash
   npm install @tanstack/react-query
   ```
2. Sprawdź czy shadcn/ui Card i Button są dostępne
   - Jeśli nie: `npx shadcn@latest add card button`
3. Zainstaluj lucide-react dla ikon (jeśli nie ma)
   ```bash
   npm install lucide-react
   ```

**Rezultat**: Wszystkie dependencies gotowe do użycia

---

### Krok 2: Utworzenie custom hook useStudyPlans

**Lokalizacja**: `src/components/hooks/useStudyPlans.ts`

**Zadania**:

1. Utwórz plik `src/components/hooks/useStudyPlans.ts`
2. Zaimplementuj React Query hook:

   ```typescript
   import { useQuery } from "@tanstack/react-query";
   import type { StudyPlanListItemDto } from "@/types";

   export function useStudyPlans() {
     return useQuery<StudyPlanListItemDto[]>({
       queryKey: ["study-plans"],
       queryFn: async () => {
         const response = await fetch("/api/study-plans");

         if (!response.ok) {
           throw new Error("Failed to fetch study plans");
         }

         return response.json();
       },
       staleTime: 5 * 60 * 1000, // 5 minutes
       retry: 3,
     });
   }
   ```

3. Dodaj type export dla query result

**Rezultat**: Hook gotowy do użycia w komponentach

---

### Krok 3: Implementacja komponentu EmptyStateOnboarding

**Lokalizacja**: `src/components/EmptyStateOnboarding.tsx`

**Zadania**:

1. Utwórz plik `src/components/EmptyStateOnboarding.tsx`
2. Zaimportuj niezbędne komponenty:
   ```typescript
   import { Button } from "@/components/ui/button";
   import { Card, CardContent } from "@/components/ui/card";
   import { BookOpen, ArrowRight } from "lucide-react";
   ```
3. Zdefiniuj interface dla props:
   ```typescript
   interface EmptyStateOnboardingProps {
     onCreateClick?: () => void;
   }
   ```
4. Zaimplementuj komponent z JSX structure zgodnie z sekcją 4.3
5. Dodaj Tailwind styling dla:
   - Centered layout (flex + items-center + justify-center)
   - Responsive padding i max-width
   - Icon styling (text-primary, size)
   - Typography hierarchy (heading sizes, colors)
6. Zaimplementuj `handleCreatePlan` handler:
   ```typescript
   const handleCreatePlan = useCallback(() => {
     if (onCreateClick) {
       onCreateClick();
     } else {
       window.location.href = "/app/plans/new";
     }
   }, [onCreateClick]);
   ```
7. Dodaj ARIA attributes:
   - `aria-labelledby` dla section
   - `id` dla heading
   - `autoFocus` dla button

**Rezultat**: Standalone EmptyStateOnboarding component gotowy

---

### Krok 4: Implementacja komponentu LoadingSpinner

**Lokalizacja**: `src/components/LoadingSpinner.tsx`

**Zadania**:

1. Utwórz plik `src/components/LoadingSpinner.tsx`
2. Zaimplementuj prosty spinner z CSS animation:

   ```typescript
   interface LoadingSpinnerProps {
     size?: 'sm' | 'md' | 'lg';
     label?: string;
   }

   export function LoadingSpinner({
     size = 'md',
     label = 'Loading...'
   }: LoadingSpinnerProps) {
     const sizeClasses = {
       sm: 'h-8 w-8',
       md: 'h-12 w-12',
       lg: 'h-16 w-16',
     };

     return (
       <div
         className="flex items-center justify-center min-h-[60vh]"
         role="status"
         aria-live="polite"
       >
         <div className={`
           animate-spin rounded-full border-4
           border-primary border-t-transparent
           ${sizeClasses[size]}
         `} />
         <span className="sr-only">{label}</span>
       </div>
     );
   }
   ```

3. Dodaj accessibility attributes (role, aria-live, sr-only label)

**Rezultat**: Reusable LoadingSpinner component

---

### Krok 5: Implementacja komponentu CalendarView

**Lokalizacja**: `src/components/CalendarView.tsx`

**Zadania**:

1. Utwórz plik `src/components/CalendarView.tsx`
2. Zaimportuj:
   - `useStudyPlans` hook
   - `EmptyStateOnboarding` component
   - `LoadingSpinner` component
   - (Placeholder) `CalendarGrid` component
3. Zaimplementuj logikę warunkowego renderowania:

   ```typescript
   export function CalendarView() {
     const { data: plans, isLoading, isError, error, refetch } = useStudyPlans();
     const studyPlansCount = plans?.length ?? 0;

     if (isLoading) {
       return <LoadingSpinner label="Loading study plans..." />;
     }

     if (isError) {
       return (
         <ErrorState
           message="Failed to load your study plans"
           onRetry={refetch}
         />
       );
     }

     if (studyPlansCount === 0) {
       return <EmptyStateOnboarding />;
     }

     return (
       <div className="calendar-container">
         {/* TODO: CalendarGrid implementation */}
         <div>Calendar Grid - {studyPlansCount} plans</div>
       </div>
     );
   }
   ```

4. Dodaj proper error handling dla każdego case

**Rezultat**: CalendarView z pełną logiką conditional rendering

---

### Krok 6: Implementacja ErrorState component

**Lokalizacja**: `src/components/ErrorState.tsx`

**Zadania**:

1. Utwórz plik `src/components/ErrorState.tsx`
2. Zaimplementuj prosty error UI:

   ```typescript
   import { Button } from '@/components/ui/button';
   import { AlertCircle } from 'lucide-react';

   interface ErrorStateProps {
     title?: string;
     message: string;
     onRetry?: () => void;
   }

   export function ErrorState({
     title = "Something went wrong",
     message,
     onRetry
   }: ErrorStateProps) {
     return (
       <div className="flex items-center justify-center min-h-[60vh]">
         <div className="text-center max-w-md">
           <AlertCircle className="mx-auto mb-4 text-destructive" size={48} />
           <h2 className="text-xl font-semibold mb-2">{title}</h2>
           <p className="text-muted-foreground mb-4">{message}</p>
           {onRetry && (
             <Button onClick={onRetry}>Try Again</Button>
           )}
         </div>
       </div>
     );
   }
   ```

**Rezultat**: Reusable ErrorState component

---

### Krok 7: Setup React Query Provider

**Lokalizacja**: Root layout lub main app entry

**Zadania**:

1. Jeśli nie istnieje, utwórz `src/components/providers/QueryProvider.tsx`:

   ```typescript
   import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
   import { useState } from 'react';

   export function QueryProvider({ children }: { children: React.ReactNode }) {
     const [queryClient] = useState(() => new QueryClient({
       defaultOptions: {
         queries: {
           staleTime: 5 * 60 * 1000,
           retry: 3,
         },
       },
     }));

     return (
       <QueryClientProvider client={queryClient}>
         {children}
       </QueryClientProvider>
     );
   }
   ```

2. Wrap CalendarView w QueryProvider (w Astro page lub layout)

**Rezultat**: React Query configured i ready

---

### Krok 8: Utworzenie strony Astro /app/calendar

**Lokalizacja**: `src/pages/app/calendar.astro`

**Zadania**:

1. Utwórz plik `src/pages/app/calendar.astro`
2. Zaimportuj layout i components:

   ```astro
   ---
   import AppLayout from "@/layouts/AppLayout.astro";
   import { CalendarView } from "@/components/CalendarView";
   import { QueryProvider } from "@/components/providers/QueryProvider";

   // Auth check (middleware powinien to obsłużyć)
   ---

   <AppLayout title="Calendar - Bloom Learning">
     <QueryProvider client:load>
       <CalendarView client:load />
     </QueryProvider>
   </AppLayout>
   ```

3. Sprawdź czy middleware chroni tę route (auth required)

**Rezultat**: Pełna strona kalendarza z empty state support

---

### Krok 9: Implementacja middleware auth protection

**Lokalizacja**: `src/middleware/index.ts`

**Zadania**:

1. Jeśli middleware nie istnieje, utwórz zgodnie z sekcją 9.2:

   ```typescript
   import { defineMiddleware } from "astro:middleware";
   import { supabaseClient } from "@/db/supabase.client";

   export const onRequest = defineMiddleware(async (context, next) => {
     // Add supabase to locals
     context.locals.supabase = supabaseClient;

     // Check if route is protected
     if (context.url.pathname.startsWith("/app")) {
       const {
         data: { user },
         error,
       } = await supabaseClient.auth.getUser();

       if (error || !user) {
         const returnUrl = encodeURIComponent(context.url.pathname);
         return context.redirect(`/login?returnUrl=${returnUrl}`);
       }
     }

     return next();
   });
   ```

2. Verify middleware configuration w `astro.config.mjs`

**Rezultat**: Protected routes z automatic redirect

---

### Krok 10: Styling i responsive design

**Zadania**:

1. Dodaj responsive breakpoints dla EmptyStateOnboarding:

   ```typescript
   // Card responsiveness
   className="max-w-md w-full mx-auto px-4 sm:px-0"

   // Button responsiveness
   className="w-full sm:w-auto"

   // Icon size
   className="mx-auto mb-6 text-primary" size={64}
   ```

2. Zaimplementuj responsive breakpoints:
   - Mobile (<640px): Full width card, full width button
   - Tablet (640-1024px): Constrained card, auto width button
   - Desktop (>1024px): Same as tablet
3. Zapewnij odpowiednie touch targets na mobile (min 44x44px)
4. Zaimplementuj dark mode (jeśli applicable):
   - Verify contrast wszystkich elementów
   - Icon i button visibility
   - Card shadow w dark mode

**Rezultat**: Fully responsive empty state

---

### Krok 11: Edge cases handling

**Zadania**:

1. Obsługa race condition:
   - Scenariusz: Użytkownik ma otwarte 2 zakładki, tworzy plan w jednej
   - Current MVP behavior: Manual refresh needed w drugiej zakładce (acceptable)
   - Future enhancement: Cache invalidation przez BroadcastChannel API

2. Obsługa bardzo wolnego połączenia:

   ```typescript
   // W useStudyPlans hook - już zaimplementowane przez React Query
   useQuery({
     // ...
     staleTime: 5 * 60 * 1000,
     retry: 3,
   });

   // Optional: Dodatkowy feedback po 3s loading w CalendarView
   const [showSlowWarning, setShowSlowWarning] = useState(false);

   useEffect(() => {
     if (isLoading) {
       const timer = setTimeout(() => {
         setShowSlowWarning(true);
       }, 3000);
       return () => clearTimeout(timer);
     }
     setShowSlowWarning(false);
   }, [isLoading]);

   // UI:
   {isLoading && (
     <div className="flex flex-col items-center justify-center min-h-[60vh]">
       <LoadingSpinner label="Loading study plans..." />
       {showSlowWarning && (
         <p className="text-muted-foreground mt-4 text-sm">
           This is taking longer than usual...
         </p>
       )}
     </div>
   )}
   ```

3. Obsługa wygasłej sesji:

   ```typescript
   // W CalendarView lub global error handler
   useEffect(() => {
     if (isError && error?.message?.includes("401")) {
       // Session expired
       toast.error("Your session has expired. Please login again.");

       // Optional: Auto logout
       setTimeout(() => {
         window.location.href = "/login?returnUrl=/app/calendar";
       }, 2000);
     }
   }, [isError, error]);
   ```

4. Obsługa offline mode:
   - React Query automatycznie retry (3 próby)
   - Po 3 nieudanych próbach: ErrorState z informacją o problemie z połączeniem
   - User może kliknąć "Retry" button

**Rezultat**: Edge cases obsłużone w sposób przyjazny dla użytkownika

---

### Krok 12: Performance optimization

**Zadania**:

1. Wrap EmptyStateOnboarding w React.memo (jeśli needed):
   ```typescript
   export const EmptyStateOnboarding = memo(function EmptyStateOnboarding(...) {
     // ...
   });
   ```
2. Lazy load CalendarGrid (future):
   ```typescript
   const CalendarGrid = lazy(() => import("./CalendarGrid"));
   ```
3. Verify React Query cache działa:
   - Navigate away i back → no refetch (cache hit) ✓
   - After 5 min → automatic refetch (stale) ✓
4. Check bundle size:
   - Empty state components lightweight ✓
   - Icons tree-shaken (lucide-react) ✓

**Rezultat**: Optimized performance

---

### Krok 13: Documentation i cleanup

**Zadania**:

1. Dodaj JSDoc comments do komponentów:
   ```typescript
   /**
    * Empty State component displayed when user has no study plans
    * Shows welcome message and CTA to create first plan
    *
    * @example
    * <EmptyStateOnboarding />
    *
    * @example with custom handler
    * <EmptyStateOnboarding onCreateClick={customHandler} />
    */
   export function EmptyStateOnboarding({ onCreateClick }: EmptyStateOnboardingProps) {
     // ...
   }
   ```
2. Update README (jeśli applicable)
3. Remove console.logs i debug code
4. Verify no unused imports
5. Run linter i fix issues:
   ```bash
   npm run lint
   npm run lint:fix
   ```

**Rezultat**: Clean, documented code ready for production

---

## Podsumowanie kroków

1. ✅ Setup dependencies (React Query, shadcn, lucide-react)
2. ✅ Implement useStudyPlans hook
3. ✅ Create EmptyStateOnboarding component
4. ✅ Create LoadingSpinner component
5. ✅ Create CalendarView with conditional logic
6. ✅ Create ErrorState component
7. ✅ Setup QueryProvider
8. ✅ Create Astro calendar page
9. ✅ Implement auth middleware
10. ✅ Responsive styling
11. ✅ Edge cases handling
12. ✅ Performance optimization
13. ✅ Documentation

**Szacowany czas implementacji**: 3-5 godzin dla doświadczonego frontend developera

**Dependencies**:

- GET /api/study-plans endpoint musi być zaimplementowany
- Middleware auth protection musi działać
- AppLayout component musi istnieć
- shadcn/ui Card i Button muszą być skonfigurowane

**Output files**:

- `src/components/hooks/useStudyPlans.ts`
- `src/components/EmptyStateOnboarding.tsx`
- `src/components/LoadingSpinner.tsx`
- `src/components/ErrorState.tsx`
- `src/components/CalendarView.tsx`
- `src/components/providers/QueryProvider.tsx`
- `src/pages/app/calendar.astro`
- `src/middleware/index.ts` (jeśli nie istnieje)
