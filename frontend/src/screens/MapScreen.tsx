import React, { useEffect, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Alert,
  Platform,
  ActivityIndicator,
  TextInput,
  Keyboard,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE, Region } from "react-native-maps";
import * as Location from "expo-location";
import {
  fetchNearbyParking,
  fetchParkingDetails,
  geocodeZipcode,
  ParkingSpot,
  ParkingDetail,
} from "../services/api";
import ParkingDetailCard from "../components/ParkingDetailCard";
import { DEFAULT_SEARCH_RADIUS } from "../constants/config";

const RADIUS_OPTIONS = [500, 1000, 1500, 3000];

export default function MapScreen() {
  const mapRef = useRef<MapView>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [searchCenter, setSearchCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [parkingSpots, setParkingSpots] = useState<ParkingSpot[]>([]);
  const [selectedSpot, setSelectedSpot] = useState<ParkingSpot | null>(null);
  const [detail, setDetail] = useState<ParkingDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [mapLoading, setMapLoading] = useState(true);
  const [radius, setRadius] = useState(DEFAULT_SEARCH_RADIUS);
  const [fetchingParking, setFetchingParking] = useState(false);
  const [zipInput, setZipInput] = useState("");
  const [geocoding, setGeocoding] = useState(false);
  const [searchLabel, setSearchLabel] = useState<string | null>(null);

  useEffect(() => {
    requestLocationAndLoad();
  }, []);

  async function requestLocationAndLoad() {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Location Required",
        "Please enable location access to find nearby parking.",
        [{ text: "OK" }]
      );
      setMapLoading(false);
      return;
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    const coords = {
      lat: location.coords.latitude,
      lng: location.coords.longitude,
    };
    setUserLocation(coords);
    setSearchCenter(coords);
    setMapLoading(false);
    loadNearbyParking(coords.lat, coords.lng, radius);
  }

  async function loadNearbyParking(lat: number, lng: number, searchRadius: number) {
    setFetchingParking(true);
    try {
      const spots = await fetchNearbyParking(lat, lng, searchRadius);
      setParkingSpots(spots);
    } catch {
      Alert.alert("Error", "Could not load nearby parking. Check your connection.");
    } finally {
      setFetchingParking(false);
    }
  }

  async function handleZipSearch() {
    const zip = zipInput.trim();
    if (!zip) return;
    Keyboard.dismiss();
    setGeocoding(true);
    try {
      const result = await geocodeZipcode(zip);
      setSearchCenter({ lat: result.lat, lng: result.lng });
      setSearchLabel(result.formatted_address);
      setParkingSpots([]);
      mapRef.current?.animateToRegion({
        latitude: result.lat,
        longitude: result.lng,
        latitudeDelta: 0.04,
        longitudeDelta: 0.04,
      });
      loadNearbyParking(result.lat, result.lng, radius);
    } catch {
      Alert.alert("Not Found", "Could not find that ZIP code. Please try again.");
    } finally {
      setGeocoding(false);
    }
  }

  function handleUseMyLocation() {
    if (!userLocation) return;
    setZipInput("");
    setSearchLabel(null);
    setSearchCenter(userLocation);
    setParkingSpots([]);
    mapRef.current?.animateToRegion({
      latitude: userLocation.lat,
      longitude: userLocation.lng,
      latitudeDelta: 0.02,
      longitudeDelta: 0.02,
    });
    loadNearbyParking(userLocation.lat, userLocation.lng, radius);
  }

  async function handleMarkerPress(spot: ParkingSpot) {
    setSelectedSpot(spot);
    setDetail(null);
    setDetailLoading(true);
    try {
      const d = await fetchParkingDetails(spot.place_id);
      setDetail(d);
    } catch {
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  }

  function handleCloseCard() {
    setSelectedSpot(null);
    setDetail(null);
  }

  function handleRadiusChange(r: number) {
    setRadius(r);
    if (searchCenter) {
      setParkingSpots([]);
      loadNearbyParking(searchCenter.lat, searchCenter.lng, r);
    }
  }

  function centerOnUser() {
    if (userLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: userLocation.lat,
        longitude: userLocation.lng,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }
  }

  if (mapLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1a73e8" />
        <Text style={styles.loadingText}>Getting your location...</Text>
      </View>
    );
  }

  const initialRegion: Region | undefined = userLocation
    ? {
        latitude: userLocation.lat,
        longitude: userLocation.lng,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      }
    : undefined;

  const topOffset = Platform.OS === "ios" ? 56 : 40;

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={initialRegion}
        showsUserLocation
        showsMyLocationButton={false}
      >
        {parkingSpots.map((spot) => (
          <Marker
            key={spot.place_id}
            coordinate={{ latitude: spot.lat, longitude: spot.lng }}
            onPress={() => handleMarkerPress(spot)}
          >
            <View
              style={[
                styles.marker,
                selectedSpot?.place_id === spot.place_id && styles.markerSelected,
              ]}
            >
              <Text style={styles.markerEmoji}>🅿️</Text>
            </View>
          </Marker>
        ))}
      </MapView>

      {/* Header */}
      <View style={[styles.header, { top: topOffset }]}>
        <Text style={styles.headerTitle}>Parking Locator</Text>
        {fetchingParking && (
          <ActivityIndicator size="small" color="#1a73e8" style={styles.headerLoader} />
        )}
      </View>

      {/* ZIP Code Search Bar */}
      <View style={[styles.searchBar, { top: topOffset + 60 }]}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by ZIP code..."
          placeholderTextColor="#aaa"
          value={zipInput}
          onChangeText={setZipInput}
          keyboardType="number-pad"
          returnKeyType="search"
          onSubmitEditing={handleZipSearch}
          maxLength={10}
        />
        {geocoding ? (
          <ActivityIndicator size="small" color="#1a73e8" style={styles.searchAction} />
        ) : (
          <TouchableOpacity onPress={handleZipSearch} style={styles.searchAction}>
            <Text style={styles.searchBtn}>Go</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Active search label + "Use my location" reset */}
      {searchLabel && (
        <View style={[styles.searchLabelRow, { top: topOffset + 114 }]}>
          <Text style={styles.searchLabelText} numberOfLines={1}>
            📌 {searchLabel}
          </Text>
          <TouchableOpacity onPress={handleUseMyLocation}>
            <Text style={styles.resetText}>Use my location</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Radius Filter Pills */}
      <View
        style={[
          styles.radiusBar,
          { top: searchLabel ? topOffset + 158 : topOffset + 114 },
        ]}
      >
        {RADIUS_OPTIONS.map((r) => (
          <TouchableOpacity
            key={r}
            style={[styles.radiusPill, radius === r && styles.radiusPillActive]}
            onPress={() => handleRadiusChange(r)}
          >
            <Text style={[styles.radiusPillText, radius === r && styles.radiusPillTextActive]}>
              {r >= 1000 ? `${r / 1000}km` : `${r}m`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Parking count badge */}
      {parkingSpots.length > 0 && !fetchingParking && (
        <View
          style={[
            styles.countBadge,
            { top: searchLabel ? topOffset + 202 : topOffset + 158 },
          ]}
        >
          <Text style={styles.countText}>{parkingSpots.length} parking spots found</Text>
        </View>
      )}

      {/* Center on user button */}
      <TouchableOpacity style={styles.myLocationBtn} onPress={centerOnUser}>
        <Text style={styles.myLocationIcon}>◎</Text>
      </TouchableOpacity>

      {/* Refresh button */}
      <TouchableOpacity
        style={styles.refreshBtn}
        onPress={() =>
          searchCenter && loadNearbyParking(searchCenter.lat, searchCenter.lng, radius)
        }
      >
        <Text style={styles.refreshIcon}>↻</Text>
      </TouchableOpacity>

      {/* Detail Card */}
      {selectedSpot && (
        <ParkingDetailCard
          detail={detail}
          loading={detailLoading}
          onClose={handleCloseCard}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    gap: 12,
  },
  loadingText: { fontSize: 16, color: "#555" },
  header: {
    position: "absolute",
    left: 16,
    right: 16,
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 5,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1a73e8",
    flex: 1,
  },
  headerLoader: { marginLeft: 8 },
  searchBar: {
    position: "absolute",
    left: 16,
    right: 16,
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 4,
  },
  searchIcon: { fontSize: 15, marginRight: 6 },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#333",
    paddingVertical: 2,
  },
  searchAction: { marginLeft: 8 },
  searchBtn: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1a73e8",
  },
  searchLabelRow: {
    position: "absolute",
    left: 16,
    right: 16,
    backgroundColor: "#e8f0fe",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  searchLabelText: {
    flex: 1,
    fontSize: 12,
    color: "#1a73e8",
    fontWeight: "500",
    marginRight: 8,
  },
  resetText: {
    fontSize: 12,
    color: "#1a73e8",
    fontWeight: "700",
    textDecorationLine: "underline",
  },
  radiusBar: {
    position: "absolute",
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 16,
  },
  radiusPill: {
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  radiusPillActive: { backgroundColor: "#1a73e8" },
  radiusPillText: { fontSize: 13, fontWeight: "600", color: "#444" },
  radiusPillTextActive: { color: "#fff" },
  countBadge: {
    position: "absolute",
    alignSelf: "center",
    backgroundColor: "rgba(26,115,232,0.9)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  countText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  myLocationBtn: {
    position: "absolute",
    right: 16,
    bottom: 120,
    backgroundColor: "#fff",
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 5,
  },
  myLocationIcon: { fontSize: 22, color: "#1a73e8" },
  refreshBtn: {
    position: "absolute",
    right: 16,
    bottom: 64,
    backgroundColor: "#1a73e8",
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  refreshIcon: { fontSize: 22, color: "#fff", fontWeight: "700" },
  marker: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  markerEmoji: {
    fontSize: 26,
  },
  markerSelected: {
    backgroundColor: "#e8f0fe",
    borderWidth: 2,
    borderColor: "#1a73e8",
  },
});
