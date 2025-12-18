import { Graph, NodeId } from "@/types/routing";
import { haversine } from "./geo";

export default function aStar(
  graph: Graph,
  start: NodeId,
  goal: NodeId
): NodeId[] {
  const open = new Set<NodeId>([start]);
  const cameFrom = new Map<NodeId, NodeId>();

  const gScore = new Map<NodeId, number>();
  const fScore = new Map<NodeId, number>();

  for (const id of graph.nodes.keys()) {
    gScore.set(id, Infinity);
    fScore.set(id, Infinity);
  }

  gScore.set(start, 0);

  const startNode = graph.nodes.get(start)!;
  const goalNode = graph.nodes.get(goal)!;

  fScore.set(
    start,
    haversine(startNode.lat, startNode.lng, goalNode.lat, goalNode.lng)
  );

  while (open.size > 0) {
    let current: NodeId | null = null;
    let lowest = Infinity;

    for (const id of open) {
      const f = fScore.get(id)!;
      if (f < lowest) {
        lowest = f;
        current = id;
      }
    }

    if (!current) break;
    if (current === goal) break;

    open.delete(current);

    for (const edge of graph.edges.get(current) ?? []) {
      const tentative = gScore.get(current)! + edge.cost;

      if (tentative < gScore.get(edge.to)!) {
        cameFrom.set(edge.to, current);
        gScore.set(edge.to, tentative);
        fScore.set(
          edge.to,
          tentative +
            haversine(
              graph.nodes.get(edge.to)!.lat,
              graph.nodes.get(edge.to)!.lng,
              goalNode.lat,
              goalNode.lng
            )
        );
        open.add(edge.to);
      }
    }
  }

  const path: NodeId[] = [];
  let cur = goal;
  while (cameFrom.has(cur)) {
    path.unshift(cur);
    cur = cameFrom.get(cur)!;
  }
  path.unshift(start);

  return path;
}
