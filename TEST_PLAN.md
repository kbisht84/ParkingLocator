 # ParkingLocator — Test Plan

## 1. Overview

This document defines the testing strategy for the ParkingLocator app, a React Native (Expo) mobile frontend backed by a FastAPI Python service. All parking data flows through Google Places and Geocoding APIs.

## 2. Test Scope

### In Scope
- FastAPI backend endpoints (unit + integration)
- Google Places service layer (unit with mocked HTTP)
- Frontend API service functions (unit with mocked axios)
- `ParkingDetailCard` component (render + interaction)
- Data model validation (Pydantic models)

### Out of Scope
- Google API itself (external dependency — always mocked)
- Device GPS hardware (mocked via expo-location mock)
- Native map rendering (react-native-maps mocked)
- End-to-end device tests (Detox/Maestro — planned future phase)

---

## 3. Tech Stack for Tests

| Layer | Framework | Notes |
|---|---|---|
| Backend unit | `pytest` + `pytest-asyncio` | Async test support |
| Backend HTTP mock | `respx` | Intercepts `httpx.AsyncClient` calls |
| Backend coverage | `pytest-cov` | HTML + terminal reports |
| Frontend unit | `jest-expo` | Expo-tuned Jest preset |
| Frontend components | `@testing-library/react-native` | Screen queries + fire events |
| Frontend API mock | `jest.mock('axios')` | Module-level factory mock |

---

## 4. Test Categories

### 4.1 Backend — API Endpoints

File: `backend/tests/test_api_endpoints.py`

| # | Test | Expected |
|---|---|---|
| BE-01 | `GET /api/health` | 200 `{"status": "ok"}` |
| BE-02 | `GET /api/parking/nearby` — valid params | 200, `results` array, `count` integer |
| BE-03 | `GET /api/parking/nearby` — missing `lat` | 422 validation error |
| BE-04 | `GET /api/parking/nearby` — missing `lng` | 422 validation error |
| BE-05 | `GET /api/parking/nearby` — `radius < 100` | 422 validation error |
| BE-06 | `GET /api/parking/nearby` — `radius > 50000` | 422 validation error |
| BE-07 | `GET /api/parking/nearby` — default radius (omit param) | 200 accepted |
| BE-08 | `GET /api/parking/nearby` — Google returns empty list | 200 `count: 0` |
| BE-09 | `GET /api/parking/nearby` — Google API down | 500 error |
| BE-10 | `GET /api/geocode` — valid ZIP | 200 with lat/lng/address |
| BE-11 | `GET /api/geocode` — unknown ZIP | 404 "Location not found" |
| BE-12 | `GET /api/geocode` — missing param | 422 validation error |
| BE-13 | `GET /api/geocode` — non-numeric address string | 200 (no USA suffix appended) |
| BE-14 | `GET /api/parking/details` — valid place_id | 200 with full detail |
| BE-15 | `GET /api/parking/details` — unknown place_id | 404 "Parking place not found" |
| BE-16 | `GET /api/parking/details` — missing param | 422 validation error |
| BE-17 | CORS headers present on any endpoint | `Access-Control-Allow-Origin: *` |

### 4.2 Backend — Google Places Service

File: `backend/tests/test_google_places_service.py`

| # | Test | Expected |
|---|---|---|
| SV-01 | `fetch_nearby_parking` — maps response to `ParkingLocation` list | Correct field mapping |
| SV-02 | `fetch_nearby_parking` — empty results | Returns `[]` |
| SV-03 | `fetch_nearby_parking` — spot with no opening_hours | `open_now=None` |
| SV-04 | `fetch_nearby_parking` — spot with no rating | `rating=None` |
| SV-05 | `geocode_zipcode` — numeric ZIP appends " USA" | Address param contains "USA" |
| SV-06 | `geocode_zipcode` — non-numeric string has no suffix | No "USA" appended |
| SV-07 | `geocode_zipcode` — Google returns ZERO_RESULTS | Returns `None` |
| SV-08 | `fetch_parking_details` — maps response to `ParkingDetail` | Correct field mapping |
| SV-09 | `fetch_parking_details` — no result key in response | Returns `None` |
| SV-10 | `fetch_parking_details` — photo_reference from first photo | Correct photo reference |
| SV-11 | `fetch_parking_details` — no photos array | `photo_reference=None` |

