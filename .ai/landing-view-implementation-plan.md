## Plan implementacji widoku Landing (Strona główna)

## 1. Przegląd

Landing page jest publicznym, statycznym widokiem aplikacji Bloom Learning dostępnym pod ścieżką `/`. Jego głównym celem jest jasne przedstawienie problemu (czasochłonne, ręczne planowanie nauki), propozycji wartości produktu (AI-first, kalendarz jako centrum nauki) oraz poprowadzenie użytkownika do rozpoczęcia pracy z aplikacją poprzez wyraźne CTA: rejestrację i logowanie. Widok nie komunikuje się bezpośrednio z API – prezentuje marketingowy opis funkcji, proces nauki w kilku krokach oraz linki prowadzące do chronionych części aplikacji.

## 2. Routing widoku

- **Ścieżka**: `/`
- **Typ strony**: publiczna, statyczna (SSG)
- **Plik strony**: `src/pages/index.astro`
- **Layout**:
  - Jeżeli istnieje wspólny layout publiczny – używamy np. `src/layouts/PublicLayout.astro`.
  - Jeśli nie istnieje – w ramach wdrożenia tego widoku tworzymy `PublicLayout`, który stanie się bazowym layoutem dla `/`, `/login`, `/register`.
- **Nawigacja z widoku**:
  - CTA „Załóż konto” → link do `/register`.
  - CTA „Zaloguj się” → link do `/login`.
  - Ewentualne linki w stopce → do innych stron statycznych (np. Polityka prywatności – placeholder).

## 3. Struktura komponentów

Hierarchia komponentów dla landing page (wysokopoziomowo):

- `index.astro` (LandingPage)
  - `PublicLayout` (Astro layout – wrapper dla publicznych stron)
    - `<header>` – prosty pasek nawigacyjny:
      - Logo (link do `/`)
      - Nawigacja:
        - Link „Zaloguj się” (`/login`)
        - Link „Załóż konto” (`/register`)
    - `<main>`
      - `HeroSection`
      - `FeaturesGrid`
      - `HowItWorksSection`
    - `<footer>`
      - `LandingFooter`

Wszystkie sekcje mogą być zaimplementowane jako komponenty Astro (bez konieczności hydratacji React), korzystające z Tailwind 4 i komponentów shadcn/ui (np. `Button`) tam, gdzie potrzebne są spójne przyciski.

## 4. Szczegóły komponentów

### 4.1. `PublicLayout`

- **Opis komponentu**: Layout dla wszystkich publicznych stron (`/`, `/login`, `/register`). Odpowiada za wspólną strukturę HTML, nagłówek z nawigacją i stopkę, zachowując spójny branding.
- **Główne elementy**:
  - Semantyczny szkielet:
    - `<html>`, `<body>`
    - `<header>` z logo i prostą nawigacją (`<nav aria-label="Główna nawigacja publiczna">`).
    - `<main id="main-content">` – zawartość właściwa strony (slot/children).
    - `<footer>` – przekazany `LandingFooter` lub wersja ogólna.
  - W nagłówku:
    - Logo (tekstowe lub graficzne) – `<a href="/">Bloom Learning</a>`.
    - Linki:
      - „Zaloguj się” → `<a href="/login">`.
      - „Załóż konto” → `<a href="/register">` z wyróżnionym stylem (primary).
- **Obsługiwane interakcje**:
  - Kliknięcia linków nawigacyjnych – standardowa nawigacja po stronie.
- **Obsługiwana walidacja**:
  - Brak walidacji domenowej; jedynie:
    - Poprawne atrybuty `aria-label` i `aria-current="page"` (jeśli chcemy oznaczyć aktualny widok).
    - Zapewnienie, że `href` wskazuje istniejące ścieżki.
- **Typy**:
  - `PublicLayoutProps`:
    - `title?: string` – tytuł strony do ustawienia w `<title>` (opcjonalnie).
    - `children: Astro.slots.default` – zawartość główna.
- **Propsy**:
  - `title?` – pozwala nadpisać tytuł w `<head>`.
  - `children` – główna zawartość (np. `HeroSection`, `FeaturesGrid`, ...).

### 4.2. `HeroSection`

