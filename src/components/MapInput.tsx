"use client";

import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
// Fix for default icon issue with Webpack
import L, { LatLngExpression, LeafletMouseEvent } from "leaflet"; // <-- Import LeafletMouseEvent
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});


interface MapInputProps {
  onLocationChange: (location: { lat: number; lon: number; radius: number }) => void;
  initialLocation?: { lat: number; lon: number; radius: number };
}

function LocationMarker({ onPositionChange }: { onPositionChange: (pos: L.LatLng) => void }) {
  const [position, setPosition] = useState<L.LatLng | null>(null);

  useMapEvents({
    // FIX #2: Explicitly type the event object `e`
    click(e: LeafletMouseEvent) {
      setPosition(e.latlng);
      onPositionChange(e.latlng);
    },
  });
  
  // This logic is fine, no changes needed here.
  useEffect(() => {
    if(!position) {
      // Small improvement: Use a local variable for the map to avoid re-calling getCenter()
      const map = (window as any).leafletMap; // Access the map instance if needed
      if (map && map.getCenter()) {
        setPosition(map.getCenter());
      }
    }
  }, [position]);

  return position === null ? null : (
    <Marker position={position}></Marker>
  );
}

export default function MapInput({ onLocationChange, initialLocation }: MapInputProps) {
  // FIX #1: Define the type for the center state explicitly.
  // LatLngExpression is a more flexible type from Leaflet that covers [number, number]
  const [center, setCenter] = useState<LatLngExpression>(initialLocation ? [initialLocation.lat, initialLocation.lon] : [51.505, -0.09]);
  const [radius, setRadius] = useState(initialLocation?.radius || 5);

  const handlePositionChange = (pos: L.LatLng) => {
    onLocationChange({ lat: pos.lat, lon: pos.lng, radius });
  };

  const handleRadiusChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newRadius = Number(e.target.value);
    setRadius(newRadius);
    // Ensure `center` is in a format L.latLng can use.
    const currentCenter = Array.isArray(center) ? L.latLng(center[0], center[1]) : center;
    onLocationChange({ lat: currentCenter.lat, lon: currentCenter.lng, radius: newRadius });
  }

  return (
    <div className="space-y-4">
      <div className="h-64 w-full rounded-md overflow-hidden">
        {/* Pass the explicitly typed `center` prop */}
        <MapContainer center={center} zoom={13} style={{ height: "100%", width: "100%" }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          <LocationMarker onPositionChange={handlePositionChange} />
        </MapContainer>
      </div>
      <div className="px-2">
        <label htmlFor="radius" className="block text-sm font-medium text-slate-700">
          Search Radius: <span className="font-bold">{radius} km</span>
        </label>
        <input
          id="radius"
          type="range"
          min="1"
          max="50"
          value={radius}
          onChange={handleRadiusChange}
          className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
        />
      </div>
    </div>
  );
}