### 4.3 Frontend — API Service

File: `frontend/src/__tests__/api.test.ts`

| # | Test | Expected |
|---|---|---|
| FE-01 | `fetchNearbyParking` — success | Returns `ParkingSpot[]` |
| FE-02 | `fetchNearbyParking` — correct URL and params | Calls `/api/parking/nearby` with lat/lng/radius |
| FE-03 | `fetchNearbyParking` — network error | Rejects with error |
| FE-04 | `fetchParkingDetails` — success | Returns `ParkingDetail` |
| FE-05 | `fetchParkingDetails` — correct URL and params | Calls `/api/parking/details` with place_id |
| FE-06 | `fetchParkingDetails` — network error | Rejects with error |
| FE-07 | `geocodeZipcode` — success | Returns `GeocodeResult` |
| FE-08 | `geocodeZipcode` — correct URL and params | Calls `/api/geocode` with zipcode |
| FE-09 | `geocodeZipcode` — network error | Rejects with error |

### 4.4 Frontend — ParkingDetailCard Component

File: `frontend/src/__tests__/ParkingDetailCard.test.tsx`

| # | Test | Expected |
|---|---|---|
| UI-01 | `loading=true` renders spinner | ActivityIndicator visible |
| UI-02 | `loading=false, detail=null` renders empty | No parking name visible |
| UI-03 | Detail renders parking name | Name text present |
| UI-04 | `open_now=true` shows "Open Now" badge | Badge text "Open Now" |
| UI-05 | `open_now=false` shows "Closed" badge | Badge text "Closed" |
| UI-06 | `open_now=null` shows "Hours Unknown" badge | Badge text "Hours Unknown" |
| UI-07 | Rating displayed with review count | "4.2" and "(150)" visible |
| UI-08 | No rating hides rating row | Star/rating not rendered |
| UI-09 | Formatted address renders | Address text present |
| UI-10 | Phone number renders | Phone text present |
| UI-11 | Opening hours renders with title | "Opening Hours" header + each day line |
| UI-12 | Website button renders when website set | "Visit Website" button visible |
| UI-13 | No website hides website button | Button absent |
| UI-14 | Close button calls `onClose` | `onClose` called once |
| UI-15 | Pressing website button opens URL | `Linking.openURL(website)` called |
| UI-16 | Pressing phone number calls phone | `Linking.openURL('tel:...')` called |
| UI-17 | Pressing address opens Google Maps | `Linking.openURL` called with maps URL |

---

## 5. Test Data Strategy

- **Fixtures**: Shared mock Google API response payloads live in `backend/tests/fixtures/mock_responses.py` and `frontend/src/__tests__/fixtures/mockData.ts`.
- **Isolation**: Every test that touches HTTP mocks uses `respx.mock` (backend) or per-test `mockGet.mockResolvedValueOnce` (frontend) so tests never share state.
- **Environment**: Backend tests set `GOOGLE_API_KEY` and `GOOGLE_GEOCODING_API_KEY` env vars to `"test-key"` in `conftest.py`. Frontend config is replaced via `moduleNameMapper`.

---

## 6. Coverage Targets

| Layer | Target |
|---|---|
| Backend services | ≥ 90% line coverage |
| Backend endpoints | 100% endpoint coverage |
| Frontend API service | ≥ 90% line coverage |
| Frontend components | ≥ 80% line coverage |

---

## 7. Running Tests

```bash
# Backend
cd backend
pip install -r requirements-test.txt
pytest                        # all tests
pytest --cov=. --cov-report=html  # with HTML coverage report

# Frontend
cd frontend
npm install
npm test                      # watch mode
npm run test:ci               # single-run with coverage
```

---

## 8. Future Test Phases

| Phase | Scope | Tool |
|---|---|---|
| Phase 2 | MapScreen component tests | @testing-library/react-native |
| Phase 3 | E2E smoke tests on simulator | Maestro or Detox |
| Phase 4 | Performance / load tests on backend | Locust |
| Phase 5 | Contract tests for Google API schema changes | Pact or JSON schema validation |
