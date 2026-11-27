"""Build the 475 atlas under assets/atlas from public geographic measurements.

Requires Python 3, numpy, pillow, pyshp and shapely. Download cache is supplied as
the first argument. The Natural Earth coast is a modern baseline for this game.
"""

from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from urllib.request import urlopen
import json
import math
import sys
import time

import numpy as np
from PIL import Image, ImageDraw, ImageFilter
import shapefile
from shapely.geometry import box, shape
from shapely.ops import unary_union

WEST, EAST = 122.6, 131.4
NORTH, SOUTH = 41.15, 33.65
RASTER_WEST, RASTER_EAST = 118.64, 135.36
WIDTH = 1000
ZOOM = 8
PIXEL_SCALE = 1.50
OUTPUT = Path(__file__).resolve().parents[1] / "assets/atlas"
BASE = Path(sys.argv[1])
BASE.mkdir(parents=True, exist_ok=True)
OUTPUT.mkdir(parents=True, exist_ok=True)


def mercator(lat):
    return math.asinh(math.tan(math.radians(lat)))


HEIGHT = (mercator(NORTH) - mercator(SOUTH)) * WIDTH / math.radians(EAST - WEST)
RASTER_X, RASTER_W = -450, 1900
SIZE = (round(RASTER_W * PIXEL_SCALE), round(HEIGHT * PIXEL_SCALE))
BOUNDS = box(RASTER_WEST, SOUTH, RASTER_EAST, NORTH)


def projected(lon, lat):
    return ((lon - WEST) / (EAST - WEST) * WIDTH,
            (mercator(NORTH) - mercator(lat)) / math.radians(EAST - WEST) * WIDTH)


def download(name, uri):
    destination = BASE / name
    if not destination.exists():
        for attempt in range(4):
            try:
                with urlopen(uri, timeout=35) as response:
                    data = response.read()
                destination.write_bytes(data)
                break
            except OSError:
                if attempt == 3:
                    raise
                time.sleep(attempt + 1)
    return destination


def read_geometries(category):
    name = f"ne_10m_{category}"
    archive = download(name + ".zip", f"https://naturalearth.s3.amazonaws.com/10m_physical/{name}.zip")
    with shapefile.Reader(str(archive)) as collection:
        for original in collection.iterShapes(bbox=BOUNDS.bounds):
            geometry = shape(original.__geo_interface__)
            clipped = geometry.intersection(BOUNDS)
            if not clipped.is_empty:
                yield clipped


def pieces(geometry, geometry_type):
    if geometry.is_empty:
        return
    if geometry.geom_type == geometry_type:
        yield geometry
    elif hasattr(geometry, "geoms"):
        for item in geometry.geoms:
            yield from pieces(item, geometry_type)


def svg_line(coords, close=False):
    rounded = [(round(x, 2), round(y, 2)) for x, y in coords]
    if close and rounded[0] == rounded[-1]:
        rounded.pop()
    return "M" + "L".join(f"{x:g},{y:g}" for x, y in rounded) + ("Z" if close else "")


def raster_points(coords):
    return [((x - RASTER_X) * SIZE[0] / RASTER_W, y * SIZE[1] / HEIGHT) for x, y in coords]


def build_geometry():
    land = unary_union(list(read_geometries("land"))).simplify(0.00115, preserve_topology=True)
    rivers = unary_union(list(read_geometries("rivers_lake_centerlines"))).simplify(0.0015)
    mask = Image.new("L", SIZE, 0)
    river = Image.new("L", SIZE, 0)
    mask_painter, river_painter = ImageDraw.Draw(mask), ImageDraw.Draw(river)
    land_paths, river_paths = [], []
    for polygon in pieces(land, "Polygon"):
        for index, ring in enumerate([polygon.exterior, *polygon.interiors]):
            points = [projected(lon, lat) for lon, lat in ring.coords]
            land_paths.append(svg_line(points, close=True))
            mask_painter.polygon(raster_points(points), fill=255 if index == 0 else 0)
    for line in pieces(rivers, "LineString"):
        points = [projected(lon, lat) for lon, lat in line.coords]
        river_paths.append(svg_line(points))
        river_painter.line(raster_points(points), fill=200, width=2)
    return mask, river, "".join(land_paths), "".join(river_paths)


def tile_bounds(lon, lat):
    return ((lon + 180) / 360 * 2**ZOOM,
            (1 - mercator(lat) / math.pi) / 2 * 2**ZOOM)


