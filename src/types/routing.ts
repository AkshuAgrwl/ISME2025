export type NodeId = string;

export type GraphNode = {
  id: NodeId;
  lat: number;
  lng: number;
};

export type GraphEdge = {
  to: NodeId;
  cost: number;
};

export type Graph = {
  nodes: Map<NodeId, GraphNode>;
  edges: Map<NodeId, GraphEdge[]>;
};
