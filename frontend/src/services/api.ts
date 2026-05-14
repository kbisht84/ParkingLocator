import axios from "axios";
import { API_BASE_URL } from "../constants/config";

export interface ParkingSpot {
  place_id: string;
  name: string;
  lat: number;
  lng: number;
  address: string;
  rating: number | null;
  user_ratings_total: number | null;
  open_now: boolean | null;
  icon: string | null;
  vicinity: string | null;
}

export interface ParkingDetail {
  place_id: string;
  name: string;
  lat: number;
  lng: number;
  formatted_address: string | null;
  formatted_phone_number: string | null;
  rating: number | null;
  user_ratings_total: number | null;
  open_now: boolean | null;
  weekday_text: string[] | null;
  website: string | null;
  photo_reference: string | null;
}

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

export async function fetchNearbyParking(
  lat: number,
  lng: number,
  radius: number
): Promise<ParkingSpot[]> {
  const response = await client.get("/api/parking/nearby", {
    params: { lat, lng, radius },
  });
  return response.data.results;
}

export async function fetchParkingDetails(placeId: string): Promise<ParkingDetail> {
  const response = await client.get("/api/parking/details", {
    params: { place_id: placeId },
  });
  return response.data;
}

export interface GeocodeResult {
  lat: number;
  lng: number;
  formatted_address: string;
}

export async function geocodeZipcode(zipcode: string): Promise<GeocodeResult> {
  const response = await client.get("/api/geocode", {
    params: { zipcode },
  });
  return response.data;
}
