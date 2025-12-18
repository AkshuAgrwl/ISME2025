import { CircleMarker, Polygon, Circle } from "react-leaflet";
import { useUserLocation } from "@/hooks/useUserLocation";
import { useDeviceHeading } from "@/hooks/useDeviceHeading";
import { computeHeadingCone } from "@/utils/headingCone";

export default function UserLocationLayer() {
  const { position, accuracy } = useUserLocation();
  const heading = useDeviceHeading();

  if (!position) return null;

  const center = {
    lat: position.lat,
    lng: position.lng,
  };

  const cone = heading !== null ? computeHeadingCone(center, heading) : null;

  return (
    <>
      {/* Accuracy circle */}
      {accuracy !== null && (
        <Circle
          center={[center.lat, center.lng]}
          radius={accuracy}
          pathOptions={{
            color: "#60a5fa",
            fillColor: "#93c5fd",
            fillOpacity: 0.25,
            weight: 2,
          }}
        />
      )}

      {/* Direction cone */}
      {cone && (
        <Polygon
          positions={cone}
          pathOptions={{
            color: "#2563eb",
            fillColor: "#3b82f6",
            fillOpacity: 0.7,
            weight: 0,
          }}
        />
      )}

      {/* Location dot */}
      <CircleMarker
        center={[center.lat, center.lng]}
        radius={6}
        pathOptions={{
          color: "#ffffff",
          fillColor: "#2563eb",
          fillOpacity: 1,
          weight: 2,
        }}
      />
    </>
  );
}