- **Opis komponentu**: Główny hero na stronie, prezentujący najważniejszą wartość produktu, krótki opis oraz dwa główne przyciski akcji (rejestracja, logowanie). To kluczowy element prowadzący do realizacji US-001 i US-002.
- **Główne elementy**:
  - Sekcja semantyczna: `<section aria-labelledby="hero-heading">`.
  - Nagłówek H1 – główna propozycja wartości, np. „Planuj powtórki mądrzej z pomocą AI”.
  - Podtytuł (H2/H3 lub `<p>` z klasą tytułu) – krótko opisuje, jak Bloom rozwiązuje problem opisany w PRD.
  - CTA:
    - Primary CTA: shadcn `Button` w wariancie `default` / `primary` z tekstem typu „Załóż darmowe konto”, opakowany w `<a href="/register">`.
    - Secondary CTA: `Button` w wariancie `outline`/`secondary` z tekstem „Zaloguj się”, opakowany w `<a href="/login">`.
  - Dodatkowe elementy opcjonalne:
    - Krótka lista korzyści („AI‑generowane powtórki”, „Kalendarz jako centrum nauki”, itd.).
    - Ilustracja / mockup interfejsu (z `alt` opisującym zawartość).
- **Obsługiwane interakcje**:
  - Kliknięcie primary CTA → przejście na `/register`.
  - Kliknięcie secondary CTA → przejście na `/login`.
- **Obsługiwana walidacja**:
  - Brak walidacji danych – to sekcja informacyjna. Dbałość o:
    - Poprawną hierarchię nagłówków (jeden H1 na stronie).
    - Zapewnienie, że CTA są dostępne z klawiatury i mają odpowiedni kontrast.
- **Typy**:
  - `HeroCta`:
    - `label: string`
    - `href: string`
    - `variant: "primary" | "secondary"`
    - `ariaLabel?: string`
  - `HeroContent`:
    - `title: string`
    - `subtitle: string`
    - `primaryCta: HeroCta`
    - `secondaryCta?: HeroCta`
- **Propsy** (interface komponentu):
  - `content: HeroContent` – pełna konfiguracja hero; w MVP możemy wypełnić ją stałą w tym samym pliku, ale interfejs przygotowujemy na przyszłe modyfikacje.

### 4.3. `FeaturesGrid`

- **Opis komponentu**: Sekcja prezentująca 3–4 kluczowe funkcje Bloom Learning. Ma w prosty sposób komunikować, co konkretnie użytkownik zyska.
- **Główne elementy**:
  - `<section aria-labelledby="features-heading">`.
  - Nagłówek H2 (np. „Co zyskasz z Bloom Learning?”).
  - Grid kart (Tailwind responsive grid):
    - Każda karta:
      - Ikona (SVG lub ikonka z biblioteki).
      - Tytuł funkcji (H3).
      - Krótki opis (1–2 zdania).
- **Obsługiwane interakcje**:
  - Brak interakcji beyond standard hover/focus (podświetlenie kart).
- **Obsługiwana walidacja**:
  - W warstwie kodu: zapewnienie, że lista funkcji nie jest pusta (min. 3) – statycznie.
  - A11y:
    - Ikony z `aria-hidden="true"` jeśli dekoracyjne.
    - Dobrze opisane nagłówki i treść.
- **Typy**:
  - `LandingFeature`:
    - `id: string`
    - `title: string`
    - `description: string`
    - `icon?: React.ReactNode | string`
  - `FeaturesGridProps`:
    - `features: LandingFeature[]`
- **Propsy**:
  - `features` – tablica opisów funkcji; w MVP zasilana stałą w tym samym module.

### 4.4. `HowItWorksSection`

- **Opis komponentu**: Sekcja opisująca proces korzystania z aplikacji w 3 krokach (zgodnie z ui-plan: proces nauki w 3 krokach). Pomaga zrozumieć, jak landing łączy się z dalszym flow (wiąże się z user journey w PRD).
- **Główne elementy**:
  - `<section id="how-it-works" aria-labelledby="how-heading">`.
  - Nagłówek H2 (np. „Jak działa Bloom Learning?”).
  - Lista 3 kroków:
    - Numer kroku (1, 2, 3).
    - Tytuł (H3).
    - Krótki opis (1–2 zdania, odwołujące się do tworzenia planu, generowania powtórek AI, pracy z kalendarzem).
  - Może być implementowana jako:
    - Numerowana lista `<ol>` z `<li>`.
    - Lub 3 karty w gridzie z wyróżnionym numerem.
