import { useState } from "react";
import { useMapEvents } from "react-leaflet";

export function useMapZoom() {
  const [zoom, setZoom] = useState(0);

  useMapEvents({
    zoomend: (e) => setZoom(e.target.getZoom()),
  });

  return zoom;
}
