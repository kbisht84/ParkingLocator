"""
Unit tests for the Google Places service layer.

All outgoing HTTP calls are intercepted by the respx_mock pytest fixture so
tests run offline without touching Google API quotas or real keys.
"""

import httpx
import pytest

from services.google_places import fetch_nearby_parking, fetch_parking_details, geocode_zipcode
from tests.fixtures.mock_responses import (
    GEOCODE_NOT_FOUND_RESPONSE,
    GEOCODE_RESPONSE,
    NEARBY_PARKING_EMPTY_RESPONSE,
    NEARBY_PARKING_NO_HOURS_RESPONSE,
    NEARBY_PARKING_RESPONSE,
    PARKING_DETAILS_NO_PHOTOS_RESPONSE,
    PARKING_DETAILS_NOT_FOUND_RESPONSE,
    PARKING_DETAILS_RESPONSE,
)

NEARBY_PATTERN = {"url__regex": r"nearbysearch/json"}
GEOCODE_PATTERN = {"url__regex": r"geocode/json"}
DETAILS_PATTERN = {"url__regex": r"place/details/json"}


class TestFetchNearbyParking:
    async def test_returns_list_of_parking_locations(self, respx_mock) -> None:
        respx_mock.route(**NEARBY_PATTERN).mock(return_value=httpx.Response(200, json=NEARBY_PARKING_RESPONSE))

        results = await fetch_nearby_parking(37.7749, -122.4194, 1500)

        assert len(results) == 2

    async def test_maps_fields_correctly(self, respx_mock) -> None:
        respx_mock.route(**NEARBY_PATTERN).mock(return_value=httpx.Response(200, json=NEARBY_PARKING_RESPONSE))

        results = await fetch_nearby_parking(37.7749, -122.4194, 1500)
        spot = results[0]

        assert spot.place_id == "ChIJtest123"
        assert spot.name == "Downtown Parking Garage"
        assert spot.lat == 37.7749
        assert spot.lng == -122.4194
        assert spot.address == "123 Main St, San Francisco"
        assert spot.rating == 4.2
        assert spot.user_ratings_total == 150
        assert spot.open_now is True

    async def test_empty_results_returns_empty_list(self, respx_mock) -> None:
        respx_mock.route(**NEARBY_PATTERN).mock(return_value=httpx.Response(200, json=NEARBY_PARKING_EMPTY_RESPONSE))

        results = await fetch_nearby_parking(37.7749, -122.4194, 1500)

        assert results == []

    async def test_spot_without_opening_hours_has_none(self, respx_mock) -> None:
        respx_mock.route(**NEARBY_PATTERN).mock(return_value=httpx.Response(200, json=NEARBY_PARKING_NO_HOURS_RESPONSE))

        results = await fetch_nearby_parking(37.7749, -122.4194, 1500)

        assert results[0].open_now is None

    async def test_spot_without_rating_has_none(self, respx_mock) -> None:
        respx_mock.route(**NEARBY_PATTERN).mock(return_value=httpx.Response(200, json=NEARBY_PARKING_NO_HOURS_RESPONSE))

        results = await fetch_nearby_parking(37.7749, -122.4194, 1500)

        assert results[0].rating is None

    async def test_http_error_propagates(self, respx_mock) -> None:
        respx_mock.route(**NEARBY_PATTERN).mock(return_value=httpx.Response(500))

        with pytest.raises(httpx.HTTPStatusError):
            await fetch_nearby_parking(37.7749, -122.4194, 1500)


class TestGeocodeZipcode:
    async def test_returns_geocode_result(self, respx_mock) -> None:
        respx_mock.route(**GEOCODE_PATTERN).mock(return_value=httpx.Response(200, json=GEOCODE_RESPONSE))

        result = await geocode_zipcode("94102")

        assert result is not None
        assert result.lat == 37.7749
        assert result.lng == -122.4194
        assert "San Francisco" in result.formatted_address

    async def test_numeric_zip_appends_usa(self, respx_mock) -> None:
        route = respx_mock.route(**GEOCODE_PATTERN).mock(return_value=httpx.Response(200, json=GEOCODE_RESPONSE))

        await geocode_zipcode("94102")

        request = route.calls.last.request
        assert "USA" in request.url.params["address"]

    async def test_non_numeric_zip_has_no_usa_suffix(self, respx_mock) -> None:
        route = respx_mock.route(**GEOCODE_PATTERN).mock(return_value=httpx.Response(200, json=GEOCODE_RESPONSE))

        await geocode_zipcode("San Francisco, CA")

        request = route.calls.last.request
        assert "USA" not in request.url.params["address"]

    async def test_zero_results_returns_none(self, respx_mock) -> None:
        respx_mock.route(**GEOCODE_PATTERN).mock(return_value=httpx.Response(200, json=GEOCODE_NOT_FOUND_RESPONSE))

        result = await geocode_zipcode("00000")

        assert result is None

    async def test_http_error_propagates(self, respx_mock) -> None:
        respx_mock.route(**GEOCODE_PATTERN).mock(return_value=httpx.Response(500))

        with pytest.raises(httpx.HTTPStatusError):
            await geocode_zipcode("94102")


class TestFetchParkingDetails:
    async def test_returns_parking_detail(self, respx_mock) -> None:
        respx_mock.route(**DETAILS_PATTERN).mock(return_value=httpx.Response(200, json=PARKING_DETAILS_RESPONSE))

        detail = await fetch_parking_details("ChIJtest123")

        assert detail is not None
        assert detail.place_id == "ChIJtest123"
        assert detail.name == "Downtown Parking Garage"

    async def test_maps_all_fields(self, respx_mock) -> None:
        respx_mock.route(**DETAILS_PATTERN).mock(return_value=httpx.Response(200, json=PARKING_DETAILS_RESPONSE))

        detail = await fetch_parking_details("ChIJtest123")

        assert detail.formatted_address == "123 Main St, San Francisco, CA 94102"
        assert detail.formatted_phone_number == "(415) 555-0123"
        assert detail.rating == 4.2
        assert detail.open_now is True
        assert detail.website == "https://www.downtownparking.com"
        assert detail.photo_reference == "AbCdEf123456"
        assert len(detail.weekday_text) == 7

    async def test_photo_reference_from_first_photo(self, respx_mock) -> None:
        respx_mock.route(**DETAILS_PATTERN).mock(return_value=httpx.Response(200, json=PARKING_DETAILS_RESPONSE))

        detail = await fetch_parking_details("ChIJtest123")

        assert detail.photo_reference == "AbCdEf123456"

    async def test_no_photos_returns_none_photo_reference(self, respx_mock) -> None:
        respx_mock.route(**DETAILS_PATTERN).mock(return_value=httpx.Response(200, json=PARKING_DETAILS_NO_PHOTOS_RESPONSE))

        detail = await fetch_parking_details("ChIJtest789")

        assert detail.photo_reference is None

    async def test_no_result_key_returns_none(self, respx_mock) -> None:
        respx_mock.route(**DETAILS_PATTERN).mock(return_value=httpx.Response(200, json=PARKING_DETAILS_NOT_FOUND_RESPONSE))

        detail = await fetch_parking_details("ChIJinvalid")

        assert detail is None

    async def test_http_error_propagates(self, respx_mock) -> None:
        respx_mock.route(**DETAILS_PATTERN).mock(return_value=httpx.Response(500))

        with pytest.raises(httpx.HTTPStatusError):
            await fetch_parking_details("ChIJtest123")