- **Obsługiwane interakcje**:
  - Opcjonalnie przycisk „Rozpocznij teraz” na końcu sekcji → link do `/register`.
  - Możliwość przewinięcia do tej sekcji po kliknięciu linku w hero (anchor link).
- **Obsługiwana walidacja**:
  - W kodzie zapewniamy dokładnie 3 kroki (tablica o długości 3).
  - A11y:
    - Prawidłowe użycie `<ol>` jeśli chcemy zachować semantykę „krok po kroku”.
- **Typy**:
  - `LearningStep`:
    - `id: string`
    - `stepNumber: number` (1–3)
    - `title: string`
    - `description: string`
  - `HowItWorksProps`:
    - `steps: LearningStep[]`
- **Propsy**:
  - `steps` – tablica kroków; wypełniana w pliku komponentu lub w `index.astro`.

### 4.5. `LandingFooter`

- **Opis komponentu**: Stopka strony landing (i potencjalnie innych publicznych stron) z podstawowymi linkami i informacją o prawach autorskich.
- **Główne elementy**:
  - `<footer>` z:
    - Tekstem typu „© {rok} Bloom Learning. Wszelkie prawa zastrzeżone.”
    - Listą linków (np. „Polityka prywatności”, „Kontakt” – na początku mogą być placeholderami).
  - Layout responsywny (stack na mobile, wiersz na desktop).
- **Obsługiwane interakcje**:
  - Kliknięcia linków stopki – standardowa nawigacja.
- **Obsługiwana walidacja**:
  - Brak walidacji domenowej.
  - A11y:
    - Semantyczny `<footer>` i ewentualnie `<nav aria-label="Linki w stopce">`.
- **Typy**:
  - `FooterLink`:
    - `label: string`
    - `href: string`
    - `external?: boolean`
  - `FooterProps`:
    - `links: FooterLink[]`
    - `copyrightLabel: string`
- **Propsy**:
  - `links` – lista linków; w MVP statyczna.
  - `copyright`.

## 5. Typy

Poniżej zestaw typów wymaganych do implementacji widoku (wszystkie są typami ViewModel dla komponentów landing, niezależnymi od domenowych DTO z `src/types.ts`).

- **`HeroCta`**
  - `label: string` – tekst przycisku, np. „Załóż darmowe konto”.
  - `href: string` – ścieżka docelowa (`/register`, `/login`).
  - `variant: "primary" | "secondary"` – wariant stylu przycisku, mapowany na klasy Tailwind / prop `variant` w shadcn `Button`.
  - `ariaLabel?: string` – nadpisanie tekstu dla czytników ekranowych (opcjonalne).

- **`HeroContent`**
  - `title: string` – główny nagłówek strony (H1).
  - `subtitle: string` – krótkie objaśnienie produktu.
  - `primaryCta: HeroCta` – konfiguracja głównego CTA („Załóż konto”).
  - `secondaryCta?: HeroCta` – opcjonalne drugie CTA („Zaloguj się”).

- **`LandingFeature`**
  - `id: string` – unikalny identyfikator (np. `"ai-plans"`).
  - `title: string` – nazwa funkcji, np. „Plany zasilane AI”.
  - `description: string` – opis funkcji, 1–2 zdania.
  - `icon?: React.ReactNode | string` – ikona, jeśli używamy komponentów ikon; może być `null`.

- **`FeaturesGridProps`**
  - `features: LandingFeature[]` – lista funkcji; oczekujemy min. 3 elementów.

- **`LearningStep`**
  - `id: string` – identyfikator (np. `"step-create-plan"`).
  - `stepNumber: number` – numer kroku (1–3).
  - `title: string` – tytuł kroku.
  - `description: string` – opis opisujący, co użytkownik robi w tym kroku.

- **`HowItWorksProps`**
  - `steps: LearningStep[]` – dokładnie 3 kroki procesu.

- **`FooterLink`**
  - `label: string` – tekst linku.
  - `href: string` – adres URL (może być ścieżką lokalną lub pełnym URL-em).
  - `external?: boolean` – jeśli `true`, otwieramy w nowej karcie i dodajemy `rel="noopener noreferrer"`.

