import json
from shapely.geometry import Point, LineString
from pyproj import Transformer

# ---------------- CONFIG ----------------
POIS_FILE = "campus_pois.json"
PATHS_FILE = "campus_paths.json"
OUTPUT_POIS = "campus_pois_snapped.json"
OUTPUT_DEBUG = "poi_snap_debug.json"

MAX_SNAP_DISTANCE_METERS = 10
# ---------------------------------------

# Coordinate transforms (meters)
to_m = Transformer.from_crs("EPSG:4326", "EPSG:3857", always_xy=True)
to_deg = Transformer.from_crs("EPSG:3857", "EPSG:4326", always_xy=True)


def to_meters(lon, lat):
    return to_m.transform(lon, lat)


def to_wgs(x, y):
    return to_deg.transform(x, y)


# Load data
with open(PATHS_FILE) as f:
    paths = json.load(f)

with open(POIS_FILE) as f:
    pois = json.load(f)

# Build LineStrings in meters
path_lines = []
for feat in paths["features"]:
    if feat["geometry"]["type"] == "LineString":
        coords = [to_meters(lon, lat) for lon, lat in feat["geometry"]["coordinates"]]
        path_lines.append(LineString(coords))

print(f"Loaded {len(path_lines)} path segments")

snapped_pois = []
debug_lines = []

for poi in pois["features"]:
    lon, lat = poi["geometry"]["coordinates"]
    poi_id = (
        poi.get("properties", {}).get("id")
        or poi.get("properties", {}).get("name")
        or "unknown"
    )

    poi_m = Point(to_meters(lon, lat))

    best_dist = float("inf")
    best_proj = None

    for line in path_lines:
        proj_dist = line.project(poi_m)
        proj_point = line.interpolate(proj_dist)

        d = poi_m.distance(proj_point)
        if d < best_dist:
            best_dist = d
            best_proj = proj_point

    if best_proj is None:
        print(f"ERROR: No projection for POI {poi_id}")
        continue

    new_lon, new_lat = to_wgs(best_proj.x, best_proj.y)

    # Distance moved (meters)
    moved = Point(to_meters(lon, lat)).distance(Point(to_meters(new_lon, new_lat)))

    print(f"POI {poi_id}: moved {moved:.2f} m")

    if moved > MAX_SNAP_DISTANCE_METERS:
        print(f"⚠ WARNING: {poi_id} far from path ({moved:.2f} m)")

    # ---- snapped POI ----
    snapped_pois.append(
        {
            "type": "Feature",
            "properties": poi.get("properties", {}),
            "geometry": {"type": "Point", "coordinates": [new_lon, new_lat]},
        }
    )

    # ---- debug line (old → new) ----
    debug_lines.append(
        {
            "type": "Feature",
            "properties": {"id": poi_id, "snap_distance_m": round(moved, 2)},
            "geometry": {
                "type": "LineString",
                "coordinates": [[lon, lat], [new_lon, new_lat]],
            },
        }
    )

# Write snapped POIs
with open(OUTPUT_POIS, "w") as f:
    json.dump({"type": "FeatureCollection", "features": snapped_pois}, f, indent=2)

# Write debug lines
with open(OUTPUT_DEBUG, "w") as f:
    json.dump({"type": "FeatureCollection", "features": debug_lines}, f, indent=2)

print("Done.")
print("Snapped POIs →", OUTPUT_POIS)
print("Debug lines →", OUTPUT_DEBUG)
