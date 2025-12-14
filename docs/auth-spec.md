# Specyfikacja Techniczna: Moduł Autentykacji (Rejestracja, Logowanie, Odzyskiwanie Hasła)

## Wstęp

Niniejszy dokument definiuje architekturę techniczną modułu uwierzytelniania dla aplikacji 10x Bloom Learning. Specyfikacja opiera się na wymaganiach funkcjonalnych zawartych w PRD (US-001, US-002) oraz istniejącym stacku technologicznym (Astro 5, React 19, Supabase).

## 1. Architektura Interfejsu Użytkownika (UI)

### 1.1. Struktura Stron i Routing

Wymagane jest utworzenie nowych stron w katalogu `src/pages`, obsługiwanych przez Astro w trybie SSR (zgodnie z `output: "server"` w konfiguracji).

- **/login** (`src/pages/login.astro`)
  - **Layout:** `PublicLayout`.
  - **Cel:** Formularz logowania dla powracających użytkowników.
  - **Logika SSR:** Przekierowanie na `/app` jeśli użytkownik posiada już aktywną sesję.
- **/register** (`src/pages/register.astro`)
  - **Layout:** `PublicLayout`.
  - **Cel:** Formularz rejestracji nowego konta.
  - **Logika SSR:** Przekierowanie na `/app` jeśli użytkownik posiada już aktywną sesję.
- **/forgot-password** (`src/pages/forgot-password.astro`)
  - **Layout:** `PublicLayout`.
  - **Cel:** Formularz inicjujący procedurę resetu hasła (wysyłka email).
- **/auth/callback** (`src/pages/api/auth/callback.ts` lub `src/pages/auth/callback.astro`)
  - **Cel:** Endpoint lub strona pośrednia do obsługi potwierdzeń email oraz wymiany kodu autoryzacyjnego (PKCE) na sesję.

### 1.2. Komponenty React (Client-Side)

Ze względu na interaktywność formularzy i walidację w czasie rzeczywistym, formularze będą implementowane jako komponenty React („Islands”) z dyrektywą `client:load`.

Lokalizacja: `src/components/auth/`

1.  **LoginForm.tsx**
    - Wykorzystuje `react-hook-form` oraz `zod` do walidacji.
    - Pola: Email, Hasło.
    - Akcje:
      - `onSubmit`: Wywołanie `supabase.auth.signInWithPassword`.
      - Obsługa błędów: Wyświetlenie komunikatu z `sonner` (Toast) oraz inline przy polach formularza.
      - Sukces: Przekierowanie do `/app` (lub `returnUrl`).
2.  **RegisterForm.tsx**
    - Wykorzystuje `react-hook-form` oraz `zod`.
    - Pola: Email, Hasło, Potwierdzenie hasła.
    - Walidacja: Hasło min. 8 znaków, zgodność haseł.
    - Akcje:
      - `onSubmit`: Wywołanie `supabase.auth.signUp`.
      - Sukces: Wyświetlenie komunikatu o konieczności potwierdzenia adresu email (jeśli włączone potwierdzanie) lub automatyczne logowanie.
3.  **ResetPasswordForm.tsx**
    - Formularz proszący o email.
    - Akcje: `supabase.auth.resetPasswordForEmail`.
4.  **UpdatePasswordForm.tsx**
    - Dostępny tylko dla zalogowanych (np. po kliknięciu w link resetujący).
    - Akcje: `supabase.auth.updateUser`.

### 1.3. Walidacja i Obsługa Błędów (Frontend)

- **Biblioteki:** `zod` do definicji schematów, `react-hook-form` do obsługi stanu formularza.
- **Scenariusze Błędów:**
  - _Invalid login credentials_: "Nieprawidłowy email lub hasło."
  - _User already exists_: "Użytkownik o podanym adresie email już istnieje."
  - _Weak password_: "Hasło musi mieć co najmniej 8 znaków."
  - _Rate limit_: "Zbyt wiele prób. Spróbuj ponownie później."
- **Feedback:** Użycie komponentu `Sonner` (Toaster) do powiadomień globalnych oraz komponentów `FormMessage` (z `shadcn/ui`) do błędów walidacji pól.

## 2. Logika Backendowa i API

