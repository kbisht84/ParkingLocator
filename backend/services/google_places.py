import httpx
import os
from typing import Optional
from models.parking import ParkingLocation, ParkingDetail, GeocodeResult

PLACES_BASE_URL = "https://maps.googleapis.com/maps/api/place"
GEOCODE_BASE_URL = "https://maps.googleapis.com/maps/api/geocode"


async def fetch_nearby_parking(lat: float, lng: float, radius: int) -> list[ParkingLocation]:
    api_key = os.getenv("GOOGLE_API_KEY")
    url = f"{PLACES_BASE_URL}/nearbysearch/json"

    params = {
        "location": f"{lat},{lng}",
        "radius": radius,
        "type": "parking",
        "key": api_key,
    }

    async with httpx.AsyncClient() as client:
        response = await client.get(url, params=params, timeout=10.0)
        response.raise_for_status()
        data = response.json()

    results = []
    for place in data.get("results", []):
        geometry = place.get("geometry", {}).get("location", {})
        opening_hours = place.get("opening_hours", {})
        results.append(
            ParkingLocation(
                place_id=place.get("place_id", ""),
                name=place.get("name", "Unknown"),
                lat=geometry.get("lat", 0),
                lng=geometry.get("lng", 0),
                address=place.get("vicinity", ""),
                rating=place.get("rating"),
                user_ratings_total=place.get("user_ratings_total"),
                open_now=opening_hours.get("open_now"),
                icon=place.get("icon"),
                vicinity=place.get("vicinity"),
            )
        )
    return results


async def geocode_zipcode(zipcode: str) -> Optional[GeocodeResult]:
    api_key = os.getenv("GOOGLE_GEOCODING_API_KEY")
    url = f"{GEOCODE_BASE_URL}/json"

    # Append country hint for numeric ZIP codes so the Geocoding API resolves them reliably
    address = f"{zipcode} USA" if zipcode.strip().isdigit() else zipcode

    params = {
        "address": address,
        "key": api_key,
    }

    async with httpx.AsyncClient() as client:
        response = await client.get(url, params=params, timeout=10.0)
        response.raise_for_status()
        data = response.json()

    if data.get("status") != "OK" or not data.get("results"):
        return None

    result = data["results"][0]
    location = result["geometry"]["location"]

    return GeocodeResult(
        lat=location["lat"],
        lng=location["lng"],
        formatted_address=result.get("formatted_address", zipcode),
    )


async def fetch_parking_details(place_id: str) -> Optional[ParkingDetail]:
    api_key = os.getenv("GOOGLE_API_KEY")
    url = f"{PLACES_BASE_URL}/details/json"

    fields = (
        "place_id,name,geometry,formatted_address,"
        "formatted_phone_number,rating,user_ratings_total,"
        "opening_hours,website,photos"
    )

    params = {
        "place_id": place_id,
        "fields": fields,
        "key": api_key,
    }

    async with httpx.AsyncClient() as client:
        response = await client.get(url, params=params, timeout=10.0)
        response.raise_for_status()
        data = response.json()

    result = data.get("result")
    if not result:
        return None

    geometry = result.get("geometry", {}).get("location", {})
    opening_hours = result.get("opening_hours", {})
    photos = result.get("photos", [])
    photo_ref = photos[0].get("photo_reference") if photos else None

    return ParkingDetail(
        place_id=result.get("place_id", place_id),
        name=result.get("name", "Unknown"),
        lat=geometry.get("lat", 0),
        lng=geometry.get("lng", 0),
        formatted_address=result.get("formatted_address"),
        formatted_phone_number=result.get("formatted_phone_number"),
        rating=result.get("rating"),
        user_ratings_total=result.get("user_ratings_total"),
        open_now=opening_hours.get("open_now"),
        weekday_text=opening_hours.get("weekday_text"),
        website=result.get("website"),
        photo_reference=photo_ref,
    )
