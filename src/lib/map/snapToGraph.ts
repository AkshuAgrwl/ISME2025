import { Graph, GraphNode } from "@/types/routing";
import { distancePointToSegment } from "./pointToSegment";
import {
  // ENTRANCE_SNAP_DISTANCE,
  USER_SNAP_DISTANCE,
} from "./constants";
import { haversine } from "./geo";

type SnapResult = {
  node: GraphNode;
  projected: { lat: number; lng: number };
  distance: number;
};

export function snapUserToGraph(
  graph: Graph,
  lat: number,
  lng: number,
  accuracy?: number
): SnapResult {
  let bestNode: GraphNode | null = null;
  let bestPoint: { lat: number; lng: number } | null = null;
  let bestDist = Infinity;

  const maxDist = Math.max(USER_SNAP_DISTANCE, accuracy ?? 0);

  for (const [fromId, edges] of graph.edges.entries()) {
    const from = graph.nodes.get(fromId)!;

    for (const edge of edges) {
      const to = graph.nodes.get(edge.to)!;

      const { distance, projected } = distancePointToSegment(
        { lat, lng },
        { lat: from.lat, lng: from.lng },
        { lat: to.lat, lng: to.lng }
      );

      if (distance < bestDist) {
        bestDist = distance;
        bestPoint = projected;

        // choose closer endpoint ONLY for routing
        bestNode =
          haversine(projected.lat, projected.lng, from.lat, from.lng) <
          haversine(projected.lat, projected.lng, to.lat, to.lng)
            ? from
            : to;
      }
    }
  }

  if (!bestNode || !bestPoint || bestDist > maxDist) {
    throw new Error("User too far from path network");
  }

  return {
    node: bestNode,
    projected: bestPoint,
    distance: bestDist,
  };
}

export function snapEntranceToGraph(
  graph: Graph,
  lat: number,
  lng: number
): GraphNode {
  let bestNode: GraphNode | null = null;
  let bestDist = Infinity;

  for (const node of graph.nodes.values()) {
    const d = haversine(lat, lng, node.lat, node.lng);
    if (d < bestDist) {
      bestDist = d;
      bestNode = node;
    }
  }

  if (!bestNode) {
    throw new Error("Destination not connected to path network");
  }

  return bestNode;
}
