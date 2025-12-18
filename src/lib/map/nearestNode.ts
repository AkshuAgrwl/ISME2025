import { Graph, GraphNode } from "@/types/routing";
import { haversine } from "./geo";

export default function findNearestNode(
  graph: Graph,
  lat: number,
  lng: number
): GraphNode {
  let best: GraphNode | null = null;
  let bestDist = Infinity;

  for (const node of graph.nodes.values()) {
    const d = haversine(lat, lng, node.lat, node.lng);
    if (d < bestDist) {
      bestDist = d;
      best = node;
    }
  }

  if (!best) {
    throw new Error("No nodes in graph");
  }

  return best;
}
