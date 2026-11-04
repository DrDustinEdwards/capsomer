"""Narrow a variable font's weight axis to the weights the network sets, so pages download less.

Run (fontTools 4.60.1, brotli): python3 scripts/narrow-font.py fonts/<file>.woff2 <min> <max>
It rewrites the file in place; then `node tokens/fonts.mjs`, update the sha256 pin and the face's
`weight` range, and measure the fallback again if the default instance moved (tokens/fonts.mjs).
The outlines at every kept weight are the original's: varLib.instancer only drops the axis ends.
"""

import sys

from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

path, low, high = sys.argv[1], float(sys.argv[2]), float(sys.argv[3])
font = TTFont(path, recalcTimestamp=False)
font = instancer.instantiateVariableFont(font, {"wght": (low, high)})
font.flavor = "woff2"
font.save(path)
