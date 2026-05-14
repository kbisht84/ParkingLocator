import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Linking,
  Platform,
} from "react-native";
import { ParkingDetail } from "../services/api";

interface Props {
  detail: ParkingDetail | null;
  loading: boolean;
  onClose: () => void;
}

export default function ParkingDetailCard({ detail, loading, onClose }: Props) {
  const openWebsite = () => {
    if (detail?.website) Linking.openURL(detail.website);
  };

  const callPhone = () => {
    if (detail?.formatted_phone_number) {
      Linking.openURL(`tel:${detail.formatted_phone_number}`);
    }
  };

  const openInGoogleMaps = () => {
    if (!detail) return;
    const query = encodeURIComponent(detail.formatted_address || `${detail.lat},${detail.lng}`);
    const nativeUrl = Platform.select({
      ios: `comgooglemaps://?q=${query}&center=${detail.lat},${detail.lng}`,
      android: `geo:${detail.lat},${detail.lng}?q=${query}`,
    });
    const webUrl = `https://www.google.com/maps/search/?api=1&query=${query}`;

    if (nativeUrl) {
      Linking.canOpenURL(nativeUrl).then((supported) => {
        Linking.openURL(supported ? nativeUrl : webUrl);
      });
    } else {
      Linking.openURL(webUrl);
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.handle} />
      <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
        <Text style={styles.closeBtnText}>✕</Text>
      </TouchableOpacity>

      {loading ? (
        <ActivityIndicator size="large" color="#1a73e8" style={styles.loader} />
      ) : detail ? (
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={styles.name}>{detail.name}</Text>

          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusBadge,
                detail.open_now === true
                  ? styles.openBadge
                  : detail.open_now === false
                  ? styles.closedBadge
                  : styles.unknownBadge,
              ]}
            >
              <Text style={styles.statusText}>
                {detail.open_now === true
                  ? "Open Now"
                  : detail.open_now === false
                  ? "Closed"
                  : "Hours Unknown"}
              </Text>
            </View>

            {detail.rating !== null && (
              <View style={styles.ratingRow}>
                <Text style={styles.star}>★</Text>
                <Text style={styles.rating}>{detail.rating.toFixed(1)}</Text>
                {detail.user_ratings_total !== null && (
                  <Text style={styles.ratingCount}>
                    ({detail.user_ratings_total.toLocaleString()})
                  </Text>
                )}
              </View>
            )}
          </View>

          {detail.formatted_address && (
            <TouchableOpacity style={styles.infoRow} onPress={openInGoogleMaps}>
              <Text style={styles.infoIcon}>📍</Text>
              <Text style={[styles.infoText, styles.link]}>{detail.formatted_address}</Text>
              <Text style={styles.mapsHint}>↗</Text>
            </TouchableOpacity>
          )}

          {detail.formatted_phone_number && (
            <TouchableOpacity style={styles.infoRow} onPress={callPhone}>
              <Text style={styles.infoIcon}>📞</Text>
              <Text style={[styles.infoText, styles.link]}>
                {detail.formatted_phone_number}
              </Text>
            </TouchableOpacity>
          )}

          {detail.weekday_text && detail.weekday_text.length > 0 && (
            <View style={styles.hoursContainer}>
              <Text style={styles.hoursTitle}>Opening Hours</Text>
              {detail.weekday_text.map((line, idx) => (
                <Text key={idx} style={styles.hoursLine}>
                  {line}
                </Text>
              ))}
            </View>
          )}

          {detail.website && (
            <TouchableOpacity style={styles.websiteBtn} onPress={openWebsite}>
              <Text style={styles.websiteBtnText}>Visit Website</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "55%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 10,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: "#ddd",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 12,
  },
  closeBtn: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 15,
  },
  closeBtnText: {
    fontSize: 14,
    color: "#555",
  },
  loader: {
    marginTop: 30,
    marginBottom: 20,
  },
  name: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 10,
    paddingRight: 30,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
    gap: 10,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  openBadge: { backgroundColor: "#e6f4ea" },
  closedBadge: { backgroundColor: "#fce8e6" },
  unknownBadge: { backgroundColor: "#f5f5f5" },
  statusText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#333",
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  star: { fontSize: 14, color: "#f9a825" },
  rating: { fontSize: 14, fontWeight: "600", color: "#333" },
  ratingCount: { fontSize: 12, color: "#888" },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
    gap: 8,
  },
  infoIcon: { fontSize: 15, marginTop: 1 },
  infoText: { flex: 1, fontSize: 14, color: "#444", lineHeight: 20 },
  link: { color: "#1a73e8" },
  mapsHint: { fontSize: 14, color: "#1a73e8", alignSelf: "center" },
  hoursContainer: {
    marginTop: 8,
    marginBottom: 8,
    backgroundColor: "#f8f9fa",
    borderRadius: 10,
    padding: 12,
  },
  hoursTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#333",
    marginBottom: 6,
  },
  hoursLine: { fontSize: 12, color: "#555", lineHeight: 18 },
  websiteBtn: {
    marginTop: 12,
    backgroundColor: "#1a73e8",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  websiteBtnText: { color: "#fff", fontWeight: "600", fontSize: 15 },
});
