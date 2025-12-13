Frontend - Astro z React dla komponentów Interaktywnych:
- Astro 5 pozwala na tworzenie szybkich, wydajnych stron in aplikacji z minimalną ilością Javascript
- React 19 zapewni interaktywnośc tam, gdzie jest potrzebna
- Tyypescript 5 dla statycznego typowania kodu i lepszego wsparcia IDE
- Tailwing 4 pozwala na wygodne stylowanie aplikacji
- Shadcn/ui zapewnia bibliotekę dostępnych komponentów React, na którym oprzemy UI

Backend - Supabase jako kompleksowe roziązanie backendowe:
- Zapewnia bazę danych PostgresQL
- Zapewnia SDK w wielu językach, które posłużą jako Backend-as-a-Service
- Jest rozwiązaniem open-source, które można hostować lokalnie lub na własnym serwerze
- Posiada wbudowaną autenykację uzytkowników

AI - komunikacja z modelam i przez usługe Openrouter.ai:
- Dostęp do szerokiej gamy modeli (OpenAI, Anthropic, Google i wiele innych), które pozwolą nam znaleźć rozwiżanie zapewniające wysokoą efektywność i niskie koszta
- Pozwala na ustawianie limitów finansowych na klucze API

CI/CI i Hosting:
- Github Actions do tworzenia pipelinów CI/CD
- DigitalOCean do hostowania aplikacji za pośrednictwem obrazu Docker

Testy jednostkowe i integracyjne (TypeScript):
- Vitest - runner testów jednostkowych/integracyjnych dla TS/JS
- Testing Library - testy komponentów React i zachowań UI (DOM-first)
- MSW (Mock Service Worker) - mockowanie warstwy sieciowej (hooki/fetch) w testach (opcjonalnie)

Testy E2E (end-to-end):
- Playwright - testy end-to-end w przeglądarce (UI + testy API przez request context)
- axe-core - automatyczne testy dostępności (a11y) jako smoke test (opcjonalnie, rekomendowane)