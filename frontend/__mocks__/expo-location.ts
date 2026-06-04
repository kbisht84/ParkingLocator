/**
 * Manual mock for expo-location.
 * Real module requires device GPS hardware not available in Jest.
 */

export const PermissionStatus = {
  GRANTED: "granted",
  DENIED: "denied",
  UNDETERMINED: "undetermined",
};

export const requestForegroundPermissionsAsync = jest.fn().mockResolvedValue({
  status: "granted",
});

export const getCurrentPositionAsync = jest.fn().mockResolvedValue({
  coords: {
    latitude: 37.7749,
    longitude: -122.4194,
    accuracy: 10,
    altitude: 0,
    altitudeAccuracy: 0,
    heading: 0,
    speed: 0,
  },
  timestamp: Date.now(),
});

export const Accuracy = {
  Lowest: 1,
  Low: 2,
  Balanced: 3,
  High: 4,
  Highest: 5,
  BestForNavigation: 6,
};