- **`FooterProps`**
  - `links: FooterLink[]` – lista linków.
  - `copyrightLabel: string`.

Wszystkie te typy mogą zostać zdefiniowane lokalnie w plikach komponentów (`.tsx`) lub w osobnym module `src/components/landing/landing.types.ts`. Nie wymagają zmian w `src/types.ts`.

## 6. Zarządzanie stanem

- **Zakres stanu w widoku Landing**:
  - Widok jest w pełni statyczny (SSG) i nie pobiera danych z API.
  - Główna zawartość (tekst, listy funkcji, kroki) jest zakodowana jako stałe w kodzie (tablice `features`, `steps`, `heroContent`).
- **Stan lokalny (opcjonalny)**:
  - Ewentualny stan lokalny może dotyczyć:
    - Prostej logiki UI (np. rozwijane opisy funkcji, przełączanie zakładek – nie jest wymagane w MVP).
    - Smooth scroll do sekcji „Jak to działa” po kliknięciu linku w hero – można zrealizować przez prosty handler JS lub anchor link bez stanu.
- **Custom hooki**:
  - W MVP nie są konieczne żadne custom hooki dla landing page.
  - Jeżeli w trakcie projektowania pojawi się potrzeba (np. reużywalny `useScrollToSection`), można dodać:
    - `useScrollToSection(sectionId: string)` – wrapper na `document.getElementById(sectionId)?.scrollIntoView`.
  - Ze względu na minimalizację JS i wydajność preferujemy na start zwykły anchor `href="#how-it-works"`.

## 7. Integracja API

- **Bezpośrednie wywołania API**:
  - Landing page **nie wykonuje żadnych wywołań** do endpointów REST opisanych w `.ai/api-plan.md`.
  - Brak DTO domenowych w tym widoku.
- **Integracja „pośrednia”**:
  - Linki do widoków, które już komunikują się z API (login, rejestracja, aplikacja):
    - `href="/register"` – użytkownik przechodzi do widoku rejestracji, który korzysta z Supabase Auth.
    - `href="/login"` – użytkownik przechodzi do widoku logowania.
  - Wymogi security:
    - Cała aplikacja, w tym landing, działa wyłącznie po HTTPS.
    - Brak wstrzykiwania danych użytkownika lub dynamicznego HTML pochodzącego z zewnątrz → minimalne ryzyko XSS.

## 8. Interakcje użytkownika

- **Wejście na `/`**:
  - Użytkownik widzi:
    - Hero z jasnym H1 i CTA.
    - Sekcję funkcji (`FeaturesGrid`).
    - Sekcję „Jak to działa” (`HowItWorksSection`).
    - Stopkę.
- **Kliknięcie „Załóż konto” w HeroSection**:
  - Oczekiwany wynik: przeglądarka przechodzi na `/register`.
  - Z punktu widzenia user stories: start ścieżki US-001 (Rejestracja).
- **Kliknięcie „Zaloguj się” w nagłówku lub hero**:
  - Oczekiwany wynik: przejście na `/login`.
  - Start ścieżki US-002 (Logowanie).
- **Kliknięcie linku „Jak to działa” (jeśli dodamy w hero/linku w nagłówku)**:
  - `href="#how-it-works"` – przeglądarka przewija stronę do sekcji `HowItWorksSection`.
- **Nawigacja klawiaturą**:
  - `Tab` przechodzi przez kolejne linki i przyciski.
  - `Enter` aktywuje aktualnie fokusowany element.
  - Widoczne focus outlines (Tailwind + focus-visible).

## 9. Warunki i walidacja

Ponieważ landing nie posiada formularzy, warunki i walidacja dotyczą głównie struktury UI oraz dostępności:

- **Hierarchia nagłówków**:
  - Dokładnie jeden H1 w `HeroSection`.
  - H2 dla sekcji („Kluczowe funkcje”, „Jak to działa”).
  - H3 w kartach (`FeaturesGrid`, kroki w `HowItWorksSection`).
- **Semantyka HTML**:
  - `header`, `main`, `section`, `footer`, `nav`.
  - Atrybuty ARIA tam, gdzie są potrzebne:
    - `aria-label` dla nawigacji.
    - `aria-labelledby` dla sekcji.
