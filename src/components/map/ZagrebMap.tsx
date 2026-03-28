"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

// Zagreb city center coordinates
const ZAGREB_CENTER: [number, number] = [15.9819, 45.815];

interface Marker {
  id: string;
  lng: number;
  lat: number;
  title: string;
  description?: string;
}

interface ZagrebMapProps {
  markers?: Marker[];
  zoom?: number;
  className?: string;
}

export function ZagrebMap({
  markers = [],
  zoom = 13,
  className = "",
}: ZagrebMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token) return;

    mapboxgl.accessToken = token;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: ZAGREB_CENTER,
      zoom,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");
  }, [zoom]);

  // Add/update markers
  useEffect(() => {
    if (!map.current) return;

    markers.forEach((marker) => {
      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(
        `<strong>${marker.title}</strong>${marker.description ? `<p>${marker.description}</p>` : ""}`
      );

      new mapboxgl.Marker()
        .setLngLat([marker.lng, marker.lat])
        .setPopup(popup)
        .addTo(map.current!);
    });
  }, [markers]);

  if (!process.env.NEXT_PUBLIC_MAPBOX_TOKEN) {
    return (
      <div
        className={`w-full min-h-[400px] rounded-xl border border-dashed flex items-center justify-center text-muted-foreground text-sm ${className}`}
      >
        Add <code className="mx-1 px-1 rounded bg-muted">NEXT_PUBLIC_MAPBOX_TOKEN</code> to .env.local to enable the map
      </div>
    );
  }

  return (
    <div
      ref={mapContainer}
      className={`w-full h-full min-h-[400px] rounded-xl overflow-hidden ${className}`}
    />
  );
}
