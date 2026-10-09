"""Render QA: single-frame pops, frozen stretches, HyperFrames tile artifacts, loop seam.

usage: python3 qa.py mg/renders/r01.mp4 [--loop] [--expect 8.5,9.0,...]

Pops: per-frame mean abs difference against the previous frame, flagged when a
frame's diff is > 3x the median of its neighbours (window +-4, excluding +-1)
and above an absolute floor. Times listed in --expect (intended hard changes,
e.g. flood/iris swaps) are reported but marked as expected.
Tiles: the NCC quadrant detector from the video playbook.
"""
import subprocess, sys, numpy as np

path = sys.argv[1]
loop = "--loop" in sys.argv
expect = []
if "--expect" in sys.argv:
    expect = [float(x) for x in sys.argv[sys.argv.index("--expect") + 1].split(",")]

W, H = 320, 180
probe = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries",
                        "stream=r_frame_rate", "-of", "csv=p=0", path], capture_output=True, text=True).stdout.strip()
num, den = (probe.split("/") + ["1"])[:2]
fps = float(num) / float(den)
raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-vf", f"scale={W}:{H}", "-f", "rawvideo",
                      "-pix_fmt", "gray", "-"], capture_output=True).stdout
fr = np.frombuffer(raw, np.uint8).reshape(-1, H, W).astype(np.float32)
n = len(fr)
d = np.zeros(n)
d[1:] = np.abs(fr[1:] - fr[:-1]).mean(axis=(1, 2))

pops = []
for i in range(1, n):
    nb = [d[j] for j in range(i - 4, i + 5) if 0 < j < n and abs(j - i) > 1]
    med = float(np.median(nb)) if nb else 0
    if d[i] > 2.0 and d[i] > 3 * max(med, 0.25):
        t = i / fps
        tag = "expected" if any(abs(t - e) < 2 / fps for e in expect) else "CHECK"
        pops.append((i, t, d[i], med, tag))

frozen, run = [], 0
for i in range(1, n):
    run = run + 1 if d[i] < 0.01 else 0
    if run == int(fps * 0.75):
        frozen.append(i / fps)

def ncc(x, y):
    x = x - x.mean(); y = y - y.mean(); den = ((x * x).sum() * (y * y).sum()) ** 0.5
    return (x * y).sum() / den if den > 1e-3 else 0.0

tiles = []
for i, f in enumerate(fr):
    if f.std() <= 4:
        continue
    tl, tr, bl, br = f[:H // 2, :W // 2], f[:H // 2, W // 2:], f[H // 2:, :W // 2], f[H // 2:, W // 2:]
    if min(ncc(tl, tr), ncc(tl, bl), ncc(tl, br)) > 0.2:
        tiles.append(i / fps)

print(f"{path}: {n} frames @ {fps:.3f} fps, median diff {np.median(d[1:]):.2f}")
print(f"pops: {len(pops)}")
for i, t, v, m, tag in pops:
    print(f"  f{i:5d}  t={t:6.3f}s  diff {v:6.2f}  vs neighbours {m:5.2f}  [{tag}]")
print(f"frozen stretches (>=0.75s still): {', '.join(f'{t:.2f}s' for t in frozen) or 'none'}")
print(f"tile-artifact frames: {', '.join(f'{t:.3f}s' for t in tiles) or 'none'}")
if loop:
    seam = float(np.abs(fr[-1] - fr[0]).mean())
    print(f"loop seam diff (last vs first): {seam:.3f}  ({'clean' if seam < 0.5 else 'VISIBLE'})")
