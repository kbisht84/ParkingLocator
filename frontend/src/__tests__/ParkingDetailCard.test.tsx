import React from "react";
import { Linking } from "react-native";
import { fireEvent, render } from "@testing-library/react-native";

import ParkingDetailCard from "../components/ParkingDetailCard";
import type { ParkingDetail } from "../services/api";

// ─── Fixtures ────────────────────────────────────────────────────────────────

const fullDetail: ParkingDetail = {
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

// ─── Helpers ─────────────────────────────────────────────────────────────────

function renderCard(overrides: Partial<ParkingDetail> = {}, loading = false) {
  const onClose = jest.fn();
  const detail = { ...fullDetail, ...overrides };
  const utils = render(<ParkingDetailCard detail={detail} loading={loading} onClose={onClose} />);
  return { ...utils, onClose };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("ParkingDetailCard", () => {
  beforeEach(() => {
    jest.spyOn(Linking, "openURL").mockResolvedValue(undefined);
    jest.spyOn(Linking, "canOpenURL").mockResolvedValue(true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("loading state", () => {
    it("shows activity indicator when loading", () => {
      const { UNSAFE_getByType } = render(
        <ParkingDetailCard detail={null} loading={true} onClose={jest.fn()} />
      );
      const { ActivityIndicator } = require("react-native");
      expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
    });

    it("hides parking name when loading", () => {
      const { queryByText } = render(
        <ParkingDetailCard detail={null} loading={true} onClose={jest.fn()} />
      );
      expect(queryByText("Test Parking Garage")).toBeNull();
    });
  });

  describe("empty state", () => {
    it("renders nothing meaningful when detail is null and not loading", () => {
      const { queryByText } = render(
        <ParkingDetailCard detail={null} loading={false} onClose={jest.fn()} />
      );
      expect(queryByText("Test Parking Garage")).toBeNull();
      expect(queryByText("Open Now")).toBeNull();
    });
  });

  describe("open/closed status badge", () => {
    it("shows Open Now when open_now is true", () => {
      const { getByText } = renderCard({ open_now: true });
      expect(getByText("Open Now")).toBeTruthy();
    });

    it("shows Closed when open_now is false", () => {
      const { getByText } = renderCard({ open_now: false });
      expect(getByText("Closed")).toBeTruthy();
    });

    it("shows Hours Unknown when open_now is null", () => {
      const { getByText } = renderCard({ open_now: null });
      expect(getByText("Hours Unknown")).toBeTruthy();
    });
  });

  describe("parking name", () => {
    it("renders the parking name", () => {
      const { getByText } = renderCard();
      expect(getByText("Test Parking Garage")).toBeTruthy();
    });
  });

  describe("rating", () => {
    it("renders rating value and review count", () => {
      const { getByText } = renderCard({ rating: 4.2, user_ratings_total: 150 });
      expect(getByText("4.2")).toBeTruthy();
      expect(getByText("(150)")).toBeTruthy();
    });

    it("hides rating section when rating is null", () => {
      const { queryByText } = renderCard({ rating: null, user_ratings_total: null });
      expect(queryByText("4.2")).toBeNull();
    });
  });

  describe("address", () => {
    it("renders the formatted address", () => {
      const { getByText } = renderCard();
      expect(getByText("123 Main St, San Francisco, CA 94102")).toBeTruthy();
    });

    it("hides address row when formatted_address is null", () => {
      const { queryByText } = renderCard({ formatted_address: null });
      expect(queryByText("123 Main St, San Francisco, CA 94102")).toBeNull();
    });
  });

  describe("phone number", () => {
    it("renders the phone number", () => {
      const { getByText } = renderCard();
      expect(getByText("(415) 555-0123")).toBeTruthy();
    });

    it("hides phone row when number is null", () => {
      const { queryByText } = renderCard({ formatted_phone_number: null });
      expect(queryByText("(415) 555-0123")).toBeNull();
    });
  });

  describe("opening hours", () => {
    it("renders Opening Hours title", () => {
      const { getByText } = renderCard();
      expect(getByText("Opening Hours")).toBeTruthy();
    });

    it("renders each weekday line", () => {
      const { getByText } = renderCard();
      expect(getByText("Monday: Open 24 hours")).toBeTruthy();
      expect(getByText("Tuesday: Open 24 hours")).toBeTruthy();
    });

    it("hides hours section when weekday_text is null", () => {
      const { queryByText } = renderCard({ weekday_text: null });
      expect(queryByText("Opening Hours")).toBeNull();
    });

    it("hides hours section when weekday_text is empty", () => {
      const { queryByText } = renderCard({ weekday_text: [] });
      expect(queryByText("Opening Hours")).toBeNull();
    });
  });

  describe("website button", () => {
    it("renders Visit Website button when website is present", () => {
      const { getByText } = renderCard();
      expect(getByText("Visit Website")).toBeTruthy();
    });

    it("hides Visit Website button when website is null", () => {
      const { queryByText } = renderCard({ website: null });
      expect(queryByText("Visit Website")).toBeNull();
    });
  });

  describe("interactions", () => {
    it("calls onClose when the close button is pressed", () => {
      const { getByText, onClose } = renderCard();
      fireEvent.press(getByText("✕"));
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("opens website URL when Visit Website is pressed", () => {
      const { getByText } = renderCard();
      fireEvent.press(getByText("Visit Website"));
      expect(Linking.openURL).toHaveBeenCalledWith("https://www.testparking.com");
    });

    it("dials phone number when phone row is pressed", () => {
      const { getByText } = renderCard();
      fireEvent.press(getByText("(415) 555-0123"));
      expect(Linking.openURL).toHaveBeenCalledWith("tel:(415) 555-0123");
    });

    it("opens maps when address row is pressed", () => {
      const { getByText } = renderCard();
      fireEvent.press(getByText("123 Main St, San Francisco, CA 94102"));
      // openInGoogleMaps always calls canOpenURL (sync) with the native maps URL
      // before the async openURL call — we verify this synchronous step.
      expect(Linking.canOpenURL).toHaveBeenCalled();
      const arg = (Linking.canOpenURL as jest.Mock).mock.calls[0][0] as string;
      expect(arg).toMatch(/maps|geo|comgooglemaps/i);
    });
  });
});
