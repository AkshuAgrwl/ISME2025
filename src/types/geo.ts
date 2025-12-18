import {
  Feature,
  FeatureCollection,
  Point,
  LineString,
  Polygon,
} from "geojson";

export type POIProperties = {
  id: string;
  name: string;
};

export type POIFeature = Feature<Point, POIProperties>;
export type POIFeatureCollection = FeatureCollection<Point, POIProperties>;

export type PathFeatureCollection = FeatureCollection<LineString>;
export type BuildingFeatureCollection = FeatureCollection<Polygon>;
