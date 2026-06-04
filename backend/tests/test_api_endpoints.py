"""
Integration tests for the FastAPI endpoints.

Uses the respx_mock pytest fixture (injected by respx's pytest plugin) so each
test gets a clean router. Plain-string URL patterns ignore query params by
default in respx, which is exactly what we need since Google API calls include
a key param we don't want to hard-code in tests.
"""

import httpx
import pytest
from fastapi.testclient import TestClient

from tests.fixtures.mock_responses import (
    GEOCODE_NOT_FOUND_RESPONSE,
    GEOCODE_RESPONSE,
    NEARBY_PARKING_EMPTY_RESPONSE,
    NEARBY_PARKING_RESPONSE,
    PARKING_DETAILS_NOT_FOUND_RESPONSE,
    PARKING_DETAILS_RESPONSE,
)

NEARBY_PATTERN = {"url__regex": r"nearbysearch/json"}
GEOCODE_PATTERN = {"url__regex": r"geocode/json"}
DETAILS_PATTERN = {"url__regex": r"place/details/json"}


class TestHealthEndpoint:
    def test_returns_ok(self, client: TestClient) -> None:
        response = client.get("/api/health")
        assert response.status_code == 200
        assert response.json() == {"status": "ok"}


class TestNearbyParkingEndpoint:
    def test_returns_parking_spots(self, client: TestClient, respx_mock) -> None:
        respx_mock.route(**NEARBY_PATTERN).mock(return_value=httpx.Response(200, json=NEARBY_PARKING_RESPONSE))

        response = client.get("/api/parking/nearby", params={"lat": 37.7749, "lng": -122.4194, "radius": 1500})

        assert response.status_code == 200
        data = response.json()
        assert data["count"] == 2
        assert len(data["results"]) == 2

    def test_result_fields_mapped_correctly(self, client: TestClient, respx_mock) -> None:
        respx_mock.route(**NEARBY_PATTERN).mock(return_value=httpx.Response(200, json=NEARBY_PARKING_RESPONSE))

        response = client.get("/api/parking/nearby", params={"lat": 37.7749, "lng": -122.4194})
        spot = response.json()["results"][0]

        assert spot["place_id"] == "ChIJtest123"
        assert spot["name"] == "Downtown Parking Garage"
        assert spot["lat"] == 37.7749
        assert spot["lng"] == -122.4194
        assert spot["address"] == "123 Main St, San Francisco"
        assert spot["rating"] == 4.2
        assert spot["open_now"] is True

    def test_empty_results_returns_zero_count(self, client: TestClient, respx_mock) -> None:
        respx_mock.route(**NEARBY_PATTERN).mock(return_value=httpx.Response(200, json=NEARBY_PARKING_EMPTY_RESPONSE))

        response = client.get("/api/parking/nearby", params={"lat": 37.7749, "lng": -122.4194})

        assert response.status_code == 200
        assert response.json() == {"results": [], "count": 0}

    def test_missing_lat_returns_422(self, client: TestClient) -> None:
        response = client.get("/api/parking/nearby", params={"lng": -122.4194})
        assert response.status_code == 422

    def test_missing_lng_returns_422(self, client: TestClient) -> None:
        response = client.get("/api/parking/nearby", params={"lat": 37.7749})
        assert response.status_code == 422

    def test_radius_below_minimum_returns_422(self, client: TestClient) -> None:
        response = client.get("/api/parking/nearby", params={"lat": 37.7749, "lng": -122.4194, "radius": 50})
        assert response.status_code == 422

    def test_radius_above_maximum_returns_422(self, client: TestClient) -> None:
        response = client.get("/api/parking/nearby", params={"lat": 37.7749, "lng": -122.4194, "radius": 100000})
        assert response.status_code == 422

    def test_google_api_error_returns_500(self, client: TestClient, respx_mock) -> None:
        respx_mock.route(**NEARBY_PATTERN).mock(side_effect=httpx.ConnectError("connection refused"))

        response = client.get("/api/parking/nearby", params={"lat": 37.7749, "lng": -122.4194})

        assert response.status_code == 500


class TestGeocodeEndpoint:
    def test_valid_zip_returns_coordinates(self, client: TestClient, respx_mock) -> None:
        respx_mock.route(**GEOCODE_PATTERN).mock(return_value=httpx.Response(200, json=GEOCODE_RESPONSE))

        response = client.get("/api/geocode", params={"zipcode": "94102"})

        assert response.status_code == 200
        data = response.json()
        assert data["lat"] == 37.7749
        assert data["lng"] == -122.4194
        assert "San Francisco" in data["formatted_address"]

    def test_unknown_zip_returns_404(self, client: TestClient, respx_mock) -> None:
        respx_mock.route(**GEOCODE_PATTERN).mock(return_value=httpx.Response(200, json=GEOCODE_NOT_FOUND_RESPONSE))

        response = client.get("/api/geocode", params={"zipcode": "00000"})

        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()

    def test_missing_zipcode_returns_422(self, client: TestClient) -> None:
        response = client.get("/api/geocode")
        assert response.status_code == 422

    def test_google_api_error_returns_500(self, client: TestClient, respx_mock) -> None:
        respx_mock.route(**GEOCODE_PATTERN).mock(side_effect=httpx.ConnectError("connection refused"))

        response = client.get("/api/geocode", params={"zipcode": "94102"})

        assert response.status_code == 500


class TestParkingDetailsEndpoint:
    def test_valid_place_id_returns_details(self, client: TestClient, respx_mock) -> None:
        respx_mock.route(**DETAILS_PATTERN).mock(return_value=httpx.Response(200, json=PARKING_DETAILS_RESPONSE))

        response = client.get("/api/parking/details", params={"place_id": "ChIJtest123"})

        assert response.status_code == 200
        data = response.json()
        assert data["place_id"] == "ChIJtest123"
        assert data["name"] == "Downtown Parking Garage"
        assert data["formatted_phone_number"] == "(415) 555-0123"
        assert data["website"] == "https://www.downtownparking.com"
        assert data["photo_reference"] == "AbCdEf123456"
        assert len(data["weekday_text"]) == 7

    def test_unknown_place_id_returns_404(self, client: TestClient, respx_mock) -> None:
        respx_mock.route(**DETAILS_PATTERN).mock(return_value=httpx.Response(200, json=PARKING_DETAILS_NOT_FOUND_RESPONSE))

        response = client.get("/api/parking/details", params={"place_id": "ChIJinvalid"})

        assert response.status_code == 404

    def test_missing_place_id_returns_422(self, client: TestClient) -> None:
        response = client.get("/api/parking/details")
        assert response.status_code == 422

    def test_google_api_error_returns_500(self, client: TestClient, respx_mock) -> None:
        respx_mock.route(**DETAILS_PATTERN).mock(side_effect=httpx.ConnectError("connection refused"))

        response = client.get("/api/parking/details", params={"place_id": "ChIJtest123"})

        assert response.status_code == 500


class TestCorsHeaders:
    def test_cors_header_present(self, client: TestClient) -> None:
        response = client.get("/api/health", headers={"Origin": "http://localhost:3000"})
        assert response.headers.get("access-control-allow-origin") == "*"