def elevations():
    left, top = tile_bounds(RASTER_WEST, NORTH)
    right, bottom = tile_bounds(RASTER_EAST, SOUTH)
    tile_x, tile_y = int(left), int(top)
    tiles = [(x, y) for y in range(tile_y, int(bottom)+1) for x in range(tile_x, int(right)+1)]
    base = np.zeros(((int(bottom) - tile_y + 1)*256, (int(right) - tile_x + 1)*256), dtype="float32")

    def read_tile(tile):
        x, y = tile
        cached = download(f"z{ZOOM}-{x}-{y}.png", f"https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{ZOOM}/{x}/{y}.png")
        with Image.open(cached) as png:
            rgb = np.asarray(png.convert("RGB"), dtype="float32")
        return x, y, rgb[:, :, 0]*256 + rgb[:, :, 1] + rgb[:, :, 2]/256 - 32768

    with ThreadPoolExecutor(max_workers=12) as pool:
        for x, y, heights in pool.map(read_tile, tiles):
            iy, ix = (y-tile_y)*256, (x-tile_x)*256
            base[iy:iy+256, ix:ix+256] = heights
    region = tuple((v - offset) * 256 for v, offset in zip((left, top, right, bottom), (tile_x, tile_y, tile_x, tile_y)))
    result = Image.fromarray(base).resize(SIZE, Image.Resampling.BILINEAR, box=region)
    return np.asarray(result, dtype="float32")


def colorize(alt, mask, rivers):
    """Hypsometric tints, multidirectional hillshade and coastal shelf tints."""
    rng = np.random.default_rng(475)
    def channel_values(im):
        return np.asarray(im, dtype="float32") / 255

    land = channel_values(mask.filter(ImageFilter.GaussianBlur(0.55)))
    coastal_wash = channel_values(mask.filter(ImageFilter.GaussianBlur(11)))
    fine_coast = channel_values(mask.filter(ImageFilter.GaussianBlur(1.1)))
    river = channel_values(rivers.filter(ImageFilter.GaussianBlur(0.48)))
    elevations_land = np.maximum(alt, 0)
    gypsum = np.clip(elevations_land / 1100, 0, 1)
    summit = np.clip((elevations_land - 950) / 950, 0, 1)
    dy, dx = np.gradient(elevations_land)
    # Illumination from northwest, plus a shallow second light for orthogonal ridges.
    relief = np.clip((dx*0.76 + dy*0.55)*0.85, -69, 51)
    relief -= (np.hypot(dx, dy)*0.16).clip(0, 16)
    geometry_slope = np.clip(np.hypot(dx, dy)/130, 0, 1)
    contours = np.minimum(elevations_land % 125, 125 - elevations_land % 125)
    ink = 4 * np.exp(-contours/5) * geometry_slope
    grain = rng.normal(0, 1, alt.shape).astype("float32")
    low_color = (235, 219, 185)
    high_color = (207, 191, 151)
    peak_color = (234, 225, 204)
    shallow = (179, 202, 193)
    deep = (124, 163, 160)
    depth = np.clip(np.log1p(np.maximum(-alt, 0))/np.log(1800), 0, 1)
    shore_ink = np.clip((fine_coast - land) * 47, 0, 16)
    output = np.empty((*alt.shape, 3), dtype=np.uint8)
    for i in range(3):
        terrain = low_color[i] * (1 - gypsum) + high_color[i] * gypsum
        terrain = terrain * (1 - summit) + peak_color[i] * summit
        terrain += relief * (0.93, 0.94, 0.84)[i] - ink + grain*1.4
        terrain *= 1 - river*0.16
        sea = shallow[i]*(1-depth) + deep[i]*depth
        sea += coastal_wash*17.0 - shore_ink + grain*0.65
        output[:,:,i] = np.clip(terrain*land + sea*(1-land), 0, 255)
    return Image.fromarray(output)


def main():
    mask, rivers, land_path, river_path = build_geometry()
    altitude = elevations()
    colorize(altitude, mask, rivers).save(OUTPUT / "relief.webp", quality=87, method=6)
    data = dict(width=WIDTH, height=HEIGHT, rasterX=RASTER_X, rasterY=0, rasterWidth=RASTER_W, rasterHeight=HEIGHT,
                bounds=dict(west=WEST,east=EAST,south=SOUTH,north=NORTH),
                rasterBounds=dict(west=RASTER_WEST,east=RASTER_EAST,south=SOUTH,north=NORTH),
                landPath=land_path, riverPath=river_path,
                terrainSource="Mapzen Terrain Tiles / Tilezen: SRTM, GMTED, ETOPO1",
                coastSource="Natural Earth 1:10m public-domain physical vectors")
    with (OUTPUT / "world-data.js").open("w",encoding="utf8", newline="\n") as source:
        source.write("window.ATLAS_BASE="+json.dumps(data,separators=(",",":"))+";\n")
    print("Built", SIZE, "px;", len(land_path), "coast path chars;", len(river_path), "river path chars.")


if __name__ == "__main__":
    main()
