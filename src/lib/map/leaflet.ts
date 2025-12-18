import L from "leaflet";

interface LeafletIconPrototype {
  _getIconUrl?: () => string;
}

const iconProto = L.Icon.Default.prototype as LeafletIconPrototype;

if (iconProto._getIconUrl) {
  delete iconProto._getIconUrl;
}

L.Icon.Default.mergeOptions({
  iconRetinaUrl: "/leaflet/marker-icon-2x.png",
  iconUrl: "/leaflet/marker-icon.png",
  shadowUrl: "/leaflet/marker-shadow.png",
});
