/**
 * Manual mock for react-native-maps.
 * The real module contains native code that can't run in Jest's jsdom/node environment.
 * This mock exports lightweight React components so any file that imports from
 * react-native-maps can be rendered in tests without native dependencies.
 */

import React from "react";
import { View } from "react-native";

const MapView = jest.fn(({ children, ...props }: any) => (
  <View testID="map-view" {...props}>
    {children}
  </View>
));

const Marker = jest.fn(({ children, ...props }: any) => (
  <View testID="map-marker" {...props}>
    {children}
  </View>
));

const Callout = jest.fn(({ children, ...props }: any) => (
  <View testID="map-callout" {...props}>
    {children}
  </View>
));

export default MapView;
export { Marker, Callout };
export type { Region, LatLng } from "react-native-maps";
