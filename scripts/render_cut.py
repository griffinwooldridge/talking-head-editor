#!/usr/bin/env python3
"""Render the cut: frame-exact video + the cleaned voice, reframed and graded in one pass from the camera original.
usage: render_cut.py --src SOURCE [--voice edit/voice.wav] [--out edit/cut.mov] [--size 1920x1080] [--zoom 1.1]
                     [--punch edit/punch.json] [--plan mg/plan.json] [--lut look.cube] [--face X,Y]
Framing (output pixels):
  full   the talking head at --zoom, face centred horizontally, eyes about 40 % down;
  punch  a hard 1.3x punch-in for emphasis: punch.json = [[cut_s0, cut_s1], ...] (use on long single-shot holds);
  split  under every "ov" run in plan.json the face is centred in the LEFT half and the right half is left for MG.
The face is found automatically (OpenCV, median of 7 frames) unless --face is given."""
import argparse, os, sys
sys.path.insert(0, os.path.dirname(__file__)); from common import *
ensure_venv()
ap = argparse.ArgumentParser(); ap.add_argument('--src', required=True); ap.add_argument('--voice', default='edit/voice.wav')
ap.add_argument('--edl', default='edit/edl.json'); ap.add_argument('--out', default='edit/cut.mov'); ap.add_argument('--size', default='1920x1080')
ap.add_argument('--zoom', type=float, default=1.1); ap.add_argument('--punchzoom', type=float, default=1.3)
ap.add_argument('--punch', default='edit/punch.json'); ap.add_argument('--plan', default='mg/plan.json')
ap.add_argument('--lut'); ap.add_argument('--face'); a = ap.parse_args()
P = probe(a.src); fps = P['fps']; SW, SH = P['w'], P['h']; OW, OH = map(int, a.size.split('x')); k = SW / OW
E = load(a.edl); T = (E[-1]['rec'] + E[-1]['out'] - E[-1]['in'])
if a.face:
    FX, FY = map(float, a.face.split(','))
else:
    import cv2, numpy as np
    cap = cv2.VideoCapture(a.src); cc = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'); pts = []
    for j in range(7):
        e = E[j * len(E) // 7]; cap.set(cv2.CAP_PROP_POS_FRAMES, (e['in'] + e['out']) // 2); ok, im = cap.read()
        if not ok: continue
        g = cv2.cvtColor(cv2.resize(im, (OW, OH)), cv2.COLOR_BGR2GRAY)
        f = cc.detectMultiScale(g, 1.1, 6, minSize=(OH // 8, OH // 8))
        if len(f): x, y, w, h = max(f, key=lambda r: r[2] * r[3]); pts.append((x + w / 2, y + h / 2))
    FX, FY = (float(np.median([p[0] for p in pts])), float(np.median([p[1] for p in pts]))) if pts else (OW / 2, OH * 0.4)
print(f'face at {FX:.0f},{FY:.0f} (output px)')
punch = [(round(s * fps), round(e * fps)) for s, e in load(a.punch)] if os.path.exists(a.punch) else []
ovs = []
if os.path.exists(a.plan):
    pl = load(a.plan); ovs = [(round(r['a'] * fps), round(r['b'] * fps)) for r in pl['runs'] if r['kind'] == 'ov']
def mode(f):
    if any(s <= f < e for s, e in ovs): return 'split'
    if any(s <= f < e for s, e in punch): return 'punch'
    return 'full'
bounds = sorted({b for r in ovs + punch for b in r})
pieces = []
for e in E:
    s0, n = e['rec'], e['out'] - e['in']
    cuts = [s0] + [b for b in bounds if s0 < b < s0 + n] + [s0 + n]
    for u, v in zip(cuts, cuts[1:]): pieces.append((e['in'] + u - s0, e['in'] + v - s0, mode(u)))
def chain(m):
    z = a.punchzoom if m == 'punch' else a.zoom
    vw = (OW / 2 if m == 'split' else OW) / z; vh = OH / z           # visible window in output px (before zoom)
    x0 = min(max(FX - vw / 2, 0), OW - vw); y0 = min(max(FY - 0.40 * vh, 0), OH - vh)
    cw, ch, cx, cy = (round(v * k / 2) * 2 for v in (vw, vh, x0, y0))
    ow = OW // 2 if m == 'split' else OW
    g = f"crop={cw}:{ch}:{cx}:{cy},scale={ow}:{OH}:flags=lanczos"
    if a.lut: g += f",format=gbrpf32le,lut3d=file='{a.lut}'"
    g += ",format=yuv420p"
    if m == 'split': g += f",pad={OW}:{OH}:0:0:color=black"
    return g
sr = 48000
v = ''.join(f"[0:v]trim=start_frame={p[0]}:end_frame={p[1]},setpts=PTS-STARTPTS,{chain(p[2])},setsar=1[v{i}];" for i, p in enumerate(pieces))
au = ''.join(f"[1:a]atrim=start_sample={round(p[0] / fps * sr)}:end_sample={round(p[1] / fps * sr)},asetpts=PTS-STARTPTS[a{i}];" for i, p in enumerate(pieces))
cat = ''.join(f"[v{i}][a{i}]" for i in range(len(pieces))) + f"concat=n={len(pieces)}:v=1:a=1[cv][ca];[cv]settb=1/{fps.numerator},setpts=N*{fps.denominator}[ov]"
voice = a.voice if os.path.exists(a.voice) else a.src
run(['ffmpeg', '-v', 'error', '-stats', '-y', '-i', a.src, '-i', voice, '-filter_complex', v + au + cat, '-map', '[ov]', '-map', '[ca]',
     '-fps_mode', 'passthrough', '-c:v', 'libx264', '-preset', 'medium', '-crf', '15', '-pix_fmt', 'yuv420p',
     '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709', '-c:a', 'pcm_s16le', a.out])
n = int(subprocess.run(['ffprobe', '-v', 'error', '-count_packets', '-select_streams', 'v:0', '-show_entries', 'stream=nb_read_packets', '-of', 'csv=p=0', a.out], capture_output=True, text=True).stdout)
print(f'{a.out}: {n} frames (EDL {T})'); assert n == T, 'frame count mismatch'
