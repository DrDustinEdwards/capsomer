"""Build fonts/capsomer-drafting-latin.woff2 from Routed Gothic.

Routed Gothic (Darren Embry, OFL 1.1, https://github.com/dse/routed-gothic) is the Leroy and Gorton
lettering of engineering drawings and panel legends. Its "1" is a bare stroke, the same glyph as "I",
so "HTLV-1" reads "HTLV-I" in a drawing label. This script redraws the 1 with a flag at its top, the
way drafting lettering writes it, and keeps every other glyph as Routed Gothic draws it.

OFL 1.1 section 3: "Routed Gothic" is a Reserved Font Name, so the modified font takes another name,
Capsomer Drafting. fonts/OFL-capsomer-drafting.txt keeps the original copyright and license.

Run (fontTools 4.60.1, skia-pathops, brotli):
  python3 scripts/drafting-font.py <routed-gothic.ttf>
with the file from routed-gothic's dist/ttf/routed-gothic.ttf at commit
365e340d64c55cb7c57940744773e6c833e3efd9. Then `node tokens/fonts.mjs` and update the sha256 pin.
"""

import math
import sys
from pathlib import Path

import pathops
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.subset import Options, Subsetter
from fontTools.ttLib import TTFont

FAMILY = "Capsomer Drafting"
OUT = Path(__file__).resolve().parent.parent / "fonts" / "capsomer-drafting-latin.woff2"

# Routed Gothic draws every stroke as a 96-unit pen with round ends (its "I": a stem from y 48 to
# 688, radius 48). The new 1 uses the same pen: the stem, and a flag from its top down to the left at
# about 35 degrees, a little under half the cap height long, as Leroy lettering's 1.
PEN = 96
ADVANCE = 480
STEM_X = 304
TOP, BOTTOM = 688, 48
FLAG_END = (120, 560)


def capsule(path, a, b, r):
    """A stroke from a to b with round ends, as one closed contour (each half circle as quadratics)."""
    ang = math.atan2(b[1] - a[1], b[0] - a[0])
    steps = 8
    dt = math.pi / steps
    reach = r / math.cos(dt / 2)  # a quadratic's control point for an arc of dt

    def half_circle(c, start):
        for i in range(steps):
            mid = start + dt * (i + 0.5)
            end = start + dt * (i + 1)
            path.quadTo(
                c[0] + reach * math.cos(mid), c[1] + reach * math.sin(mid),
                c[0] + r * math.cos(end), c[1] + r * math.sin(end),
            )

    right = ang - math.pi / 2
    path.moveTo(a[0] + r * math.cos(right), a[1] + r * math.sin(right))
    path.lineTo(b[0] + r * math.cos(right), b[1] + r * math.sin(right))
    half_circle(b, right)
    path.lineTo(a[0] - r * math.cos(right), a[1] - r * math.sin(right))
    half_circle(a, right + math.pi)
    path.close()


def one_glyph():
    r = PEN / 2
    stem = pathops.Path()
    capsule(stem, (STEM_X, BOTTOM), (STEM_X, TOP), r)
    flag = pathops.Path()
    capsule(flag, (STEM_X, TOP), FLAG_END, r)
    union = pathops.op(stem, flag, pathops.PathOp.UNION)
    pen = TTGlyphPen(None)
    union.draw(pen)
    return pen.glyph()


def main(src):
    font = TTFont(src, recalcTimestamp=False)
    name = font.getBestCmap()[ord("1")]
    font["glyf"][name] = one_glyph()
    font["hmtx"][name] = (ADVANCE, min(STEM_X, FLAG_END[0]) - PEN // 2)
    font["glyf"][name].recalcBounds(font["glyf"])

    # Names (OFL section 3): the family, full and PostScript names leave the Reserved Font Name.
    names = font["name"]
    postscript = FAMILY.replace(" ", "")
    for record in list(names.names):
        if record.nameID in (1, 4, 16, 21):
            record.string = FAMILY
        elif record.nameID == 3:
            record.string = f"{postscript}-Regular; derived from Routed Gothic 001.000"
        elif record.nameID == 6:
            record.string = f"{postscript}-Regular"
    names.setName(
        "Capsomer Drafting is Routed Gothic by Darren Embry with the digit 1 redrawn with a flag. "
        "Modified 2026-11-04 for Capsomer (https://github.com/DrDustinEdwards/capsomer).",
        10, 3, 1, 0x409,
    )

    # The latin subset Capsomer's other faces use (tokens/fonts.mjs UNICODE_RANGE), no hinting.
    options = Options()
    options.flavor = "woff2"
    options.hinting = False
    options.layout_features = ["*"]
    options.name_IDs = ["*"]
    options.notdef_outline = True
    subsetter = Subsetter(options)
    unicodes = list(range(0x20, 0x7F)) + list(range(0xA0, 0x100)) + [0x2013, 0x2014, 0x2018, 0x2019, 0x201C, 0x201D, 0x2022, 0x2026, 0x2032, 0x2033, 0x2212, 0x00B0, 0x00B5, 0x00D7]
    subsetter.populate(unicodes=unicodes)
    subsetter.subset(font)
    font.flavor = "woff2"
    font.save(OUT)
    print(f"wrote {OUT} ({OUT.stat().st_size} bytes)")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(sys.argv[1])
