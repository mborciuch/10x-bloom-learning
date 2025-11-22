# POST /api/study-plans – test plan

## Happy paths
- **Create plan with valid payload**: `title`, `sourceMaterial` ~500 words, `wordCount` within 200-5000. Expect 201 + DTO with `pendingAiGeneration=false`, `status="active"`, trimmed `title`.
- **Title trimming**: Send `title` with leading/trailing spaces; response should return trimmed `title`.

## Validation failures
- **Missing fields**: Omit `title` or `sourceMaterial` → 400 `VALIDATION_ERROR`.
- **Empty strings**: Provide blank `title`/`sourceMaterial` → 400 `VALIDATION_ERROR`.
- **Word count bounds**: Provide `sourceMaterial` <200 or >5000 words → 400 with precise message.
- **Invalid wordCount type**: Send non-integer `wordCount` → 400 `VALIDATION_ERROR`.

## Conflict scenarios
- **Duplicate title**: Create plan, then repeat request with same `title` (case-insensitive) → 409 `CONFLICT`.

## Auth & security
- **No token**: Omit Authorization header → 401 `UNAUTHORIZED`.
- **Different user**: Ensure RLS restricts access by creating plan as User A, confirm User B cannot create duplicate due to isolation.

## System failures
- **Database error passthrough**: Simulate Postgres unique violation or FK error to verify consistent JSON error format.

> Manual execution blocked until Supabase credentials are configured in the environment; run scenarios via curl/Postman once env vars `SUPABASE_URL` and `SUPABASE_KEY` are available.

