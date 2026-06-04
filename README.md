# ParkingLocator

A React Native (Expo) mobile app for finding nearby parking. Uses a FastAPI backend to query Google Places and Geocoding APIs.

---

## Prerequisites

- Node.js 18+
- Python 3.11+
- A [Google Cloud](https://console.cloud.google.com/) project with **Maps SDK for iOS**, **Maps SDK for Android**, **Places API**, and **Geocoding API** enabled

---

## Setup

### 1. Clone the repo

```bash
git clone https://github.com/kbisht84/ParkingLocator.git
cd ParkingLocator
```

### 2. Configure app.json

`frontend/app.json` is gitignored because it contains API keys. Create it from the example template:

```bash
cp frontend/app.example.json frontend/app.json
```

Then open `frontend/app.json` and replace both occurrences of `YOUR_GOOGLE_MAPS_API_KEY_HERE` with your Google Maps API key:

```json
"ios": {
  "config": {
    "googleMapsApiKey": "YOUR_GOOGLE_MAPS_API_KEY_HERE"  ← replace this
  }
},
"android": {
  "config": {
    "googleMaps": {
      "apiKey": "YOUR_GOOGLE_MAPS_API_KEY_HERE"          ← and this
    }
  }
}
```

### 3. Configure the backend

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` and fill in your keys:

```
GOOGLE_API_KEY=your_google_places_api_key
GOOGLE_GEOCODING_API_KEY=your_google_geocoding_api_key
```

### 4. Configure the frontend API URL

```bash
cp frontend/src/constants/config.example.ts frontend/src/constants/config.ts
```

Edit `config.ts` and set `API_BASE_URL` to your machine's local IP (find it with `ifconfig` / `ipconfig`):

```ts
export const API_BASE_URL = "http://192.168.x.x:8000";
```

---

## Running the app

**Backend**

```bash
./start-backend.sh
```

The API will be available at `http://localhost:8000`. Docs at `http://localhost:8000/docs`.

**Frontend**

```bash
cd frontend
npm install
npm start        # opens Expo Dev Tools
```

Then press `i` for iOS simulator or `a` for Android emulator, or scan the QR code with Expo Go.

---

## Running tests

**Backend**

```bash
cd backend
pip install -r requirements-test.txt
pytest                              # all tests
pytest --cov=. --cov-report=html    # with coverage report
```

**Frontend**

```bash
cd frontend
npm test          # watch mode
npm run test:ci   # single run with coverage
```

See [TEST_PLAN.md](TEST_PLAN.md) for the full testing strategy.
