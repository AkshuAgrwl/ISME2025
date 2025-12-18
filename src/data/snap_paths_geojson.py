import json
from shapely.geometry import LineString
from shapely.ops import snap
from pyproj import Transformer

# ---- CONFIG ----
INPUT = "campus_paths_raw.json"
OUTPUT = "campus_paths.json"
SNAP_DISTANCE_METERS = 0.5
# ----------------

# WGS84 → Web Mercator (meters)
to_m = Transformer.from_crs("EPSG:4326", "EPSG:3857", always_xy=True)
to_deg = Transformer.from_crs("EPSG:3857", "EPSG:4326", always_xy=True)


def project(coords):
    return [to_m.transform(lon, lat) for lon, lat in coords]


def unproject(coords):
    return [to_deg.transform(x, y) for x, y in coords]


with open(INPUT) as f:
    data = json.load(f)

lines = []
for feat in data["features"]:
    coords = feat["geometry"]["coordinates"]
    lines.append(LineString(project(coords)))

# snap everything to everything
snapped = []
for line in lines:
    merged = line
    for other in lines:
        merged = snap(merged, other, SNAP_DISTANCE_METERS)
    snapped.append(merged)

# write back
out = {"type": "FeatureCollection", "features": []}

for geom, feat in zip(snapped, data["features"]):
    out["features"].append(
        {
            "type": "Feature",
            "properties": feat.get("properties", {}),
            "geometry": {
                "type": "LineString",
                "coordinates": unproject(list(geom.coords)),
            },
        }
    )

with open(OUTPUT, "w") as f:
    json.dump(out, f, indent=2)

print("Snapped file written to", OUTPUT)
