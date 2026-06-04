/**
 * Unit tests for the frontend API service (src/services/api.ts).
 *
 * The axios module is mocked via a Jest factory so the private `client`
 * instance created inside api.ts is intercepted without modifying source code.
 * The `mockGet` closure pattern works because:
 *   1. jest.mock is hoisted above all imports.
 *   2. The factory creates a `get` function that reads `mockGet` at call time.
 *   3. By the time tests run, `mockGet` has been assigned in beforeEach.
 */

import { fetchNearbyParking, fetchParkingDetails, geocodeZipcode } from "../services/api";

// Shared mock — assigned fresh in each beforeEach to avoid cross-test pollution.
let mockGet: jest.Mock;

jest.mock("axios", () => ({
  __esModule: true,
  default: {
    create: jest.fn(() => ({
      get: (...args: unknown[]) => mockGet(...args),
    })),
  },
  create: jest.fn(() => ({
    get: (...args: unknown[]) => mockGet(...args),
  })),
}));

// ─── Fixtures ────────────────────────────────────────────────────────────────

const mockParkingSpot = {
  place_id: "ChIJtest123",
  name: "Test Parking Garage",
  lat: 37.7749,
  lng: -122.4194,
  address: "123 Main St",
  rating: 4.2,
  user_ratings_total: 150,
  open_now: true,
  icon: null,
  vicinity: "123 Main St",
};

const mockParkingDetail = {
  place_id: "ChIJtest123",
  name: "Test Parking Garage",
  lat: 37.7749,
  lng: -122.4194,
  formatted_address: "123 Main St, San Francisco, CA 94102",
  formatted_phone_number: "(415) 555-0123",
  rating: 4.2,
  user_ratings_total: 150,
  open_now: true,
  weekday_text: ["Monday: Open 24 hours", "Tuesday: Open 24 hours"],
  website: "https://www.testparking.com",
  photo_reference: "AbCdEf123",
};

const mockGeocodeResult = {
  lat: 37.7749,
  lng: -122.4194,
  formatted_address: "San Francisco, CA 94102, USA",
};

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("fetchNearbyParking", () => {
  beforeEach(() => {
    mockGet = jest.fn();
  });

  it("returns array of parking spots on success", async () => {
    mockGet.mockResolvedValueOnce({
      data: { results: [mockParkingSpot], count: 1 },
    });

    const result = await fetchNearbyParking(37.7749, -122.4194, 1500);

    expect(result).toHaveLength(1);
    expect(result[0].place_id).toBe("ChIJtest123");
    expect(result[0].name).toBe("Test Parking Garage");
  });

  it("calls the correct endpoint with lat, lng, and radius params", async () => {
    mockGet.mockResolvedValueOnce({ data: { results: [], count: 0 } });

    await fetchNearbyParking(37.7749, -122.4194, 1500);

    expect(mockGet).toHaveBeenCalledWith("/api/parking/nearby", {
      params: { lat: 37.7749, lng: -122.4194, radius: 1500 },
    });
  });

  it("returns empty array when API returns no results", async () => {
    mockGet.mockResolvedValueOnce({ data: { results: [], count: 0 } });

    const result = await fetchNearbyParking(37.7749, -122.4194, 1500);

    expect(result).toEqual([]);
  });

  it("rejects on network error", async () => {
    mockGet.mockRejectedValueOnce(new Error("Network Error"));

    await expect(fetchNearbyParking(37.7749, -122.4194, 1500)).rejects.toThrow("Network Error");
  });
});

describe("fetchParkingDetails", () => {
  beforeEach(() => {
    mockGet = jest.fn();
  });

  it("returns parking detail object on success", async () => {
    mockGet.mockResolvedValueOnce({ data: mockParkingDetail });

    const result = await fetchParkingDetails("ChIJtest123");

    expect(result.place_id).toBe("ChIJtest123");
    expect(result.name).toBe("Test Parking Garage");
    expect(result.formatted_phone_number).toBe("(415) 555-0123");
  });

  it("calls the correct endpoint with place_id param", async () => {
    mockGet.mockResolvedValueOnce({ data: mockParkingDetail });

    await fetchParkingDetails("ChIJtest123");

    expect(mockGet).toHaveBeenCalledWith("/api/parking/details", {
      params: { place_id: "ChIJtest123" },
    });
  });

  it("rejects on network error", async () => {
    mockGet.mockRejectedValueOnce(new Error("timeout of 10000ms exceeded"));

    await expect(fetchParkingDetails("ChIJtest123")).rejects.toThrow();
  });
});

describe("geocodeZipcode", () => {
  beforeEach(() => {
    mockGet = jest.fn();
  });

  it("returns geocode result on success", async () => {
    mockGet.mockResolvedValueOnce({ data: mockGeocodeResult });

    const result = await geocodeZipcode("94102");

    expect(result.lat).toBe(37.7749);
    expect(result.lng).toBe(-122.4194);
    expect(result.formatted_address).toContain("San Francisco");
  });

  it("calls the correct endpoint with zipcode param", async () => {
    mockGet.mockResolvedValueOnce({ data: mockGeocodeResult });

    await geocodeZipcode("94102");

    expect(mockGet).toHaveBeenCalledWith("/api/geocode", {
      params: { zipcode: "94102" },
    });
  });

  it("rejects on network error", async () => {
    mockGet.mockRejectedValueOnce(new Error("Network Error"));

    await expect(geocodeZipcode("94102")).rejects.toThrow("Network Error");
  });
});
