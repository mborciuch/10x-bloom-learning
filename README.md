# 10x Astro Starter

A modern, opinionated starter template for building fast, accessible, and AI-friendly web applications.

## Tech Stack

- [Astro](https://astro.build/) v5.5.5 - Modern web framework for building fast, content-focused websites
- [React](https://react.dev/) v19.0.0 - UI library for building interactive components
- [TypeScript](https://www.typescriptlang.org/) v5 - Type-safe JavaScript
- [Tailwind CSS](https://tailwindcss.com/) v4.0.17 - Utility-first CSS framework

## Testing Stack

### Unit / Integration (TypeScript)

- [Vitest](https://vitest.dev/) - test runner for TypeScript/JS
- [Testing Library](https://testing-library.com/) - component and DOM-focused testing
- [MSW](https://mswjs.io/) - network mocking for frontend hooks/API clients (optional)

### E2E (Browser)

- [Playwright](https://playwright.dev/) - end-to-end tests (UI + API via request context)
- [axe-core](https://github.com/dequelabs/axe-core) - accessibility checks (optional, recommended)

## Prerequisites

- Node.js v22.14.0 (as specified in `.nvmrc`)
- npm (comes with Node.js)

## Getting Started

1. Clone the repository:

```bash
git clone https://github.com/przeprogramowani/10x-astro-starter.git
cd 10x-astro-starter
```

2. Install dependencies:

```bash
npm install
```

3. Run the development server:

```bash
npm run dev
```

4. Build for production:

```bash
npm run build
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run format` - Format files with Prettier
- `npm run test` - Run Vitest in CI mode once
- `npm run test:watch` - Watch files with Vitest for rapid feedback
- `npm run test:ui` - Inspect suites in the Vitest UI
- `npm run test:coverage` - Generate V8 coverage reports (`coverage/unit`)
- `npm run test:e2e` - Execute Playwright Chromium suite
- `npm run test:e2e:ui` - Explore tests via Playwright UI
- `npm run test:e2e:debug` - Launch headed Chromium for step-by-step debugging
- `npm run test:e2e:codegen` - Use Playwright codegen to bootstrap new specs

## Testing Workflow

### Unit & integration (Vitest)

- `vitest.config.ts` runs against jsdom, loads global matchers via `src/tests/setup.ts`, and enforces V8 coverage thresholds (75/70/65/75).
- Prefer the `vi` helpers for doubles (`vi.fn`, `vi.spyOn`, `vi.mock`) and keep shared mocks in the setup file when multiple suites reuse them.
- Inline snapshots are supported out-of-the-box; run `npm run test:watch -t "<name>"` for instant feedback while editing a single case.
- Type checking for specs relies on `tsconfig.vitest.json`, so TypeScript catches unsupported globals before execution.

### E2E (Playwright)

- `playwright.config.ts` defines a single Chromium/Desktop Chrome project, records traces/videos on failure, and can auto-start the Astro dev server (it uses `npm run dev:e2e` so `.env.test` is loaded automatically unless `PLAYWRIGHT_SKIP_WEBSERVER=1`).
- Page Object Model lives under `tests/e2e/page-objects/`; reuse these classes to keep selectors resilient and interactions isolated.
- Use `npm run test:e2e:ui` or `npm run test:e2e:debug` when you need the inspector/trace viewer, and `npm run test:e2e:codegen` to scaffold new flows.
- Visual assertions (`expect(page).toHaveScreenshot()`) are ready to use—commit golden images under `tests/e2e/__screenshots__` when you add them.

#### Test credentials

Playwright loads `.env.test` (see `playwright.config.ts`) so you can provide dedicated credentials without touching `.env`. Populate the following variables before running the onboarding flow or any spec that requires an authenticated user:

```
E2E_USERNAME_ID=<supabase-user-id>
E2E_USERNAME=<email used on the login form>
E2E_PASSWORD=<password>
```

The `tests/e2e/support/e2eUser.ts` helper throws a descriptive error if any of these values are missing, preventing false-positive runs with blank credentials.

## Project Structure

```md
.
├── src/
│ ├── layouts/ # Astro layouts
│ ├── pages/ # Astro pages
│ │ └── api/ # API endpoints
│ ├── components/ # UI components (Astro & React)
│ └── assets/ # Static assets
├── public/ # Public assets
```

## AI Development Support

This project is configured with AI development tools to enhance the development experience, providing guidelines for:

- Project structure
- Coding practices
- Frontend development
- Styling with Tailwind
- Accessibility best practices
- Astro and React guidelines

### Cursor IDE

The project includes AI rules in `.cursor/rules/` directory that help Cursor IDE understand the project structure and provide better code suggestions.

### GitHub Copilot

AI instructions for GitHub Copilot are available in `.github/copilot-instructions.md`

### Windsurf

The `.windsurfrules` file contains AI configuration for Windsurf.

## Contributing

Please follow the AI guidelines and coding practices defined in the AI configuration files when contributing to this project.

## License

MIT

TEST PR
