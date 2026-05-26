import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MapView, { Callout, Marker } from 'react-native-maps';
import { palette } from '@/components/kirsof';

export default function MapComponent({
  farmers,
  userLocation,
  selectedFarmerId,
  onFarmerPress,
}: {
  farmers: any[];
  userLocation?: { lat: number; lng: number } | null;
  selectedFarmerId?: string | null;
  onFarmerPress?: (farmer: any) => void;
}) {
  const firstFarmer = farmers.find((farmer) => farmer.location_lat && farmer.location_lng);
  const center = userLocation
    ? { latitude: userLocation.lat, longitude: userLocation.lng }
    : firstFarmer
      ? { latitude: Number(firstFarmer.location_lat), longitude: Number(firstFarmer.location_lng) }
      : { latitude: 39.92077, longitude: 32.85411 };

  return (
    <MapView
      style={styles.map}
      initialRegion={{
        ...center,
        latitudeDelta: 2.5,
        longitudeDelta: 2.5,
      }}
    >
      {userLocation ? (
        <Marker
          coordinate={{ latitude: userLocation.lat, longitude: userLocation.lng }}
          title="Your profile location"
          pinColor="#2563eb"
        />
      ) : null}

      {farmers.map((farmer) => {
        if (!farmer.location_lat || !farmer.location_lng) return null;
        const selected = selectedFarmerId === farmer.id;
        return (
          <Marker
            key={farmer.id}
            coordinate={{
              latitude: Number(farmer.location_lat),
              longitude: Number(farmer.location_lng),
            }}
            title={farmer.full_name}
            description={farmer.address || 'Farmer'}
            pinColor={selected ? palette.emeraldDark : palette.emerald}
          >
            <Callout onPress={() => onFarmerPress?.(farmer)}>
              <View style={styles.callout}>
                <Text style={styles.calloutTitle}>{farmer.full_name}</Text>
                <Text style={styles.calloutDesc}>{farmer.address || 'Location set'}</Text>
                <Text style={styles.calloutAction}>Open store</Text>
              </View>
            </Callout>
          </Marker>
        );
      })}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  callout: {
    width: 210,
    padding: 8,
  },
  calloutTitle: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 4,
  },
  calloutDesc: {
    color: '#4b5563',
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 8,
  },
  calloutAction: {
    color: palette.emeraldDark,
    fontSize: 12,
    fontWeight: '900',
  },
});
