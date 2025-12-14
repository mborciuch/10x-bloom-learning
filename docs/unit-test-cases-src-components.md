# Test-case’y do unit testów (src/components)

Zestaw propozycji testów (Given / When / Then) dla logiki i UI w `src/components`. Pokrywa 5 obszarów:

- **Czyste funkcje / logika deterministyczna**
- **Schematy walidacji (Zod)**
- **Hooki (React Query / fetch)**
- **Komponenty UI z interakcją**
- **Mappery / transformacje danych**

## Czyste funkcje / logika deterministyczna

### 1) `generateCalendarDays()` – siatka zaczyna się w poniedziałek

- **Given**: `currentMonth = 2024-01-15`, `sessionsByDate = {}`
- **When**: `generateCalendarDays(currentMonth, {})`
- **Then**: pierwszy element ma `date` ustawioną na **poniedziałek** (weekStartsOn=1) i jest `<= startOfMonth(currentMonth)`

### 2) `generateCalendarDays()` – flagi `isCurrentMonth`

- **Given**: `currentMonth = 2024-01-15`
- **When**: `generateCalendarDays(currentMonth, {})`
- **Then**: dla dni od `startOfMonth` do `endOfMonth` w wyniku `isCurrentMonth === true`, a dla „dociągniętych” z sąsiednich miesięcy `isCurrentMonth === false`

### 3) `generateCalendarDays()` – podpinanie sesji po `YYYY-MM-DD`

- **Given**: `sessionsByDate["2024-01-10"] = [s1, s2]`
- **When**: generujesz dni dla stycznia 2024
- **Then**: dzień z datą `2024-01-10` ma `sessions === [s1, s2]`, a inne dni mają `[]`

### 4) `groupSessionsByDate()` – grupowanie wielu sesji w jednym dniu

- **Given**: 3 sesje: dwie z tą samą datą dzienną w `reviewDate`, jedna z inną
- **When**: `groupSessionsByDate(sessions)`
- **Then**: wynik ma 2 klucze, a pod wspólnym kluczem są 2 sesje w tablicy

### 5) `getCalendarDateRange()` – range spójny z gridem

- **Given**: `currentMonth = 2024-01-15`
- **When**: `getCalendarDateRange(currentMonth)`
- **Then**: `startDate` jest poniedziałkiem na/przed 1. dniem miesiąca, a `endDate` jest niedzielą na/po ostatnim dniu miesiąca (format `YYYY-MM-DD`)

### 6) `canNavigateMonth()` – limit ±5 lat (granice)

- **Given**: `currentMonth` ustawiony tak, by `targetMonth` był **dokładnie** 5 lat od dziś (w przód i w tył)
- **When**: `canNavigateMonth(currentMonth, "next")` oraz `"prev"`
- **Then**: zwraca **true** dla równo 5 lat i **false** dla 5 lat + „trochę” (np. +1 miesiąc)

## Schematy walidacji (Zod)

### 7) `addSessionSchema` – custom label wymagany i ma zakres 3–200

- **Given**: `exerciseType="custom"` i `customExerciseLabel=""` lub `"ab"`
- **When**: `addSessionSchema.safeParse(data)`
- **Then**: parse **fail**, a błąd jest na ścieżce `customExerciseLabel`
- **Given2**: `customExerciseLabel="My exercise"`
- **Then2**: parse **ok**

### 8) `addSessionSchema` – template wymaga `exerciseTemplateId`

- **Given**: `exerciseType="template"` bez `exerciseTemplateId`
- **When**: `safeParse`
- **Then**: parse **fail** z błędem na `exerciseTemplateId`
- **Given2**: poprawny UUID w `exerciseTemplateId`
- **Then2**: parse **ok**

### 9) `addSessionSchema` – pytania/odpowiedzi: max 50 i liczba musi się zgadzać

- **Given**: `questionsText` = 51 niepustych linii, `answersText` = 51 niepustych linii
- **When**: `safeParse`
- **Then**: parse **fail** na `questionsText` (max 50)
- **Given2**: `questionsText` = 2 pytania, `answersText` = 1 odpowiedź
- **Then2**: parse **fail** na `answersText` (mismatch)

### 13) `CreateStudyPlanFormSchema` – granica min 200 słów

