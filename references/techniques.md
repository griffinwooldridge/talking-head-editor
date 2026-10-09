# Advanced motion techniques

These are the build techniques behind the most intricate pieces in the [prompt-motion.com](https://prompt-motion.com) gallery: Claude-made motion films published with the prompts behind them. Studying that gallery showed that intricacy comes from the spec, not from asking for it. "Go all out" gets you effects. A beat map, a shared-object chain and a banned list get you a film. Before planning a video, browse the gallery's longest, most engineered prompts for ideas that fit your topic, then write your own brief (`brief.md`). Never paste someone else's prompt.

Every helper below already exists in `mg/kit/motion-kit.js` (`MK.*`) or `mg/kit/cine.js` (`C.*`), and each one is a pure function of time.

## Structure

- **One object, never cut.** Write the object chain before any code: "toggle knob -> cloud -> globe -> shield -> lockup". Each scene is built out of the previous one, so the viewer thinks "of course the next scene came from that". Good handoffs:
  - a chart point grows into the corner of a card
  - a number becomes the amount in an invoice
  - the period of a wordmark becomes a button
  - a slider knob becomes a lens, then an orb, then a screen
  - a check circle floods the frame and contracts into the next scene
  - the last shot shrinks back into its own tile (match cut)
- **A beat map, not a timeline.** List one event per beat. With voice-over, beats are the words (`wt("word")`). Without it, use a 120 BPM grid (0.5 s per beat): hard changes land on the beat (or 2 frames before it), and the biggest move lands on the drop.
- **Exactly one deliberate hold.** Everything else is in motion or changing state. A hold is a choice, not a gap.
- **Loops and bookends close.** End on a frame that matches the opening (same object, same position) when the piece loops or returns.

## Motion

- **Closed-form springs, summed** (`MK.spring`, `MK.springTrack`). A spring is its step-response formula, not a simulation. A value that retargets many times is the sum of one spring per change, so it stays seek-safe. Keep overshoot under 2% (bounce <= 0.1).
- **Two-edge springs** (`MK.twoEdge`). For a tab indicator, toggle knob or selection pill, the leading edge runs on a fast spring and the trailing edge on a slower one, so the shape stretches toward the target and then catches up. It's the cheapest way to make UI feel liquid.
- **Shots enter already moving and leave accelerating** (`MK.approach`, `C.enter`, `C.exit`). Nothing starts from a dead stop on its first frame, and nothing fades out slowly.
- **Directional motion blur** (`MK.motionBlur`). An SVG blur with separate x and y amounts, driven by velocity (`MK.vel`), so fast moves smear along their direction. It works together with `render.sh`'s sub-frame blur.
- **A cursor drives every UI change** (`MK.cursor`). It grows on hover, shrinks ~15% on press, leans toward where it's going, and drags as direct manipulation: while held, the value follows the cursor; on release it springs back from wherever it was.
- **The camera pushes into whatever is changing** (`MK.camera`, focus x/y + log scale over one world layer), Screen Studio style. One camera move at a time, and only on a beat.

## Transitions (instead of cuts or crossfades)

- **Flood** (`MK.floodBox`). A shape grows past every corner and contracts into the next scene. The kit solves on-screen coverage per frame. A plain radius ease pops, because most of the visible change lands in 2-3 frames.
- **Iris** (`MK.iris`). Six blades around a rotating hexagonal aperture open onto the next image.
- **Goo / metaball merge** (`MK.gooFilter`). Blobs join and split like liquid, with the sharp source composited on top so edges stay crisp.
- **Liquid glass** (`MK.glassFilter`, `MK.glassMap`). Each glass element holds its own clone of the scene behind it, filtered through a distance-field displacement map with chromatic edges. Never use `backdrop-filter: url()`; Chromium misreads displacement maps.
- **Gallery math.** Lay everything out once in world coordinates and move only the camera. A tile's corner radius goes to 0 as it reaches full bleed, which makes pull-backs and match cuts exact.

## Typography as an object

Words get roles instead of being subtitles: a word becomes a lintel, a column or a floor, splits apart ("th / ink"), squeezes along a variable-font width axis, or masks the image behind it. Text inside a morphing container gets its own enter and exit timing (or its own mask), so two labels never overlap.

## Banned (the premium signal is restraint)

Crossfades, bouncy easing, particles, glows, lens flares, shockwave rings, RGB split, camera shake, grid floors, gradients on UI chrome, 3D card spins, card-plus-label slides, ambient float or drift loops, and anything that looks like a template. One accent colour. One UI face plus at most one display face.

## Gotchas

- `will-change` on anything the camera scales renders text blurry.
- `opacity` or `filter` on a `preserve-3d` element flattens it. Fade a wrapper instead.
- A child with `visibility: visible` shows through a hidden parent. Use `inherit`.
- Outgoing titles must leave before incoming titles take the same space.
- White elements vanish on a white stage. Give them a 1px hairline and a faint shadow.
- Heavy blur can erase a shape. If a snapshot looks empty, lower the blur.
- Measure text only after fonts load. Long names need the whole lockup rescaled.

## QA

1. Show the beat map and object chain before writing code (`brief.md`).
2. Snapshot every run at its beat times (`mg/snap.sh`) and fix anything off-beat, cramped or hard to read.
3. After rendering, decode frames from the actual MP4, not browser screenshots.
4. Run `scripts/qa.py renders/rNN.mp4`. It flags single-frame pops (a frame-difference spike 3x its neighbours), frozen stretches and tiling artifacts. Pass intended hard changes with `--expect`.
5. Ask: does any frame look like a template? Is there too much on screen? Is every frame usable as a still?
