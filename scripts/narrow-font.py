"""Cut a font down to what the network sets, so pages download less.

Run (fontTools 4.60.1, brotli): python3 scripts/narrow-font.py <source.woff2> <out.woff2> [axis=min:max | axis=value ...] [--unicodes=<ranges>]
  axis=min:max narrows a variable axis to the weights the network sets; axis=value pins it (drops the axis).
  --unicodes keeps only those characters (pyftsubset's syntax), with kerning, ligatures and contextual forms only
  (not fractions or figure styles, which wayfinding never sets).
Then `node tokens/fonts.mjs`, update the sha256 pin, the face's `weight` and `unicodeRange`, and measure the
fallback again if the default instance moved (tokens/fonts.mjs).
The outlines kept are the original's: varLib.instancer only drops axis ends or pins an axis, and the subsetter
only drops glyphs.

The network's cuts, from Fontsource 5.3.0's files:
  Inter: inter-latin-opsz-normal.woff2 wght=300:800 opsz=14 -> fonts/inter-latin-wght-normal.woff2
  Overpass: overpass-latin-wght-normal.woff2 wght=600:700 --unicodes=U+0020-007E,U+00A0,U+00B7,U+2013-2014,U+2018-201D,U+2022,U+2026,U+2190-2193
"""

import sys

from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

src, out, *rest = sys.argv[1:]
unicodes = None
limits = {}
for arg in rest:
    if arg.startswith("--unicodes="):
        unicodes = arg.split("=", 1)[1]
        continue
    axis, value = arg.split("=")
    limits[axis] = tuple(float(v) for v in value.split(":")) if ":" in value else float(value)

font = TTFont(src, recalcTimestamp=False)
if limits:
    font = instancer.instantiateVariableFont(font, limits)
if unicodes:
    options = subset.Options()
    options.layout_features = ["kern", "liga", "calt", "ccmp", "locl", "mark", "mkmk"]
    options.name_IDs = ["*"]
    options.notdef_outline = True
    sub = subset.Subsetter(options)
    sub.populate(unicodes=subset.parse_unicodes(unicodes))
    sub.subset(font)
font.flavor = "woff2"
font.save(out)
