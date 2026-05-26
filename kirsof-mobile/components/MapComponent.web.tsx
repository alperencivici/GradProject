import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function MapComponent(_: {
  farmers: any[];
  userLocation?: { lat: number; lng: number } | null;
  selectedFarmerId?: string | null;
  onFarmerPress?: (farmer: any) => void;
}) {
  return (
    <View style={styles.centerContainer}>
      <Text style={styles.webText}>Map is not supported on the web preview.</Text>
      <Text style={styles.subText}>Please use Expo Go on an iOS or Android device.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    padding: 20,
  },
  webText: {
    fontSize: 18,
    color: '#374151',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
});
