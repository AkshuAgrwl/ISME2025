"use client";

import {
  POIFeatureCollection,
  PathFeatureCollection,
  BuildingFeatureCollection,
  POIFeature,
} from "@/types/geo";
import type { GeoJSON as LeafletGeoJSON } from "leaflet";

import "leaflet/dist/leaflet.css";

import R from "react";
import L from "leaflet";

import { LineString } from "geojson";
import {
  MapContainer,
  TileLayer,
  GeoJSON,
  Marker,
  LayersControl,
} from "react-leaflet";
const { BaseLayer } = LayersControl;

import "@/lib/map/leaflet";
import UserLocationLayer from "./UserLocationLayer";
import { useUserLocation, useMapZoom } from "@/hooks";
import {
  aStar,
  haversine,
  buildGraph,
  snapUserToGraph,
  pathToLineString,
  snapEntranceToGraph,
} from "@/lib/map";
import { polygonCentroid } from "@/utils";

type Props = {
  paths: PathFeatureCollection;
  buildings: BuildingFeatureCollection;
  pois: POIFeatureCollection;
};

const EMPTY_GEOJSON: GeoJSON.FeatureCollection = {
  type: "FeatureCollection",
  features: [],
};

function findNearestPOI(
  lat: number,
  lng: number,
  pois: POIFeature[]
): POIFeature {
  let best: POIFeature | null = null;
  let bestDist = Infinity;

  for (const poi of pois) {
    const [poiLng, poiLat] = poi.geometry.coordinates;
    const d = haversine(lat, lng, poiLat, poiLng);

    if (d < bestDist) {
      bestDist = d;
      best = poi;
    }
  }

  if (!best) {
    throw new Error("No POIs available");
  }

  return best;
}

const fromPoiIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const toPoiIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function createArrowIcon(bearing: number, color: string): L.DivIcon {
  return L.divIcon({
    className: "route-arrow",
    html: `
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        style="
          transform: rotate(${bearing - 90}deg);
          transform-origin: 50% 50%;
        "
      >
        <!-- Pure arrowhead -->
        <path
          d="M4 4 L20 12 L4 20 Z"
          fill="${color}"
        />
      </svg>
    `,
    iconSize: [25, 25],
    iconAnchor: [11, 11],
  });
}

function buildingLabelIcon(name: string) {
  return L.divIcon({
    className: "building-label",
    html: name,
    iconSize: undefined,
    iconAnchor: [0, 0],
  });
}

function BuildingLabels({
  buildings,
}: {
  buildings: BuildingFeatureCollection;
}) {
  const zoom = useMapZoom();

  console.log(zoom);

  if (zoom < 16 && zoom != 0) return null;

  return (
    <>
      {buildings.features.map((b) => {
        if (b.geometry.type !== "Polygon") return null;
        if (!b.properties?.name) return null;

        const center = polygonCentroid(b.geometry.coordinates[0]);

        return (
          <Marker
            key={b.properties.name}
            position={center}
            icon={buildingLabelIcon(b.properties.name)}
            interactive={false}
          />
        );
      })}
    </>
  );
}

