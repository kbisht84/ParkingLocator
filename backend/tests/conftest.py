import os
import sys

import pytest
from fastapi.testclient import TestClient

# Ensure the backend root is on the path so imports resolve correctly
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

# Stub API keys before any service module is imported
os.environ.setdefault("GOOGLE_API_KEY", "test-google-api-key")
os.environ.setdefault("GOOGLE_GEOCODING_API_KEY", "test-geocoding-api-key")

from main import app  # noqa: E402 — must come after env vars are set


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)
