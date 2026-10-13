# Initial validation

Check date: 2026-10-13.
Test environment: Windows with Node.js 22.16.0 and headless Chrome.

## Code checks

- All 13 automated tests passed.
- The local doctor reported the expected fonts, seven styles, and 21 questions.
- The public file check passed syntax, JSON, required document, font hash, and secret pattern checks.
- The two public example SVG files passed XML parsing.

The tests cover saved answers, profile history, stale versions, private paths, safe geometry, approval hashes, changed samples, and kit exports.
The test approval records are fixtures.
They do not represent real owner approval.

## Browser checks

The direction board and sample board passed asset-load and horizontal-width checks at 1440 px and 390 px.
Both bundled font families loaded from local files.
The screenshots received direct visual inspection.
The phone-width pages showed readable text without horizontal overflow.

The seven starter symbols passed a raster check across the vertical center axis.
The check compares mirrored alpha values at 512 by 512 pixels.
Alpha is the opacity value of a pixel.
It permits small differences at smooth edges.
It rejects any fully opaque pixel opposite a fully transparent pixel.
It also limits binary opacity differences to 0.1 percent of the checked pairs.

The full report and screenshots stay in the ignored `.data/qa/` folder.
Use `node scripts/browser-qa.js` to create a new report for the current code.

## Scope

These checks apply to the engine, starter symbols, and fictional Fieldwork Coffee example.
Each new business still needs its own geometry, language, minimum-size, and final delivery checks.
No outlined wordmark, printer proof, or real business approval formed part of this engine test.
