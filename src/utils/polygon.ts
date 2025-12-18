export function polygonCentroid(coords: number[][]) {
  let x = 0,
    y = 0;
  const n = coords.length;

  for (const [lng, lat] of coords) {
    x += lng;
    y += lat;
  }

  return [y / n, x / n] as [number, number];
}