- **Alt text dla obrazów**:
  - Każdy obraz/ilustracja w hero ma opisowy `alt`.
  - Dekoracyjne ikony mają `aria-hidden="true"` i puste `alt=""` (jeśli <img>).
- **Kontrast i rozmiary klikalnych elementów**:
  - CTA i linki spełniają WCAG AA (kontrast ≥ 4.5:1).
  - Przycisk CTA ma wystarczający rozmiar (min. 44x44px na mobile).
- **Nawigacja**:
  - Focus nie jest wyłączony; outline jest widoczny.
- **Linki**:
  - `href` wskazuje poprawne ścieżki (`/login`, `/register`).
  - Dla zewnętrznych linków w stopce ustawiamy `target="_blank"` i `rel="noopener noreferrer"`.

## 10. Obsługa błędów

- **Błędy na poziomie network/server**:
  - Ponieważ landing jest statyczną stroną generowaną w build-time, nie ma specyficznej obsługi błędów HTTP w jej logice. Potencjalne 404/500 są obsługiwane globalnie przez konfigurację Astro/hostingu.
- **Błędy zasobów statycznych (np. brak obrazka)**:
  - Layout nie powinien się „rozsypać” – obrazy używane jako uzupełnienie, nie główny content.
  - Alt text zapewnia sensowny fallback dla czytników ekranowych.
- **Błędy JS**:
  - Widok powinien być funkcjonalny nawet przy wyłączonym JS:
    - Linki CTA są zwykłymi `<a>`.
    - Brak krytycznej logiki opartej wyłącznie o JS.
- **Błędne ścieżki**:
  - W fazie implementacji zadbać, by `/login` i `/register` były poprawnie zdefiniowanymi trasami.

## 11. Kroki implementacji

1. **Przygotowanie layoutu publicznego**  
   1.1. Sprawdź, czy w projekcie istnieje layout dla stron publicznych (np. `PublicLayout`).  
   1.2. Jeśli nie istnieje, utwórz `src/layouts/PublicLayout.astro` z semantycznym szkieletem (`header`, `main`, `footer`) oraz prostym nagłówkiem z logo i linkami „Zaloguj się” / „Załóż konto”.  
   1.3. Zadbaj o podstawowe style Tailwind (kontener, max-width, padding, tło, typografia) oraz dostępność (`nav aria-label`, skip link do `#main-content`).

2. **Utworzenie strony `index.astro`**  
   2.1. Stwórz plik `src/pages/index.astro`.  
   2.2. Zaimportuj i użyj `PublicLayout` jako wrappera (np. `<PublicLayout title="Bloom Learning - Ucz się mądrzej">...</PublicLayout>`).  
   2.3. Wewnątrz `PublicLayout` umieść sekcje: `HeroSection`, `FeaturesGrid`, `HowItWorksSection`, `LandingFooter`.  
   2.4. Upewnij się, że strona jest generowana statycznie (bez zależności od request-time).

3. **Implementacja `HeroSection`**  
   3.1. Utwórz komponent (np.) `src/components/landing/HeroSection.astro`.  
   3.2. Zdefiniuj stałą `heroContent` zgodną z typem `HeroContent` (title, subtitle, primaryCta, secondaryCta).  
   3.3. Zbuduj layout sekcji: główny H1, opis, dwa przyciski CTA (shadcn `Button` + `a href`), opcjonalnie ilustracja/makieta interfejsu.  
   3.4. Dodaj klasy Tailwind zapewniające responsywność (stack na mobile, grid/flex na desktop).  
   3.5. Zadbaj o dostępność: `aria-labelledby`, alt text dla obrazka, odpowiedni kontrast przycisków.

4. **Implementacja `FeaturesGrid`**  
   4.1. Utwórz `src/components/landing/FeaturesGrid.astro`.  
   4.2. Zdefiniuj tablicę `features: LandingFeature[]` z 3–4 elementami opisującymi: - Automatyczne generowanie powtórek przez AI.  
    - Widok kalendarza jako centrum nauki.  
    - Manualne dodawanie powtórek.  
    - Kontrolę użytkownika nad planem.  
   4.3. Zaimplementuj nagłówek H2 i grid kart (Tailwind: np. `grid-cols-1 md:grid-cols-2 lg:grid-cols-4`).  
   4.4. Zadbaj o semantykę (sekcja z `aria-labelledby`, karty jako `<article>`).

