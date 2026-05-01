"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import Link from "next/link";

// Fix default marker icons
const DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const SelectedIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [30, 49],
  iconAnchor: [15, 49],
  popupAnchor: [1, -40],
  shadowSize: [49, 49],
  className: "selected-marker",
});

// User location icon
const UserIcon = L.divIcon({
  html: `<div style="
    width: 20px; height: 20px;
    background: #2563eb;
    border: 3px solid white;
    border-radius: 50%;
    box-shadow: 0 0 0 4px rgba(37,99,235,0.3);
  "></div>`,
  className: "",
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface Farmer {
  id: string;
  full_name: string;
  address: string;
  location_lat: number;
  location_lng: number;
  avatar_url?: string;
  phone?: string;
}

function FlyToSelected({ farmers, selectedId }: { farmers: Farmer[]; selectedId: string | null }) {
  const map = useMap();
  useEffect(() => {
    if (selectedId) {
      const farmer = farmers.find((f) => f.id === selectedId);
      if (farmer) {
        map.flyTo([Number(farmer.location_lat), Number(farmer.location_lng)], 12, { duration: 1.0 });
      }
    }
  }, [selectedId, farmers, map]);
  return null;
}

// Fly to user location when it becomes available
function FlyToUser({ location }: { location: { lat: number; lng: number } | null }) {
  const map = useMap();
  useEffect(() => {
    if (location) {
      map.flyTo([location.lat, location.lng], 7, { duration: 1.2 });
    }
  }, [location, map]);
  return null;
}

export default function MapSection({
  farmers,
  selectedFarmerId,
  userLocation,
}: {
  farmers: Farmer[];
  selectedFarmerId?: string | null;
  userLocation?: { lat: number; lng: number } | null;
}) {
  const center: [number, number] =
    userLocation
      ? [userLocation.lat, userLocation.lng]
      : farmers.length > 0
      ? [Number(farmers[0].location_lat), Number(farmers[0].location_lng)]
      : [39.9334, 32.8597];

  return (
    <MapContainer
      center={center}
      zoom={7}
      style={{ width: "100%", height: "100%" }}
      className="z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FlyToSelected farmers={farmers} selectedId={selectedFarmerId || null} />
      <FlyToUser location={userLocation || null} />

      {/* 500km delivery radius circle */}
      {userLocation && (
        <>
          <Circle
            center={[userLocation.lat, userLocation.lng]}
            radius={500_000} // 500km in metres
            pathOptions={{
              color: "#059669",
              fillColor: "#10b981",
              fillOpacity: 0.06,
              weight: 2,
              dashArray: "8 6",
            }}
          />
          {/* User location marker */}
          <Marker position={[userLocation.lat, userLocation.lng]} icon={UserIcon}>
            <Popup maxWidth={220}>
              <div style={{ padding: "6px 4px", textAlign: "center" }}>
                <div style={{ fontWeight: 700, color: "#1e40af", marginBottom: 4 }}>📍 Your Location</div>
                <div style={{ fontSize: 12, color: "#64748b" }}>500km delivery radius shown</div>
              </div>
            </Popup>
          </Marker>
        </>
      )}

      {farmers.map((farmer) => (
        <Marker
          key={farmer.id}
          position={[Number(farmer.location_lat), Number(farmer.location_lng)]}
          icon={selectedFarmerId === farmer.id ? SelectedIcon : DefaultIcon}
        >
          <Popup maxWidth={320} minWidth={280}>
            <div style={{ padding: "8px 4px", fontFamily: "inherit" }}>
              {/* Header */}
              <div style={{ background: "linear-gradient(135deg, #059669, #10b981)", borderRadius: "16px", padding: "20px", marginBottom: "16px", color: "white", textAlign: "center" }}>
                <div style={{ width: "56px", height: "56px", borderRadius: "16px", background: "rgba(255,255,255,0.25)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", fontSize: "24px", fontWeight: "800", border: "2px solid rgba(255,255,255,0.3)" }}>
                  {farmer.full_name?.charAt(0)}
                </div>
                <h3 style={{ fontSize: "18px", fontWeight: "800", margin: "0 0 4px 0", letterSpacing: "-0.01em" }}>{farmer.full_name}</h3>
                <span style={{ fontSize: "11px", background: "rgba(255,255,255,0.2)", padding: "3px 10px", borderRadius: "999px", fontWeight: "600" }}>
                  🌾 Verified Farmer
                </span>
              </div>

              {/* Info rows */}
              <div style={{ marginBottom: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 0", borderBottom: "1px solid #f5f5f4" }}>
                  <span style={{ fontSize: "16px" }}>📍</span>
                  <div>
                    <div style={{ fontSize: "10px", color: "#a8a29e", fontWeight: "600", textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>Location</div>
                    <div style={{ fontSize: "13px", color: "#44403c", fontWeight: "600" }}>{farmer.address || "Local Farm"}</div>
                  </div>
                </div>
                {farmer.phone && (
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 0", borderBottom: "1px solid #f5f5f4" }}>
                    <span style={{ fontSize: "16px" }}>📞</span>
                    <div>
                      <div style={{ fontSize: "10px", color: "#a8a29e", fontWeight: "600", textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>Phone</div>
                      <div style={{ fontSize: "13px", color: "#44403c", fontWeight: "600" }}>{farmer.phone}</div>
                    </div>
                  </div>
                )}
                <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 0" }}>
                  <span style={{ fontSize: "16px" }}>🗺️</span>
                  <div>
                    <div style={{ fontSize: "10px", color: "#a8a29e", fontWeight: "600", textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>Coordinates</div>
                    <div style={{ fontSize: "12px", color: "#78716c", fontWeight: "500", fontFamily: "monospace" }}>
                      {Number(farmer.location_lat).toFixed(4)}, {Number(farmer.location_lng).toFixed(4)}
                    </div>
                  </div>
                </div>
              </div>

              {/* CTA Button */}
              <Link
                href={`/farmers/${farmer.id}`}
                style={{ display: "block", background: "linear-gradient(135deg, #059669, #10b981)", color: "white", textAlign: "center", padding: "12px 20px", borderRadius: "12px", fontWeight: "700", fontSize: "14px", textDecoration: "none", transition: "all 0.2s", boxShadow: "0 4px 14px rgba(5, 150, 105, 0.3)" }}
              >
                Visit Farm Store →
              </Link>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
