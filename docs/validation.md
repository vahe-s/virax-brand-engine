# Validation

Check date: 2026-10-13.
Test environment: Windows with Node.js 22.16.0 and headless Chrome.

## Code checks

- All 21 automated tests passed after the logo-format update.
- The local doctor reported the expected fonts, seven styles, and 22 questions.
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

The seven fictional coffee concepts passed a raster check across the vertical center axis.
The check compares mirrored alpha values at 512 by 512 pixels.
Alpha is the opacity value of a pixel.
It permits small differences at smooth edges.
It rejects any fully opaque pixel opposite a fully transparent pixel.
It also limits binary opacity differences to 0.1 percent of the checked pairs.

The full report and screenshots stay in the ignored `.data/qa/` folder.
Use `node scripts/browser-qa.js` to create a new report for the current code.

## Scope

These checks apply to the engine and fictional Fieldwork Coffee example.
Each new business still needs its own geometry, language, minimum-size, and final delivery checks.
No outlined wordmark, printer proof, or real business approval formed part of this engine test.

## Logo format update

The fictional format comparison includes outlined text, a separate symbol, horizontal and stacked combinations, and a custom coffee bean dot.
The new sample board passed width and asset-load checks at 1440 px and 390 px.
Its format section received direct visual inspection at 390 px.
The five primary format choices passed exact-file tests.
The integrated option rejects an absent geometric source or design reason.

The supplied skill's SVG audit and preview tools ran on the three outlined concept files.
Two review rounds covered the initial letter treatment and the revised coffee bean dot.
The final concept overview uses Chrome because Inkscape omitted artwork inside the grayscale filter.
The audit still flags anchor counts, transform precision, and the cup's shallow taper angles.
Those reports are craft notes, not completed production approval.
No owner approval or final kit exists for this fictional comparison.
