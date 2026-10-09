# Run brief

Write one brief per run (or one for a standalone graphic) before any code, and put the structure section at the top of the run file as its header comment.

```
<inputs>
Topic and brand. Real assets: logo SVG, product screens, footage clips. VO words with times (edit/words_cut.json) or a BPM grid. Run kind (ff/ov), size, duration.
</inputs>
<direction>
Look in one line: stage colour, ink, ONE accent, one UI face + one display face (from the brand, see look.md).
One continuous object: every scene is made from the previous one.
A cursor drives every UI change. The camera pushes into whatever changes, one move at a time, on a beat.
Springs with <2% overshoot. Blur follows speed and direction.
Banned: crossfades, bouncy easing, particles, glows, lens flares, shake, grid floors, gradients on UI chrome, 3D card spins, card+label slides, ambient drift, anything that looks like a template.
</direction>
<structure>
Object chain: A -> B -> C -> ... (-> back to A).
Beat map: one event per beat. With VO: word -> event. Without: b0-b4 ..., b4-b8 ... at 120 BPM.
The one deliberate hold: where and why.
</structure>
<build>
render(t) pure function. MK.springTrack / twoEdge / cursor / camera / floodBox / iris / motionBlur as needed (techniques.md).
render.sh with SUB=4 (SUB=8 for whip moves).
</build>
<gotchas>
The relevant lines from techniques.md.
</gotchas>
<start>
Snapshot the beat times, critique, fix, then render and run qa.py.
</start>
```
