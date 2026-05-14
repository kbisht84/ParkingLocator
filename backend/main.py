from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from models.parking import NearbySearchRequest
from services.google_places import fetch_nearby_parking, fetch_parking_details, geocode_zipcode

app = FastAPI(title="ParkingLocator API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
async def health():
    return {"status": "ok"}


@app.get("/api/parking/nearby")
async def nearby_parking(
    lat: float = Query(..., description="Latitude"),
    lng: float = Query(..., description="Longitude"),
    radius: int = Query(1500, ge=100, le=50000, description="Search radius in meters"),
):
    try:
        parking_spots = await fetch_nearby_parking(lat, lng, radius)
        return {"results": [spot.model_dump() for spot in parking_spots], "count": len(parking_spots)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/geocode")
async def geocode(zipcode: str = Query(..., description="ZIP code or address to geocode")):
    try:
        result = await geocode_zipcode(zipcode)
        if not result:
            raise HTTPException(status_code=404, detail="Location not found for the given ZIP code")
        return result.model_dump()
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/parking/details")
async def parking_details(place_id: str = Query(..., description="Google Place ID")):
    try:
        detail = await fetch_parking_details(place_id)
        if not detail:
            raise HTTPException(status_code=404, detail="Parking place not found")
        return detail.model_dump()
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