Mimo, że Astro działa w trybie `output: "server"`, większość logiki autentykacji (logowanie, rejestracja) odbywa się bezpośrednio pomiędzy klientem (przeglądarką) a API Supabase. Rola backendu Astro (Server) ogranicza się do weryfikacji sesji i zarządzania ciasteczkami.

### 2.1. Aktualizacja Konfiguracji Supabase (Wymagane Zmiany)

Aby zapewnić prawidłowe działanie SSR (Server-Side Rendering) i ochrony tras, należy wprowadzić bibliotekę `@supabase/ssr` (jest to standard dla frameworków SSR jak Astro, zastępujący czyste `supabase-js` w kontekście zarządzania sesją po stronie serwera).

- **Klient Serwerowy:** Potrzebny do Middleware i API routes (dostęp do `context.cookies`).
- **Klient Przeglądarkowy:** Potrzebny do komponentów React (dostęp do `document.cookie`).

### 2.2. Endpointy API (Astro)

- **GET /api/auth/callback**
  - Odbiera `code` z URL (flow PKCE).
  - Wymienia kod na sesję używając `supabase.auth.exchangeCodeForSession(code)`.
  - Przekierowuje użytkownika do `/app`.
  - Obsługuje błędy i przekierowuje do `/login?error=...`.
- **POST /api/auth/signout**
  - Wylogowuje użytkownika po stronie serwera (czyszczenie ciasteczek).
  - Przekierowuje na stronę główną.

### 2.3. Modele Danych

- Wykorzystanie istniejących typów z `src/db/database.types.ts`.
- Schematy walidacji (`src/lib/validation/auth.schema.ts`):
  - `loginSchema`: email (email), password (min 6).
  - `registerSchema`: email (email), password (min 8), confirmPassword (match).

## 3. System Autentykacji i Middleware

### 3.1. Supabase Auth

- **Metoda:** Email & Password.
- **Flow:** PKCE (Proof Key for Code Exchange) – bezpieczniejszy standard dla aplikacji webowych.
- **Sesja:** Przechowywana w ciasteczkach (HttpOnly, Secure) zarządzanych przez `@supabase/ssr` lub customową implementację helperów, jeśli instalacja nowej paczki nie jest możliwa (zalecana instalacja).

### 3.2. Middleware (`src/middleware/index.ts`)

Należy zaktualizować istniejący middleware, aby aktywnie chronił zasoby aplikacji.

1.  **Inicjalizacja Klienta:** Utworzenie instancji klienta Supabase dla bieżącego żądania (Server Client).
2.  **Odświeżanie Sesji:** Wywołanie `supabase.auth.getUser()`. _Uwaga: W nowym modelu `@supabase/ssr` zarządzanie tokenami jest uproszczone, ale kluczowe jest, aby middleware przetwarzał odpowiedź, by odświeżyć ciasteczka._
3.  **Strażnik (Guard):**
    - Sprawdzenie ścieżki (`context.url.pathname`).
    - Jeśli ścieżka zaczyna się od `/app` ORAZ użytkownik nie jest zalogowany -> Przekierowanie na `/login`.
    - Jeśli ścieżka to `/login` lub `/register` ORAZ użytkownik JEST zalogowany -> Przekierowanie na `/app`.
4.  **Context Injection:** Przekazanie obiektu `user` oraz `supabase` do `context.locals`, aby były dostępne w stronach `.astro`.

### 3.3. Integracja Client-Server

- **Stan sesji:** Synchronizowany za pomocą ciasteczek. Akcje logowania w komponencie React (Client) ustawiają ciasteczka, które są następnie odczytywane przez Astro (Server) przy nawigacji.
- **Wylogowanie:** Musi wywołać API endpoint (`/api/auth/signout`) lub funkcję klienta, która wyczyści ciasteczka, a następnie przeładować stronę/nawigować, aby middleware zadziałał.

## Podsumowanie Implementacji

1.  **Instalacja:** Dodanie `@supabase/ssr`.
2.  **Lib:** Utworzenie helperów `createBrowserClient` i `createServerClient` w `src/lib/supabase/`.
3.  **Middleware:** Pełna implementacja ochrony tras w `src/middleware/index.ts`.
4.  **UI:** Implementacja stron `/login`, `/register` i komponentów formularzy w `src/components/auth/`.
5.  **API:** Dodanie endpointu callback.
