# Contributing to ParkingLocator

Thanks for your interest in contributing. This guide covers everything you need to get a change from idea to merged PR.

---

## Table of Contents

- [Getting started](#getting-started)
- [Project structure](#project-structure)
- [Development workflow](#development-workflow)
- [Code style](#code-style)
- [Testing](#testing)
- [Submitting a pull request](#submitting-a-pull-request)
- [Commit message format](#commit-message-format)

---

## Getting started

Follow the [README](README.md) to get the app running locally before making any changes. All three pieces need to be working:

- Backend API responding at `http://localhost:8000`
- Frontend launching in Expo
- Both test suites passing (`pytest` and `npm test`)

---

## Project structure

```
ParkingLocator/
├── backend/               # FastAPI service
│   ├── main.py            # API endpoints
│   ├── models/parking.py  # Pydantic schemas
│   ├── services/          # Google Places / Geocoding integration
│   └── tests/             # pytest test suite
├── frontend/              # React Native (Expo) app
│   ├── App.tsx
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── screens/       # Full screens (MapScreen)
│   │   ├── services/      # API client (axios)
│   │   └── constants/     # Config (gitignored — use config.example.ts)
│   └── src/__tests__/     # Jest test suite
├── TEST_PLAN.md           # Testing strategy and test case catalogue
└── README.md
```

---

## Development workflow

1. **Fork and branch** — create a branch from `main` with a short descriptive name:
   ```bash
   git checkout -b feat/radius-slider
   git checkout -b fix/geocode-error-message
   ```

2. **Make your changes** — keep each PR focused on one thing.

3. **Run the tests** before pushing:
   ```bash
   # Backend
   cd backend && pytest

   # Frontend
   cd frontend && npm run test:ci
   ```

4. **Run the app** and verify your change works end-to-end on a simulator or device.

5. **Push and open a PR** against `main`.

---

## Code style

### Backend (Python)

- Follow [PEP 8](https://peps.python.org/pep-0008/)
- Use type hints on all function signatures
- Keep route handlers thin — business logic belongs in `services/`
- No hardcoded API keys or URLs; use `os.getenv()`

### Frontend (TypeScript)

- Strict TypeScript — no `any` unless unavoidable
- Functional components only; no class components
- Keep components in `src/components/`, screens in `src/screens/`
- API calls go through `src/services/api.ts` — screens should not call `axios` directly

### General

- No commented-out code in PRs
- No `console.log` / `print` left in production paths
- Keep functions small and single-purpose

---

## Testing

Every PR should include tests for new behaviour. See [TEST_PLAN.md](TEST_PLAN.md) for the full strategy.

### Backend

- New endpoints → add tests in `backend/tests/test_api_endpoints.py`
- New service logic → add tests in `backend/tests/test_google_places_service.py`
- Mock all outgoing HTTP with `respx_mock` — tests must run fully offline

```bash
cd backend
pytest -v                           # run all tests
pytest tests/test_api_endpoints.py  # run one file
pytest -k "test_geocode"            # run matching tests
```

### Frontend

- New API functions → add tests in `src/__tests__/api.test.ts`
- New components → add a `ComponentName.test.tsx` in `src/__tests__/`
- Mock native modules and axios; tests must run without a running backend

```bash
cd frontend
npm run test:ci          # single run
npm test                 # watch mode during development
```

---

## Submitting a pull request

1. Ensure all tests pass locally
2. Keep the PR description concise — what changed and why
3. Reference any related issues with `Closes #123`
4. Request a review; PRs require at least one approval before merge

### PR checklist

- [ ] Tests added or updated for the change
- [ ] Both test suites pass (`pytest` and `npm run test:ci`)
- [ ] No secrets or API keys in the diff
- [ ] `app.json`, `.env`, and `config.ts` are **not** staged (all gitignored)

---

## Commit message format

Use the imperative mood and keep the subject line under 72 characters:

```
feat: add radius slider to map screen
fix: return 404 when geocode finds no results
test: add missing edge cases for fetch_parking_details
docs: update README setup instructions
refactor: extract map marker logic into helper
```

Common prefixes: `feat`, `fix`, `test`, `docs`, `refactor`, `chore`
