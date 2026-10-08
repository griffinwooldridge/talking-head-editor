# Motion graphics standard

This is the bar for every MG run. These strategies make the graphics look designed and edited by hand, instead of slides with motion attached. The examples refer to `mg/examples/` and to the video this skill was built for, where every graphic was made this way.

## Why this works

1. **Concept first, written as one sentence per run.** Before any code, write what the picture *does* on the VO. For example: "One object, never cut: a bulb stretches into a prompt pill, the text pours into a code editor that writes itself, the code folds into blocks that become the finished animation." If the sentence reads like "a card with an icon and a label", reject it and think again.
2. **Continuous time, no scenes.** A run is `render(t)` over its whole duration. Every element lives across the run and can hand off to the next, which is what makes object chains and camera moves possible. Scene-by-scene builds turn into cross-dissolves.
3. **Physics instead of tweens.**
   - Entrances are springs with a blur that falls off with speed (`C.enter`).
   - Exits accelerate away and blur (`C.exit`), never a slow fade.
   - Bounces and shakes are real equations: gravity then decay, damped sines.
   - Renders run at 4-8x the frame rate and are averaged into true motion blur (`render.sh`).
4. **Word-exact timing.** Every noun, number or verb the speaker says gets a matching on-screen event, timed with `wt("word")`. Land on the word or up to 0.15 s early, never late.
5. **A critique loop.** Snapshot every run at its beat times and critique it like a motion designer before rendering.

## Strategies

### 1. One object that becomes the next thing
Never cut from idea A to idea B. Morph A into B so the viewer follows one object.
- A bulb becomes a prompt pill, then a code editor, then coloured blocks, then the finished animation, then an idea-review-iterate loop (`examples/object_chain.js`).
- A 5:00 ring splits into a split screen, then into step cards, which collapse into one word that slams forward.

### 2. Show the mechanism literally
If the VO describes a process, the picture performs it with cause and effect.
- A cursor does each manual After Effects step on its word, while a step counter and a running clock make the effort visible.
- A "technical barrier" wall drops on "dramatically lower", and code pours out while a line counter climbs.
- A day bar of manual tasks shrinks block by block and "Directing" takes the freed time (`examples/camera_world.js`, panel 3).

### 3. Kinetic type that does what it says
"Speed it up" doubles a loop. "Simplify" collapses eight elements to three. "New easing" bends a curve. "Rethink it" flips the card into a new art direction (`examples/directing_notes.js`).

### 4. A camera inside a world, moved only on beats
Put a large `world` layer under a virtual camera (translate + scale) and move it only on a beat word, with a premium ease. Examples:
- a rail of stations the camera pans along
- panels on one wall, cut to on each persona (`examples/camera_world.js`)
- a pull-back from one full-bleed frame to a wall of frames, with the tile radius growing from 0 as it shrinks

Hold still between beats. No ambient drift or floating.

### 5. Self-reference and real media
Use the actual material of the video:
- the speaker's own clip inside a program monitor, with captions of their real words
- the video's own frames as a payoff wall
- the product's real UI, not a drawing of it

### 6. A cursor as the actor
UI moments are driven by `MK.cursor`, with hover, press and click timing, and the interface responds on the click: buttons fill, pills morph, knobs follow the cursor.

### 7. Motifs and callbacks
- Pick one recurring symbol for the video (a logo mark, a shape, a product object) and let it travel through the runs.
- Bring an early object back at the end, e.g. the card from the intro returning in the call to action. This makes many runs feel like one piece.

### 8. Editorial restraint
- Dark or light stage, one accent colour, a display face with emphasis and a clean UI face.
- Depth comes from blur and scale, not gradients and glows.
- Few words on screen, and every word large.

### 9. Density without clutter
A new visual event every 1-2 s of VO, made by changing the state of elements already on screen rather than by new layouts arriving. Group rapid lists with 0.2-0.3 s staggers. Every state stays readable for at least about 1 s.

## Tailoring to a brand or topic
The brand sets the costume: palette, fonts, radii, logo and product UI (see `look.md`). These strategies set the motion. A product video keeps all of them, rebuilt from that product's own interface and motif.

## Critique checklist (every run, before rendering)
- [ ] The concept sentence describes a transformation or a mechanism, not a layout.
- [ ] Every element appears for a reason (a word, a click, a cause).
- [ ] Every beat lands on or just before its word.
- [ ] Nothing spills out of the frame or panel. No empty half of the frame for more than ~1.5 s.
- [ ] Text is large and short, with brand names in their official casing.
- [ ] Exits are fast; nothing fades out slowly; no drifting.
- [ ] At least one moment in the video uses real media or real product UI.
- [ ] The motif or a callback ties this run to the others.
