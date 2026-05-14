from pydantic import BaseModel
from typing import Optional


class ParkingLocation(BaseModel):
    place_id: str
    name: str
    lat: float
    lng: float
    address: str
    rating: Optional[float] = None
    user_ratings_total: Optional[int] = None
    open_now: Optional[bool] = None
    icon: Optional[str] = None
    vicinity: Optional[str] = None


class ParkingDetail(BaseModel):
    place_id: str
    name: str
    lat: float
    lng: float
    formatted_address: Optional[str] = None
    formatted_phone_number: Optional[str] = None
    rating: Optional[float] = None
    user_ratings_total: Optional[int] = None
    open_now: Optional[bool] = None
    weekday_text: Optional[list[str]] = None
    website: Optional[str] = None
    photo_reference: Optional[str] = None


class NearbySearchRequest(BaseModel):
    lat: float
    lng: float
    radius: int = 1500


class GeocodeResult(BaseModel):
    lat: float
    lng: float
    formatted_address: str
