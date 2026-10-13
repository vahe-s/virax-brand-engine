# Choose fonts and colors

## Fonts

Use the business name and actual customer text in font comparisons.
Include required languages, accents, numerals, currency symbols, and punctuation.
Check the exact font file rather than the family name alone.
Record the source, version, license, weights, and permitted uses.

Inter supports the clear sans serif role in the starter boards.
Fraunces supplies the serif role.
A serif is a small stroke at the end of a letter's main stroke.
A sans serif font omits those strokes.
These two families support a comparison, not every possible brand direction.
Suggest other families when the brief calls for a different voice or script.

The bundled upright variable fonts contain a range of weights.
Variable fonts store several style settings in one file.
The repo does not include italic files.
Do not promise italic output from these bundled files.

The bundled fonts retain their original license and copyright text.
See the official [Inter license](https://github.com/google/fonts/blob/main/ofl/inter/OFL.txt) and [Fraunces license](https://github.com/google/fonts/blob/main/ofl/fraunces/OFL.txt).
The exact source commits appear in `assets/fonts/sources.json`.
Read the license that accompanies each additional font before you distribute its file.

Compare at least three type treatments for the selected direction.
For example, compare one family, a serif with a sans serif, and a custom wordmark.
Use clear body type even when the logo uses unusual letters.
Check letter spacing by eye after the geometric layout.
Keep font substitution visible in the review record.

## Colors

Assign a role to each color.
Use the starter roles `ink`, `paper`, and `accent`.
Add semantic colors for success, caution, or errors only when the application needs them.
Do not use color alone to convey important information.

The CLI calculates contrast from two six-digit HEX colors.
The engine keeps unrounded ratios in its output and design tokens.
The visual boards show ratios rounded to two decimal places.
Use the unrounded result for any threshold decision.
WCAG text contrast normally requires 4.5:1 for standard text and 3:1 for large text.
Large text means at least 18 points, or at least 14 points in bold type.
Logo text has a specific exception under this criterion.
Check actual text uses rather than label an entire palette “accessible.”
Source: [W3C contrast guidance](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html).

HEX and RGB values describe screen colors.
CMYK values describe amounts of cyan, magenta, yellow, and black for print.
Printer profiles and materials can change the result.
Get a printer proof before you approve print colors.
Do not invent exact Pantone matches from a screen color.
