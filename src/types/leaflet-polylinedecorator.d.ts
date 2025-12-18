import * as L from "leaflet";

declare module "leaflet" {
  function polylineDecorator(
    latLngs: L.LatLngExpression[],
    options?: unknown
  ): L.Layer;
}
