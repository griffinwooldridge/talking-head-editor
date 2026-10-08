---
name: talking-head-editor
description: Edit raw talking-head footage into a finished video with Claude. Tight cuts that never clip a word, studio-clean voice, reframing and punch-ins, word-timed captions, and cinematic motion graphics written as code, all rendered frame-exact with ffmpeg and HyperFrames. Use when someone hands you a raw recording (camera file, optional separate mic) and asks to "edit this video", "cut my talking head", "add motion graphics", "clean up the audio" or "make this look edited".
---

# Talking-head editor

Turns a raw talking-head recording into an edited video: cut, cleaned voice, framing, captions and motion graphics (MG). Every step is a script you can re-run, and every MG run is code, so notes like "speed that up" or "rethink this scene" are quick edits.

Skill dir = the folder holding this file (`$SK` below). Work in a project folder next to the footage:
```
project/
  source.mp4          raw camera file (or any name; pass --src)
  edit/               words.json, transcript.txt, keep.json, voice.wav, edl.json, words_cut.json, cut.mov
  mg/                 copied from $SK/mg: plan.json, runs/rNN.js, renders/
  out/final.mp4
```

## 0. Setup (once)
`$SK/scripts/setup.sh` creates `$SK/.venv` (whisper, DeepFilterNet, OpenCV), fetches GSAP and checks ffmpeg, node and HyperFrames. Scripts re-exec themselves inside that venv.

## 1. Voice
`python3 $SK/scripts/voice.py source.mp4` writes `edit/voice.wav`:
- DeepFilterNet removes noise and room echo, capped at 24 dB of attenuation (stronger sounds robotic).
- A gentle match-EQ toward a natural speech spectrum, then -14 LUFS.

If the user recorded a separate mic, pass that file instead, but only once it's synced to the camera, starting on the same frame.
Listen to 10 s of it; if it sounds processed, re-run with `--atten 18`.

## 2. Transcribe and choose the take
`python3 $SK/scripts/transcribe.py edit/voice.wav` writes:
- `edit/words.json`, word timings in source seconds
- `edit/transcript.txt`, one numbered line per sentence

Read the whole transcript, then write `edit/keep.json`:
```json
{"keep": [[0, 11], [27, 58], [71, 90]]}
```
- Word-index ranges in play order.
- For retakes, keep the LAST complete take. Drop false starts, trailing "...", repeated lines, "um/uh" runs and anything said to the crew.
- Reordering is allowed when it makes a tighter story.

## 3. Cut
`python3 $SK/scripts/cut.py --src source.mp4` writes `edit/edl.json` (source frames) and `edit/words_cut.json` (cut-timeline seconds). See `references/cutting.md` for the rules.
- Every pause collapses to about 0.09 s. Every out point waits for the word's real end, including clipped tails like "-ence" or "-ts" that come back after a tiny dip, and never runs into the next spoken word.
- **Read the audit it prints.** Listen to every flagged tail. The longest silence should be under ~0.2 s.

## 4. Plan the motion graphics (the part that makes it look edited)
**Read `references/motion.md` first; it is the standard.** Then write `mg/plan.json`:
```json
{"fps": "24000/1001", "size": [1920, 1080],
 "runs": [{"id": "r01", "kind": "ov", "a": 3.20, "b": 9.85, "note": "one sentence: what object exists, what it becomes, on which word"}]}
```
- `ff` replaces the whole picture. `ov` is a right-half panel next to the face (the cut frames the face in the left half automatically).
- Aim for MG over roughly 40-60 % of the runtime. Use ff for ideas that need the whole frame and ov when the face should stay. Keep the face on screen for hooks and personal moments.
- Times are cut-timeline seconds from `edit/words_cut.json`. Start a run on the first word of its idea, about 1 frame before, and end it at a phrase boundary.

Copy `$SK/mg` into the project once (`cp -R $SK/mg ./mg`). Keep `mg/kit`, `mg/fonts` and `mg/vendor` as they are.

## 5. Reframe and render the cut
`python3 $SK/scripts/render_cut.py --src source.mp4` writes `edit/cut.mov`, frame-exact, with the cleaned voice. It does all framing in one lanczos pass from the camera original:
- full shots at 110 %, face centred
- optional punch-ins (`edit/punch.json`: `[[s0, s1], ...]`, 130 %, for long single holds or emphasis)
- the split framing under `ov` runs

Add `--lut look.cube` for a grade.

## 6. Write the runs
One file per run, `mg/runs/rNN.js`. Start from `mg/runs/_template.js`; `mg/examples/` has full runs to learn from (`live_monitor` and `knob_chain` are from the demo in docs/):
- `object_chain`: one object turning into the next
- `directing_notes`: kinetic UI answering typed notes
- `camera_world`: a camera moving between panels on beats

Rules:
- `render(t)` must be a pure function of t: no state, no timers, no tweens kept between frames.
- Time every beat with `wt("word")` (run-relative start of that word) or `at(cut_seconds)`.
- Kit (`mg/kit/cine.js`, `C.*`):
  - motion: `enter/exit/life` (spring + speed blur in, accelerating blur out), `sp` (spring progress), `p` (eased progress), `kf` (keyframes)
  - type: `words/chars/type` (kinetic type, typing)
  - parts: `win/code/icon/chip/card/spark/wave`
  - `MK.cursor` for cursor-driven UI
- Look: `kit/cine.css` holds the palette and fonts (warm black, ivory, one accent). For a brand video, restyle the CSS variables and fonts from the brand's site first; see `references/look.md`.

Build and check:
```bash
cd mg && python3 build.py && ./snap.sh r01 0.4,1.5,3.0,5.2   # snapshots at the beat times
```
Critique every contact sheet like a motion designer before rendering (checklist in `references/motion.md`) and fix what fails.

## 7. Render, caption, compose
```bash
cd mg && ./render.sh r01 r02 r03          # SUB=4 sub-frame motion blur; SUB=8 for very fast camera moves
cd .. && python3 $SK/scripts/captions.py   # mg/captions.html + mg/renders/captions.mov (alpha, at the plan's fps)
python3 $SK/scripts/compose.py             # out/final.mp4, frame count + decode verified
```
Pass `--fix fix.json` to captions.py to correct brand names whisper mishears.

## 8. Review before you hand it over
- Watch every join where a run starts or ends, and every flagged tail.
- Re-transcribe `out/final.mp4` and diff it against the keep list: no missing or doubled words.
- Look at the first frame of every run (no flash of the old picture) and the last.
- Report what you made with timestamps, and offer the next round of notes. Re-renders overwrite in place; don't keep version copies.

## Gotchas
- Never centre with CSS `translate(-50%)` on anything you also move from JS; position with left/top.
- Element ids `s1`, `s2`... are fine, but don't reuse an id across runs that share a page.
- Videos inside MG must be declared in the `/*MEDIA[...]MEDIA*/` block. Show them by setting `#vw_<id>` opacity and box in `render(t)`.
- `backdrop-filter` disables HyperFrames' fast capture. Use solid translucent fills.
- Content must stay inside its panel: an `ov` run is 960 px wide. Check snapshots for anything spilling off the edges.
