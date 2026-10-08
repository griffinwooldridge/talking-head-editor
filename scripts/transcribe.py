#!/usr/bin/env python3
"""Word-level transcript of the SOURCE timeline.
usage: transcribe.py AUDIO [--out edit/words.json] [--model small.en]
Writes [{"i": n, "w": word, "t": start, "e": end}] in source seconds and edit/transcript.txt with one numbered line per
sentence ("[i0-i1] t0  text"), which is what you read to decide what to keep."""
import argparse, os, sys
sys.path.insert(0, os.path.dirname(__file__)); from common import *
ensure_venv()
import whisper
ap = argparse.ArgumentParser(); ap.add_argument('audio'); ap.add_argument('--out', default='edit/words.json')
ap.add_argument('--model', default='small.en'); a = ap.parse_args()
# Transcribe pause-separated chunks independently: one long pass merges retakes of the same line and drops the
# repeat (whisper de-duplicates), which is exactly the material an editor needs to see.
import numpy as np
x = whisper.load_audio(a.audio); sr = 16000; L = levels(x, sr); H = 0.01
Q = min(max(float(np.percentile(L, 8)) + 12, -56), -40); quiet = L < Q
cuts, k = [0], 0
while k < len(L):
    if quiet[k]:
        j = k
        while j < len(L) and quiet[j]: j += 1
        if (j - k) * H >= 0.45 and (k - cuts[-1]) * H > 1.0: cuts.append((k + j) // 2)
        k = j
    else: k += 1
cuts.append(len(L))
model = whisper.load_model(a.model); segs = []
for c0, c1 in zip(cuts, cuts[1:]):
    off = c0 * H; chunk = x[int(off * sr):int(c1 * H * sr)]
    if len(chunk) < sr * 0.3 or L[c0:c1].max() < Q + 6: continue
    r = model.transcribe(chunk, word_timestamps=True, language='en', condition_on_previous_text=False, fp16=False)
    for sg in r['segments']:
        segs.append({'words': [dict(w, start=w['start'] + off, end=w['end'] + off) for w in sg.get('words', [])]})
W = []
for s in segs:
    for w in s.get('words', []):
        tok = w['word'].strip()
        if W and tok[:1] in ".%'" and tok[1:2].isalnum() and w['start'] - W[-1]['e'] < 0.3:   # "5" ".5" -> "5.5"
            W[-1]['w'] += tok; W[-1]['e'] = round(w['end'], 3); continue
        W.append({'i': len(W), 'w': tok, 't': round(w['start'], 3), 'e': round(w['end'], 3)})
save(a.out, W)
lines, cur = [], []
for w in W:
    cur.append(w)
    if w['w'][-1:] in '.?!' or (w is not W[-1] and W[w['i'] + 1]['t'] - w['e'] > 0.9):
        lines.append(cur); cur = []
if cur: lines.append(cur)
with open(os.path.join(os.path.dirname(a.out), 'transcript.txt'), 'w') as f:
    for L in lines:
        f.write(f"[{L[0]['i']}-{L[-1]['i']}] {L[0]['t']:8.2f}  {' '.join(x['w'] for x in L)}\n")
print(len(W), 'words ->', a.out)
