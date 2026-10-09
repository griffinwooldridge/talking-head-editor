# Restyling the look

`mg/kit/cine.css` and `C.col` in `mg/kit/cine.js` hold the whole look. The default is warm black #0E0D0C, ivory #F5F2EA, one coral accent #D97757, Fraunces display, Geist UI and Geist Mono.

For a brand or product video, restyle before writing runs. Look at the brand's CURRENT site; brands refresh, and memory of an old look produces off-brand graphics.
1. Run `scripts/extract_brand.js` on the brand's site. It returns the body and heading type, button and surface styles, a radius histogram, text and background colour counts, `@font-face` URLs and the home-link logo SVG. Screenshot the hero and two sections next to it.
2. Put the font files in `mg/fonts/` and update the `@font-face` rules and `.disp/.ui/.mono` in cine.css. Use the brand's own fonts only where you're licensed to; otherwise pick the closest open font and match its weight and tracking.
3. Update the colours in cine.css (`body`, `.bgl`, `.win`, `.card`, `.chip`, `.disp i`) and in `C.col` in cine.js. JS uses `C.col` for colours it sets directly.
4. Use the brand's real logo (the official SVG from its site or press kit), never a redrawn one. Pick a brand-native motif object for the through-line: something only this brand has, like Cloudflare's orange proxy-cloud toggle, a product's signature button or its logo mark.
5. Match the brand's motion too: corner radii, pill vs square buttons, how its own UI animates.
6. Snapshot one run next to a screenshot of the brand's site. Both should read as the same brand.