5. **Implementacja `HowItWorksSection`**  
   5.1. Utwórz `src/components/landing/HowItWorksSection.astro`.  
   5.2. Zdefiniuj tablicę `steps: LearningStep[]` opisującą 3 kroki, np.:  
    1. „Stwórz plan nauki” (wklej materiał, zachowaj jako Plan).  
    2. „Wygeneruj powtórki AI” (wybierz liczbę i poziomy Blooma).  
    3. „Ucz się z kalendarzem” (realizuj sesje, oznaczaj jako ukończone).  
   5.3. Wyrenderuj kroki jako numerowaną listę `<ol>` lub karty z wyróżnionym numerem.  
   5.4. Dodaj anchor `id="how-it-works"` do sekcji i ewentualny link w hero/ headerze, który do niej przewinie (`href="#how-it-works"`).  
   5.5. Zadbaj o czytelny układ na mobile i desktop (stack vs. grid).

6. **Implementacja `LandingFooter`**  
   6.1. Utwórz `src/components/landing/LandingFooter.astro`.  
   6.2. Zdefiniuj tablicę `links: FooterLink[]` (np. placeholder „Polityka prywatności”, „Kontakt”).  
   6.3. Zbuduj prosty układ stopki z tekstem © i listą linków.  
   6.4. Upewnij się, że linki zewnętrzne mają `target="_blank"` i `rel="noopener noreferrer"`.

7. **Integracja komponentów w `index.astro`**  
   7.1. Zaimportuj wszystkie komponenty landing i umieść je w odpowiedniej kolejności w `PublicLayout`.  
   7.2. Upewnij się, że nie są hydratowane JS-em (czysty Astro/HTML), chyba że dodasz reużywalny komponent React (np. shadcn `Button` jako React) – wtedy użyj selektywnej hydratacji (`client:load` tylko tam, gdzie to konieczne).  
   7.3. Sprawdź, że ścieżki CTA (`/login`, `/register`) działają poprawnie.

8. **Stylowanie i responsywność**  
   8.1. Dostosuj klasy Tailwind tak, aby layout dobrze wyglądał na mobile, tablet i desktop (zgodnie z ogólną strategią responsywności w UI-plan).  
   8.2. Zadbaj o czytelną typografię, marginesy, odstępy między sekcjami, maksymalną szerokość treści (np. `max-w-5xl mx-auto`).  
   8.3. Przetestuj wygląd w typowych viewportach (np. 375px, 768px, 1024px).

9. **Dostępność i UX**  
   9.1. Zweryfikuj hierarchię nagłówków (jeden H1, logiczne H2/H3).  
   9.2. Sprawdź nawigację klawiaturą (Tab/Shift+Tab) – wszystkie CTA są osiągalne i mają widoczny focus.  
   9.3. Zweryfikuj alt texty, użycie ARIA (`aria-label` dla nav, `aria-labelledby` dla sekcji).  
   9.4. Przetestuj kontrast tekstu i przycisków (np. Lighthouse/axe).

10. **Testy i weryfikacja**  
    10.1. Ręcznie przetestuj pełny flow użytkownika:  
     - Wejście na `/` → kliknięcie „Załóż konto” → `/register`.  
     - Wejście na `/` → kliknięcie „Zaloguj się” → `/login`.  
     - Kliknięcie linku do sekcji „Jak to działa” (jeśli dodany) → przewinięcie do sekcji.  
    10.2. Uruchom audyt Lighthouse dla strony `/` (zwłaszcza Performance, Accessibility, Best Practices).  
    10.3. W razie potrzeby dopracuj stylowanie i strukturę HTML, aby spełnić metryki jakościowe.

11. **Porządki i dokumentacja**  
    11.1. Upewnij się, że nowo dodane pliki komponentów znajdują się w `src/components/landing` i są nazwane spójnie (`HeroSection`, `FeaturesGrid`, itd.).  
    11.2. Zaktualizuj ewentualną dokumentację projektową (jeśli istnieje sekcja opisująca widoki) o informację, że landing został zaimplementowany zgodnie z tym planem.  
    11.3. Sprawdź, czy nie zostały wprowadzone zbędne zależności lub nieużywany kod.
