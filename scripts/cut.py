#!/usr/bin/env python3
"""Build the edit decision list from the words you chose to keep, with cut points refined on the audio.
usage: cut.py [--keep edit/keep.json] [--voice edit/voice.wav] [--src SOURCE_VIDEO]
keep.json = {"keep": [[i0, i1], ...]} word-index ranges from transcript.txt, in PLAY order (reordering is allowed).
Rules (tight but never clipped):
  * a range is split wherever two kept words are > --split s apart (default .15), so every pause collapses to
    lead + tail (~.09 s) and there is no dead air;
  * each out point walks forward until the voice really ends (level below the floor-relative quiet threshold for
    30 ms), and it also catches "dip then resume" tails: a trailing -ence/-ts/-s after a short silent gap inside the
    word (the classic clipped syllable); never past the next spoken word in the source;
  * each in point walks back over soft onsets (breathy h-, f-, s-) by up to 150 ms;
  * then lead --lead (.03) and tail --tail (.06) are added and everything snaps outward to whole frames.
Writes edit/edl.json [{in, out, rec}] (source frames), edit/words_cut.json (cut-timeline seconds) and prints an audit."""
import argparse, math, os, sys
sys.path.insert(0, os.path.dirname(__file__)); from common import *
ensure_venv()
import numpy as np
ap = argparse.ArgumentParser(); ap.add_argument('--keep', default='edit/keep.json'); ap.add_argument('--words', default='edit/words.json')
ap.add_argument('--voice', default='edit/voice.wav'); ap.add_argument('--src', required=True)
ap.add_argument('--end-hold', type=float, default=0, help='extra source seconds after the last word (room for an end card)')
ap.add_argument('--split', type=float, default=0.15); ap.add_argument('--lead', type=float, default=0.03); ap.add_argument('--tail', type=float, default=0.06)
a = ap.parse_args()
W = load(a.words); K = load(a.keep)['keep']; fps = probe(a.src)['fps']
x, sr = read_wav(a.voice); L = levels(x, sr); H = 0.01
floor = float(np.percentile(L, 8)); Q = min(max(floor + 12, -56), -40)
print(f'noise floor {floor:.1f} dB, quiet threshold {Q:.1f} dB')
lv = lambda t: L[min(max(int(t / H), 0), len(L) - 1)]

def tail(e, limit):
    """walk forward from the word end until 30 ms below Q; then absorb any resume (>=30 ms above Q+4) within 250 ms."""
    t = e
    while True:
        while t < limit and not all(lv(t + k * H) < Q for k in range(3)): t += H
        nxt = None
        for k in range(25):
            u = t + k * H
            if u >= limit - 0.05: break
            if all(lv(u + j * H) > Q + 4 for j in range(3)): nxt = u; break
        if nxt is None: return min(t, limit)
        t = nxt

def onset(s, limit):
    t = s
    while t - H > limit and t > s - 0.15 and lv(t - H) > Q: t -= H
    return t

pieces = []
for i0, i1 in K:
    grp = [W[i0]]
    for w in W[i0 + 1:i1 + 1]:
        if w['t'] - grp[-1]['e'] > a.split: pieces.append(grp); grp = []
        grp.append(w)
    pieces.append(grp)
edl, wc, rec = [], [], 0
for g in pieces:
    nxt = W[g[-1]['i'] + 1]['t'] - 0.02 if g[-1]['i'] + 1 < len(W) else len(L) * H
    prv = W[g[0]['i'] - 1]['e'] + 0.02 if g[0]['i'] > 0 else 0.0
    s = max(onset(g[0]['t'], prv) - a.lead, prv - 0.0, 0.0)
    e = min(tail(g[-1]['e'], nxt) + a.tail, nxt + 0.0)
    # whisper word ends often run across a pause: also split on silences measured in the audio itself
    spans, a0, t, run0, loud = [], s, s + a.lead, None, 0
    while t < e - a.tail:
        if lv(t) < Q:
            run0 = t if run0 is None else run0
        else:
            if run0 is not None and t - run0 > a.split:
                if loud * H >= 0.08: spans.append((a0, run0 + a.tail))   # a span that holds actual voice
                a0 = t - a.lead; loud = 0                                  # (otherwise just drop the leading silence)
            run0 = None; loud += 1
        t += H
    spans.append((a0, e))
    for s1, e1 in spans:
        fi, fo = math.floor(s1 * fps), math.ceil(e1 * fps)
        if edl and edl[-1]['out'] >= fi and edl[-1]['in'] < fi:     # contiguous in the source: merge
            rec -= edl[-1]['out'] - edl[-1]['in']; fi = edl[-1]['in']; edl.pop()
        edl.append({'in': fi, 'out': fo, 'rec': rec}); rec += fo - fi
for g in pieces:
    for w in g:   # the piece that holds most of the word; a start inside a removed pause snaps to the piece start
        ov = lambda p: min(w['e'] * fps, p['out']) - max(w['t'] * fps, p['in'])
        p = max(edl, key=ov)
        r0 = float(p['rec'] / fps); i0 = float(p['in'] / fps); L_ = float((p['out'] - p['in']) / fps)
        wc.append({'i': w['i'], 'w': w['w'], 't': round(r0 + min(max(w['t'] - i0, 0), L_), 3), 'e': round(r0 + min(max(w['e'] - i0, 0), L_), 3)})
if a.end_hold:
    edl[-1]['out'] = min(edl[-1]['out'] + round(a.end_hold * fps), math.floor(len(L) * H * fps)); rec = edl[-1]['rec'] + edl[-1]['out'] - edl[-1]['in']
save('edit/edl.json', edl); save('edit/words_cut.json', wc)
# audit: clipped tails (level still up right after the out point) and the longest internal silence
bad = 0; longest = (0, 0)
for k, p in enumerate(edl):
    o = p['out'] / fps; after = [lv(o + j * H) for j in range(5)]
    if np.mean(after) > Q + 6 and not any(abs(w['t'] - o) < 0.08 for w in W): bad += 1; print(f'  piece {k}: level {np.mean(after):.0f} dB right after out @ {float(p["rec"] / fps) + (p["out"] - p["in"]) / fps:.2f}s, listen')
    a0, a1 = p['in'] / fps, p['out'] / fps; run_ = 0
    for t in np.arange(a0, a1, H):
        run_ = run_ + H if lv(t) < Q else 0
        if run_ > longest[0]: longest = (run_, float(p['rec'] / fps) + t - a0)
print(f'{len(edl)} pieces, {float(rec / fps):.2f} s at {float(fps):.3f} fps; {bad} tails to listen to; longest silence {longest[0]:.2f} s at {longest[1]:.2f} s')
