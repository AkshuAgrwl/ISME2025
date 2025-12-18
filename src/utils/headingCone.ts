export type LatLng = {
  lat: number;
  lng: number;
};

/**
 * Returns triangle points representing a direction cone
 */
export function computeHeadingCone(
  center: LatLng,
  headingDeg: number,
  lengthMeters = 12,
  spreadDeg = 25
): [number, number][] {
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const R = 6378137; // Earth radius (meters)

  function offsetPoint(
    lat: number,
    lng: number,
    distance: number,
    bearing: number
  ): [number, number] {
    const δ = distance / R;
    const θ = toRad(bearing);

    const φ1 = toRad(lat);
    const λ1 = toRad(lng);

    const φ2 = Math.asin(
      Math.sin(φ1) * Math.cos(δ) + Math.cos(φ1) * Math.sin(δ) * Math.cos(θ)
    );

    const λ2 =
      λ1 +
      Math.atan2(
        Math.sin(θ) * Math.sin(δ) * Math.cos(φ1),
        Math.cos(δ) - Math.sin(φ1) * Math.sin(φ2)
      );

    return [(φ2 * 180) / Math.PI, (λ2 * 180) / Math.PI];
  }

  const left = offsetPoint(
    center.lat,
    center.lng,
    lengthMeters,
    headingDeg - spreadDeg
  );

  const right = offsetPoint(
    center.lat,
    center.lng,
    lengthMeters,
    headingDeg + spreadDeg
  );

  return [[center.lat, center.lng], left, right];
}
