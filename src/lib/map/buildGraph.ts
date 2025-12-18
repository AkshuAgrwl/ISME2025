import { PathFeatureCollection } from "@/types/geo";
import { Graph, GraphNode } from "@/types/routing";
import { haversine } from "./geo";
import { PATH_SNAP_DISTANCE } from "./constants";

export default function buildGraph(paths: PathFeatureCollection): Graph {
  const nodes = new Map<string, GraphNode>();
  const edges = new Map<string, { to: string; cost: number }[]>();

  function findOrCreateNode(lat: number, lng: number): GraphNode {
    for (const node of nodes.values()) {
      const d = haversine(lat, lng, node.lat, node.lng);
      if (d <= PATH_SNAP_DISTANCE) {
        return node; // snap
      }
    }

    const id = `${lat.toFixed(6)},${lng.toFixed(6)}`;
    const node: GraphNode = { id, lat, lng };
    nodes.set(id, node);
    return node;
  }

  for (const feature of paths.features) {
    if (feature.geometry.type !== "LineString") continue;

    const coords = feature.geometry.coordinates;
    const isOneWay =
      feature.properties?.oneway === true ||
      feature.properties?.oneway === "yes";

    for (let i = 0; i < coords.length - 1; i++) {
      const [lng1, lat1] = coords[i];
      const [lng2, lat2] = coords[i + 1];

      const n1 = findOrCreateNode(lat1, lng1);
      const n2 = findOrCreateNode(lat2, lng2);

      const cost = haversine(n1.lat, n1.lng, n2.lat, n2.lng);

      edges.set(n1.id, [...(edges.get(n1.id) ?? []), { to: n2.id, cost }]);

      if (!isOneWay) {
        edges.set(n2.id, [...(edges.get(n2.id) ?? []), { to: n1.id, cost }]);
      }
    }
  }

  console.log("Graph node count:", nodes.size);
  console.log("Graph edge count:", [...edges.values()].flat().length);

  return { nodes, edges };
}
