# Restyling the look

`mg/kit/cine.css` and `C.col` in `mg/kit/cine.js` hold the whole look. The default is warm black #0E0D0C, ivory #F5F2EA, one coral accent #D97757, Fraunces display, Geist UI and Geist Mono.

For a brand or product video, restyle before writing runs:
1. Open the brand's site and note its background and text colours, its accent, display and UI fonts, corner radii and button shapes.
2. Put the font files in `mg/fonts/` and update the `@font-face` rules and `.disp/.ui/.mono` in cine.css.
3. Update the colours in cine.css (`body`, `.bgl`, `.win`, `.card`, `.chip`, `.disp i`) and in `C.col` in cine.js. JS uses `C.col` for colours it sets directly.
4. Use the brand's real logo (an official SVG), never a redrawn one. Pick a brand-native motif object for the through-line.
5. Snapshot one run next to a screenshot of the brand's site. Both should read as the same brand.
