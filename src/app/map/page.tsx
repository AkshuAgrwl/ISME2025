// // import dynamic from "next/dynamic";

// // const CampusMap = dynamic(() => import("@/components/map/CampusMapClient"), {
// //   ssr: false,
// // });

// import CampusMap from "@/components/map/CampusMap";

// import {
//   POIFeatureCollection,
//   PathFeatureCollection,
//   BuildingFeatureCollection,
// } from "@/types/geo";

// import CampusBuidings from "@/data/campus_buildings.json";
// import CampusPaths from "@/data/campus_paths.json";
// import CampusPOIs from "@/data/campus_pois.json";

// export default async function Page() {
//   const buildings = CampusBuidings as BuildingFeatureCollection;
//   const paths = CampusPaths as PathFeatureCollection;
//   const pois = CampusPOIs as POIFeatureCollection;

//   return <CampusMap paths={paths} buildings={buildings} pois={pois} />;
// }

import MapPageClient from "./MapPageClient";
import {
  POIFeatureCollection,
  PathFeatureCollection,
  BuildingFeatureCollection,
} from "@/types/geo";

import CampusBuidings from "@/data/campus_buildings.json";
import CampusPaths from "@/data/campus_paths.json";
import CampusPOIs from "@/data/campus_pois.json";

// however you already load data
export default async function Page() {
  // const paths: PathFeatureCollection = /* load */;
  // const buildings: BuildingFeatureCollection = /* load */;
  // const pois: POIFeatureCollection = /* load */;

  const buildings = CampusBuidings as BuildingFeatureCollection;
  const paths = CampusPaths as PathFeatureCollection;
  const pois = CampusPOIs as POIFeatureCollection;

  return <MapPageClient paths={paths} buildings={buildings} pois={pois} />;
}
