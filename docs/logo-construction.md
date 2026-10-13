# SVG logo construction

Create vector shapes directly.
Keep the source simple enough for a browser and a vector editor to read.
Use a `viewBox` so that the shape scales predictably.
A viewBox defines the coordinate area inside the SVG.

## Geometry

1. Choose the silhouette before fine details.
2. Set a base unit for dimensions and spacing.
3. Place the center and any symmetry axes.
4. Create one side and reflect it when mirror symmetry is required.
5. Repeat one element around the center when rotational symmetry is required.
6. Check negative space and the smallest intended size.
7. Record any optical correction and its purpose.

The workbench uses a 512-unit coordinate area and a 32-unit grid.
The fictional coffee concepts use vertical mirror symmetry.
Custom business concepts use the symmetry rule in their design plan.
Their grid, center axes, bounding reference, and circle appear in `symbol-guides.svg`.
Those guides describe a construction frame.
They do not prove that every shape lies on each guide.
Do not add golden-ratio circles unless they describe the actual geometry.

The wordmark uses optical balance.
It does not inherit the symbol's symmetry.

## Custom symbols

Use templates/custom-symbol.json inside each concept in templates/design-plan.json.
The input supports paths, rectangles, circles, ellipses, and polygons.
The generator applies a single color to the complete symbol.
Use a path with `fill-rule: evenodd` for internal cutouts.
The input does not accept scripts, images, links, events, filters, or raw XML.
Check path bounds and symmetry in the rendered output.
The input validator does not prove geometric correctness.

For custom multicolor artwork, save a separate native SVG and an explicit review manifest.
Use the agent review path for those files.
Do not assign the CLI sample hash to different artwork.

## Clean files and guide files

Keep `symbol.svg` free of construction lines.
Keep guide lines in `symbol-guides.svg` or a named removable layer.
Do not include guide lines in the avatar, favicon, or production logo.
Keep the business name as editable text in the source.
Export outlined text as a separate delivery file.
Compare the outline export with the editable source before approval.

## Visual checks

- Check the silhouette in one color.
- Check the symbol at 16, 24, 32, and 64 pixels.
- Check the intended mirror or rotational symmetry.
- Check equal repeated dimensions and negative spaces.
- Check clear space on each required layout.
- Check the logo on light and dark backgrounds.
- Check an actual print proof when print use matters.

Choose the minimum logo size from the actual test.
Do not treat 16 pixels as a guaranteed minimum.

Source: [W3C SVG specification](https://www.w3.org/TR/SVG2/).