function bearingDeg(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const toDeg = (v: number) => (v * 180) / Math.PI;

  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δλ = toRad(lng2 - lng1);

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x =
    Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

export default function CampusMap({ paths, buildings, pois }: Props) {
  const { position, accuracy } = useUserLocation();

  const FROM_CURRENT = "__CURRENT__";
  const [fromId, setFromId] = R.useState<string>(FROM_CURRENT);
  const [toId, setToId] = R.useState<string | null>(null);

  const [route, setRoute] = R.useState<LineString | null>(null);
  const [loading, setLoading] = R.useState(false);

  const routeLayerRef = R.useRef<LeafletGeoJSON | null>(null);
  const graph = R.useMemo(() => buildGraph(paths), [paths]);

  const fromPoi =
    fromId !== "__CURRENT__"
      ? pois.features.find((p) => p.properties.id === fromId) ?? null
      : null;

  const toPoi = toId
    ? pois.features.find((p) => p.properties.id === toId) ?? null
    : null;

  const computeRoute = R.useCallback(() => {
    if (!toId) return;

    const toPoi = pois.features.find((p) => p.properties.id === toId);
    if (!toPoi) return;

    setLoading(true);

    try {
      let startNodeId: string;
      let prependUserPoint: [number, number] | null = null;

      // -------- FROM CURRENT LOCATION --------
      if (fromId === FROM_CURRENT) {
        if (!position) {
          alert("Waiting for GPS fix…");
          return;
        }

        try {
          const userSnap = snapUserToGraph(
            graph,
            position.lat,
            position.lng,
            accuracy ?? undefined
          );

          startNodeId = userSnap.node.id;
          prependUserPoint = [userSnap.projected.lng, userSnap.projected.lat];
        } catch {
          // ❗ fallback to nearest POI
          const nearestPoi = findNearestPOI(
            position.lat,
            position.lng,
            pois.features
          );

          setFromId(nearestPoi.properties.id);

          alert(
            `Oops! Cannot find a path from your location.\nUsing "${nearestPoi.properties.name}" as nearest point...`
          );
          return; // rerun via useEffect
        }
      }

      // -------- FROM POI --------
      else {
        const fromPoi = pois.features.find((p) => p.properties.id === fromId);
        if (!fromPoi) return;

        const node = snapEntranceToGraph(
          graph,
          fromPoi.geometry.coordinates[1],
          fromPoi.geometry.coordinates[0]
        );

        startNodeId = node.id;
      }

      // -------- TO NODE --------
      const endNode = snapEntranceToGraph(
        graph,
        toPoi.geometry.coordinates[1],
        toPoi.geometry.coordinates[0]
      );

      if (startNodeId === endNode.id) {
        setRoute(null);
        return;
      }

      const nodePath = aStar(graph, startNodeId, endNode.id);

      if (nodePath.length === 0) {
        setRoute(null);
        return;
      }

      const baseLine = pathToLineString(graph, nodePath);

      const finalLine: LineString =
        prependUserPoint !== null
          ? {
              type: "LineString",
              coordinates: [prependUserPoint, ...baseLine.coordinates],
            }
          : baseLine;

      setRoute(finalLine);
    } catch (err) {
      console.error(err);
      setRoute(null);
    } finally {
      setLoading(false);
    }
  }, [fromId, toId, position, accuracy, graph, pois]);

  const arrowMarkers = R.useMemo(() => {
    if (!route) return [];

    const markers: {
      position: [number, number];
      rotation: number;
    }[] = [];

    const coords = route.coordinates;

    for (let i = 0; i < coords.length - 1; i++) {
      const [lng1, lat1] = coords[i];
      const [lng2, lat2] = coords[i + 1];

      // midpoint
      const lat = (lat1 + lat2) / 2;
      const lng = (lng1 + lng2) / 2;

      const rotation = bearingDeg(lat1, lng1, lat2, lng2);

      markers.push({
        position: [lat, lng],
        rotation,
      });
    }

    return markers;
  }, [route]);

  R.useEffect(() => {
    computeRoute();
  }, [computeRoute]);

  R.useEffect(() => {
    if (!routeLayerRef.current) return;

    routeLayerRef.current.clearLayers();
    if (route) routeLayerRef.current.addData(route);
  }, [route]);

  return (
    <>
      <div
        style={{
          position: "absolute",
          top: 12,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 1000,
          padding: "5px 10px",
          display: "flex",
          gap: 10,
          color: "black",
          background: "rgba(0,0,0,0.5)",
          borderRadius: 6,
          alignItems: "center",
        }}
      >
        {/* FROM */}
        <div
          style={{
            background: "white",
            padding: 6,
            borderRadius: 4,
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          }}
        >
          <select value={fromId} onChange={(e) => setFromId(e.target.value)}>
            <option value={FROM_CURRENT}>From: Current location</option>

            {pois.features.map((poi) => (
              <option key={poi.properties.id} value={poi.properties.id}>
                {poi.properties.name}
              </option>
            ))}
          </select>
        </div>

        <div style={{ width: 50, color: "white" }}>
          <svg
            width="100%"
            height="100%"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M6 17L11 12L6 7M13 17L18 12L13 7"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {/* TO */}
        <div
          style={{
            background: "white",
            padding: 6,
            borderRadius: 4,
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          }}
        >
          <select
            value={toId ?? ""}
            onChange={(e) => setToId(e.target.value || null)}
          >
            <option value="" disabled>
              To: Select destination
            </option>

            {pois.features.map((poi) => (
              <option key={poi.properties.id} value={poi.properties.id}>
                {poi.properties.name}
              </option>
            ))}
          </select>
        </div>

        {loading && <span>Routing…</span>}
      </div>

      <MapContainer
        center={[26.934990724917075, 75.92296487254912]}
        zoom={18}
        style={{ height: "100vh", width: "100%" }}
      >
        <LayersControl position="topright">
          <BaseLayer checked name="Satellite">
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              attribution="© Esri"
            />
          </BaseLayer>

          <BaseLayer name="Standard Map">
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="© OpenStreetMap"
            />
          </BaseLayer>
        </LayersControl>

        <GeoJSON
          data={buildings}
          style={{
            color: "#64748b",
            weight: 1,
            fillColor: "#94a3b8",
            fillOpacity: 0.35,
          }}
        />

        <GeoJSON
          data={paths}
          style={{
            color: "aquamarine",
            weight: 3,
            opacity: 0.6,
            lineCap: "round",
            lineJoin: "round",
          }}
        />

        <BuildingLabels buildings={buildings} />

        {arrowMarkers.map((a, i) => (
          <Marker
            key={`arrow-${i}`}
            position={a.position}
            icon={createArrowIcon(a.rotation, "#2563eb")}
            interactive={false}
          />
        ))}

        <GeoJSON
          ref={routeLayerRef}
          data={EMPTY_GEOJSON}
          style={{ color: "#c21414", weight: 5 }}
        />

        {fromPoi && (
          <Marker
            position={[
              fromPoi.geometry.coordinates[1],
              fromPoi.geometry.coordinates[0],
            ]}
            icon={fromPoiIcon}
          />
        )}
        {toPoi && (
          <Marker
            position={[
              toPoi.geometry.coordinates[1],
              toPoi.geometry.coordinates[0],
            ]}
            icon={toPoiIcon}
          />
        )}

        <UserLocationLayer />
      </MapContainer>
    </>
  );
}
