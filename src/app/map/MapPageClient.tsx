"use client";

import dynamic from "next/dynamic";
import {
  POIFeatureCollection,
  PathFeatureCollection,
  BuildingFeatureCollection,
} from "@/types/geo";

const CampusMap = dynamic(() => import("@/components/map/CampusMapClient"), {
  ssr: false,
});

type Props = {
  paths: PathFeatureCollection;
  buildings: BuildingFeatureCollection;
  pois: POIFeatureCollection;
};

export default function MapPageClient(props: Props) {
  return <CampusMap {...props} />;
}
