"use client";

import { useEffect, useState } from "react";
import { LatLng } from "@/types/location";

type LocationState = {
  position: LatLng | null;
  accuracy: number | null;
  error: string | null;
};

const initialState: LocationState = {
  position: null,
  accuracy: null,
  error:
    typeof navigator !== "undefined" && !navigator.geolocation
      ? "Geolocation not supported"
      : null,
};

export function useUserLocation(): LocationState {
  const [state, setState] = useState<LocationState>(initialState);

  useEffect(() => {
    if (!navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setState({
          position: {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          },
          accuracy: pos.coords.accuracy,
          error: null,
        });
      },
      (err) => {
        setState((prev) => ({
          ...prev,
          error: err.message,
        }));
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 10000,
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  return state;
}