- **Given**: `sourceMaterial` mający 199 słów + poprawny `title`
- **When**: `CreateStudyPlanFormSchema.safeParse(data)`
- **Then**: parse **fail** z komunikatem o min 200 słów
- **Given2**: 200 słów
- **Then2**: parse **ok**

### 14) `CreateStudyPlanFormSchema` – granica max 5000 słów

- **Given**: `sourceMaterial` mający 5001 słów + poprawny `title`
- **When**: `safeParse`
- **Then**: parse **fail** z komunikatem o max 5000 słów

## Hooki (React Query / fetch)

### 10) `useCalendarSessions()` – buduje URL i mapuje 401 na `UNAUTHORIZED`

- **Given**: `dateRange={startDate:"2024-01-01", endDate:"2024-01-31"}`, `planId="p1"`, `extraFilters={isCompleted:false, taxonomyLevel:"remember"}`
- **When**: odpalasz hook (z `QueryClientProvider`) i mockujesz `global.fetch`
- **Then**: `fetch` dostaje URL zawierający `dateFrom`, `dateTo`, `planId`, `isCompleted=false`, `taxonomyLevel=remember`
- **Given2**: `fetch` zwraca `status=401`
- **Then2**: hook kończy w error z `Error("UNAUTHORIZED")`

### 17) `useStudyPlans()` – happy path mapuje `Paginated.items`

- **Given**: `fetch("/api/study-plans")` zwraca `ok=true` i JSON `{ items: [p1, p2], ... }`
- **When**: odpalasz hook w teście (z `QueryClientProvider`)
- **Then**: `data` z hooka to dokładnie `[p1, p2]`

### 18) `useStudyPlans()` – 401 → `Error("UNAUTHORIZED")`

- **Given**: `fetch` zwraca `ok=false`, `status=401`
- **When**: hook wykonuje request
- **Then**: hook kończy w stanie error, a `error.message === "UNAUTHORIZED"`

### 19) `useStudyPlans()` – inne błędy → komunikat ogólny

- **Given**: `fetch` zwraca `ok=false`, `status=500`
- **When**: hook wykonuje request
- **Then**: `error.message === "Failed to fetch study plans"`

### 20) `useCalendarSessions()` – priorytet komunikatu z backendu

- **Given**: `fetch` zwraca `ok=false` i JSON `{ error: { message: "Rate limit" } }`
- **When**: hook wykonuje request
- **Then**: `error.message === "Rate limit"` (a nie ogólne `"Failed to fetch review sessions"`)

### 21) `groupSessionsByDate()` – edge case strefy czasowej / granica dnia (test „wykrywacz”)

- **Given**: `"2024-01-01T23:30:00.000Z"` i `"2024-01-02T00:30:00.000Z"`
- **When**: `groupSessionsByDate([a,b])`
- **Then**: oczekujesz **dwóch różnych kluczy** daty  
  (jeśli test będzie flaky, to sygnał, że warto ustandaryzować TZ w test runnerze lub w logice formatowania)

## Komponenty UI z interakcją

### 15) `CalendarDayCell` – overflow badge i liczba sesji

- **Given**: 4 sesje w propsach
- **When**: render komponentu
- **Then**: widoczny badge z liczbą `4` + wyrenderowane karty sesji

### 16) `CalendarDayCell` – interakcje: click + Enter wywołuje `onDayClick(date)`

- **Given**: `onDayClick=vi.fn()`, `date=baseDate`
- **When**: klik w `gridcell`, potem focus + `{Enter}`
- **Then**: `onDayClick` wywołany 2x z `baseDate`

## Mappery / transformacje danych

### 11) `mapToPlanCardViewModel()` – mapowanie pól 1:1

- **Given**: `StudyPlanListItemDto` z polami (`id`, `title`, `wordCount`, `status`, `createdAt`)
- **When**: `mapToPlanCardViewModel(plan)`
- **Then**: wynik ma te same wartości pól + `createdAtRelative` jest niepustym stringiem

### 12) `mapToPlanCardViewModels()` – mapuje tablicę i zachowuje kolejność

- **Given**: `[planA, planB, planC]`
- **When**: `mapToPlanCardViewModels(plans)`
- **Then**: długość wyniku = 3, a `result[0].id === planA.id` itd.
