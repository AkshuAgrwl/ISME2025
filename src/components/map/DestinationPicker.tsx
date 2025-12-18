"use client";

import { POIFeature } from "@/types/geo";

type Props = {
  destinations: POIFeature[];
  onSelect: (poi: POIFeature) => void;
};

export default function DestinationPicker({ destinations, onSelect }: Props) {
  return (
    <select
      onChange={(e) => {
        const poi = destinations.find(
          (d) => d.properties.id === e.target.value
        );
        if (poi) onSelect(poi);
      }}
      defaultValue=""
    >
      <option value="" disabled style={{ color: "black" }}>
        Select destination
      </option>

      {destinations.map((d) => (
        <option
          key={d.properties.id}
          value={d.properties.id}
          style={{ color: "black" }}
        >
          {d.properties.name}
        </option>
      ))}
    </select>
  );
}
