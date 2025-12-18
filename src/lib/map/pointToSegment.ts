import { haversine } from "./geo";

type LatLng = { lat: number; lng: number };

export function distancePointToSegment(
  p: LatLng,
  a: LatLng,
  b: LatLng
): { distance: number; projected: LatLng } {
  const ax = a.lng;
  const ay = a.lat;
  const bx = b.lng;
  const by = b.lat;
  const px = p.lng;
  const py = p.lat;

  const abx = bx - ax;
  const aby = by - ay;
  const apx = px - ax;
  const apy = py - ay;

  const ab2 = abx * abx + aby * aby;
  const t = Math.max(0, Math.min(1, (apx * abx + apy * aby) / ab2));

  const proj = {
    lng: ax + abx * t,
    lat: ay + aby * t,
  };

  return {
    distance: haversine(p.lat, p.lng, proj.lat, proj.lng),
    projected: proj,
  };
}
