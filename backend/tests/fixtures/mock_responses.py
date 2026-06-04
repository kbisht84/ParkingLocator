"""
Shared mock payloads that mimic real Google Places / Geocoding API responses.
Keep these in sync with the actual API shape — if Google changes a field,
update here and the failing tests will point to the affected service code.
"""

NEARBY_PARKING_RESPONSE = {
    "results": [
        {
            "place_id": "ChIJtest123",
            "name": "Downtown Parking Garage",
            "geometry": {"location": {"lat": 37.7749, "lng": -122.4194}},
            "vicinity": "123 Main St, San Francisco",
            "rating": 4.2,
            "user_ratings_total": 150,
            "opening_hours": {"open_now": True},
            "icon": "https://maps.gstatic.com/mapfiles/place_api/icons/v1/png_71/parking-71.png",
        },
        {
            "place_id": "ChIJtest456",
            "name": "Market Street Parking",
            "geometry": {"location": {"lat": 37.7750, "lng": -122.4196}},
            "vicinity": "456 Market St, San Francisco",
            "rating": 3.8,
            "user_ratings_total": 87,
            "opening_hours": {"open_now": False},
            "icon": "https://maps.gstatic.com/mapfiles/place_api/icons/v1/png_71/parking-71.png",
        },
    ],
    "status": "OK",
}

NEARBY_PARKING_EMPTY_RESPONSE = {
    "results": [],
    "status": "ZERO_RESULTS",
}

NEARBY_PARKING_NO_HOURS_RESPONSE = {
    "results": [
        {
            "place_id": "ChIJtestNoHours",
            "name": "No-Hours Lot",
            "geometry": {"location": {"lat": 37.7749, "lng": -122.4194}},
            "vicinity": "789 Unknown Ave",
            "rating": None,
            "user_ratings_total": None,
            # opening_hours intentionally absent
        },
    ],
    "status": "OK",
}

GEOCODE_RESPONSE = {
    "results": [
        {
            "geometry": {"location": {"lat": 37.7749, "lng": -122.4194}},
            "formatted_address": "San Francisco, CA 94102, USA",
        }
    ],
    "status": "OK",
}

GEOCODE_NOT_FOUND_RESPONSE = {
    "results": [],
    "status": "ZERO_RESULTS",
}

PARKING_DETAILS_RESPONSE = {
    "result": {
        "place_id": "ChIJtest123",
        "name": "Downtown Parking Garage",
        "geometry": {"location": {"lat": 37.7749, "lng": -122.4194}},
        "formatted_address": "123 Main St, San Francisco, CA 94102",
        "formatted_phone_number": "(415) 555-0123",
        "rating": 4.2,
        "user_ratings_total": 150,
        "opening_hours": {
            "open_now": True,
            "weekday_text": [
                "Monday: Open 24 hours",
                "Tuesday: Open 24 hours",
                "Wednesday: Open 24 hours",
                "Thursday: Open 24 hours",
                "Friday: Open 24 hours",
                "Saturday: Open 24 hours",
                "Sunday: Open 24 hours",
            ],
        },
        "website": "https://www.downtownparking.com",
        "photos": [{"photo_reference": "AbCdEf123456"}],
    },
    "status": "OK",
}

PARKING_DETAILS_NO_PHOTOS_RESPONSE = {
    "result": {
        "place_id": "ChIJtest789",
        "name": "No-Photo Lot",
        "geometry": {"location": {"lat": 37.7749, "lng": -122.4194}},
        "formatted_address": "789 Nophoto Rd",
        "photos": [],
    },
    "status": "OK",
}

PARKING_DETAILS_NOT_FOUND_RESPONSE = {
    "status": "NOT_FOUND",
}
