import { Graph } from "@/types/routing";
import { LineString } from "geojson";

export default function pathToLineString(
  graph: Graph,
  path: string[]
): LineString {
  return {
    type: "LineString",
    coordinates: path.map((id) => {
      const n = graph.nodes.get(id)!;
      return [n.lng, n.lat];
    }),
  };
}
