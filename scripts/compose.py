#!/usr/bin/env python3
"""Final assembly: the cut + every MG run + the caption overlay -> one delivery file, frame-exact.
usage: compose.py [--cut edit/cut.mov] [--out out/final.mp4] [--no-captions]
ff runs replace the whole picture for their span; ov runs replace the right half (the cut already framed the face in
the left half there); captions (mg/renders/captions.mov, alpha) go on top. Encodes x264 + AAC with BT.709 tags set by
the muxer flags only (no h264_metadata bitstream filter: in-encode VUI rewriting made files QuickTime refused to open),
writes to a temp file, checks the frame count, then replaces --out in place."""
import argparse, json, os, subprocess, sys
sys.path.insert(0, os.path.dirname(__file__)); from common import *
ap = argparse.ArgumentParser(); ap.add_argument('--cut', default='edit/cut.mov'); ap.add_argument('--out', default='out/final.mp4')
ap.add_argument('--no-captions', action='store_true'); ap.add_argument('--crf', default='18'); a = ap.parse_args()
os.makedirs(os.path.dirname(a.out) or '.', exist_ok=True)
fps = probe(a.cut)['fps']; OW = probe(a.cut)['w']
cnt = lambda p: int(subprocess.run(['ffprobe', '-v', 'error', '-count_packets', '-select_streams', 'v:0', '-show_entries', 'stream=nb_read_packets', '-of', 'csv=p=0', p], capture_output=True, text=True).stdout)
NB = cnt(a.cut)
runs = sorted(load('mg/runs.json'), key=lambda r: r['start']) if os.path.exists('mg/runs.json') else []
runs = [r for r in runs if os.path.exists(f"mg/renders/{r['id']}.mp4")]
inputs = ['-i', a.cut]; fc = []; segs = []; pos = 0; nsp = len(runs) * 2 + 1
fc.append(f"[0:v]split={nsp}" + ''.join(f'[b{i}]' for i in range(nsp))); bi = 0
TB = f"settb=1/{fps.numerator},setpts=N*{fps.denominator}"
for k, r in enumerate(runs, 1):
    inputs += ['-i', f"mg/renders/{r['id']}.mp4"]
    if r['start'] > pos: fc.append(f"[b{bi}]trim=start_frame={pos}:end_frame={r['start']},setpts=PTS-STARTPTS,setsar=1,format=yuv420p[g{k}]"); segs.append(f'[g{k}]')
    else: fc.append(f"[b{bi}]trim=end_frame=1[n{k}];[n{k}]nullsink")
    bi += 1
    m = f"[{k}:v]trim=end_frame={r['frames']},setpts=PTS-STARTPTS,setsar=1,format=yuv420p"
    if r['kind'] == 'ff': fc += [m + f'[m{k}]', f"[b{bi}]trim=end_frame=1[x{k}];[x{k}]nullsink"]
    else: fc += [m + f'[o{k}]', f"[b{bi}]trim=start_frame={r['start']}:end_frame={r['start'] + r['frames']},setpts=PTS-STARTPTS,setsar=1,format=yuv420p[bg{k}]",
                 f"[bg{k}][o{k}]overlay={OW // 2}:0,format=yuv420p[m{k}]"]
    bi += 1; segs.append(f'[m{k}]'); pos = r['start'] + r['frames']
fc.append(f"[b{bi}]trim=start_frame={pos},setpts=PTS-STARTPTS,setsar=1,format=yuv420p[gl]"); segs.append('[gl]')
fc.append(''.join(segs) + f"concat=n={len(segs)}:v=1:a=0,{TB}[base]")
cap = 'mg/renders/captions.mov'
if not a.no_captions and os.path.exists(cap):
    inputs += ['-i', cap]; fc.append(f"[{len(runs) + 1}:v]{TB},format=yuva444p[cp];[base][cp]overlay=0:0:eof_action=pass:format=auto,format=yuv420p[v]")
else: fc.append('[base]null[v]')
TMP = a.out + '.tmp.mp4'
run(['ffmpeg', '-y', '-v', 'error', '-stats'] + inputs + ['-filter_complex', ';'.join(fc), '-map', '[v]', '-map', '0:a',
     '-c:v', 'libx264', '-preset', 'slow', '-crf', a.crf, '-tune', 'film', '-pix_fmt', 'yuv420p', '-r', str(fps), '-fps_mode', 'cfr',
     '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709', '-color_range', 'tv',
     '-c:a', 'aac', '-b:a', '256k', '-movflags', '+faststart', TMP])
n = cnt(TMP); print('cut', NB, 'final', n); assert n == NB, 'frame count mismatch'
r = subprocess.run(['ffmpeg', '-v', 'error', '-xerror', '-i', TMP, '-f', 'null', '-'], capture_output=True, text=True)
assert r.returncode == 0, 'decode check failed: ' + r.stderr[:400]
os.replace(TMP, a.out); print('wrote', a.out)
