"""Create Latin wordmark paths from a licensed local font.

Requires fontTools. This tool does not shape Arabic, Indic, or other complex scripts.
The agent must inspect spacing and each custom letter before delivery.
"""
import argparse
import json
from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.recordingPen import RecordingPen, replayRecording

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--font', required=True)
parser.add_argument('--text', required=True)
parser.add_argument('--weight', type=float, default=500)
parser.add_argument('--tracking', type=float, default=-0.3)
parser.add_argument('--bean-dot', action='store_true')
parser.add_argument('--output', required=True)
args = parser.parse_args()
if not args.text or any(ord(char) > 0x024F for char in args.text):
    raise SystemExit('Use Latin text. Complex scripts need a suitable text shaping tool.')
font = TTFont(args.font)
if 'fvar' in font:
    settings = {axis.axisTag: axis.defaultValue for axis in font['fvar'].axes}
    if 'wght' in settings:
        settings['wght'] = args.weight
    font = instantiateVariableFont(font, settings, inplace=False)
glyphs = font.getGlyphSet()
cmap = font.getBestCmap()
scale = 100 / font['head'].unitsPerEm
baseline = 110
cursor = 8
elements = []
integrated = False
for char in args.text:
    if ord(char) not in cmap:
        raise SystemExit(f'The font lacks this glyph: {char}')
    glyph_name = cmap[ord(char)]
    glyph = glyphs[glyph_name]
    pen = SVGPathPen(glyphs, ntos=lambda value: f'{value:.2f}'.rstrip('0').rstrip('.') if value else '0')
    transform = TransformPen(pen, (scale, 0, 0, -scale, cursor, baseline))
    dot_bounds = None
    if args.bean_dot and char == 'i' and not integrated:
        recording = RecordingPen()
        glyph.draw(recording)
        contours, contour = [], []
        for command in recording.value:
            contour.append(command)
            if command[0] in ('closePath', 'endPath'):
                bounds = BoundsPen(glyphs)
                replayRecording(contour, bounds)
                contours.append((contour, bounds.bounds))
                contour = []
        if len(contours) < 2:
            raise SystemExit('This i glyph needs a separate dot contour.')
        dot_index = max(range(len(contours)), key=lambda index: contours[index][1][3])
        dot_bounds = contours[dot_index][1]
        for index, (commands, _) in enumerate(contours):
            if index != dot_index:
                replayRecording(commands, transform)
    else:
        glyph.draw(transform)
    commands = pen.getCommands()
    if commands:
        elements.append({'tag': 'path', 'attrs': {'d': commands}})
    if dot_bounds:
        x0, y0, x1, y1 = dot_bounds
        center_x = cursor + (x0 + x1) * scale / 2
        center_y = baseline - (y0 + y1) * scale / 2
        rx = (x1 - x0) * scale * 0.55
        ry = (y1 - y0) * scale * 0.8
        slit = rx * 0.17
        d = (f'M{center_x} {center_y-ry}a{rx} {ry} 0 1 0 0 {ry*2}'
             f'a{rx} {ry} 0 0 0 0 {-ry*2}Z '
             f'M{center_x} {center_y-ry*.75}a{slit} {ry*.75} 0 1 1 0 {ry*1.5}'
             f'a{slit} {ry*.75} 0 0 1 0 {-ry*1.5}Z')
        elements.append({'tag': 'path', 'attrs': {'d': d, 'fill-rule': 'evenodd'}})
        integrated = True
    cursor += glyph.width * scale + args.tracking
if args.bean_dot and not integrated:
    raise SystemExit('The text needs a lowercase i for this coffee example.')
result = {'width': round(cursor + 8, 2), 'height': 136, 'elements': elements}
destination = Path(args.output)
destination.parent.mkdir(parents=True, exist_ok=True)
destination.write_text(json.dumps(result, indent=2) + '\n', encoding='utf-8')
print(destination)
