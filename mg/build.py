#!/usr/bin/env python3
"""plan.json -> one HyperFrames page per run (rNN.html).
plan.json = {"fps": "24000/1001", "size": [1920, 1080], "runs": [{"id": "r01", "kind": "ff"|"ov", "a": cut_s, "b": cut_s, "note": "..."}]}
  ff = full-frame MG (replaces the picture), ov = right-half panel (the cut frames the face in the left half).
Each run's code lives in runs/<id>.js and defines window.RUN = {build(stage), render(t)}; render is a pure function of
run-relative seconds. Helpers injected into every page:
  at(cut_s)          cut-timeline seconds -> run-relative seconds
  wt("word", n=0)    run-relative start of the n-th occurrence of a word at/after the run start (from ../edit/words_cut.json)
Media (video clips inside the MG) is declared in the run file as /*MEDIA[{"id","src","x","y","w","h","start","mstart"}]MEDIA*/
and appears as #vw_<id> (wrapper) / #v_<id> (video), positioned and shown by your render(t)."""
import json, os, sys
from fractions import Fraction
P = json.load(open('plan.json')); FPS = Fraction(P.get('fps', '24000/1001')); OW, OH = P.get('size', [1920, 1080])
WC = json.load(open('../edit/words_cut.json')) if os.path.exists('../edit/words_cut.json') else []
WORDS = [[w['w'], w['t']] for w in WC]
only = sys.argv[1:]; runs = []
for r in P['runs']:
    s, e = round(r['a'] * FPS), round(r['b'] * FPS); n = e - s; dur = float(n / FPS); a0 = float(s / FPS)
    runs.append({'id': r['id'], 'kind': r['kind'], 'start': s, 'frames': n})
    if only and r['id'] not in only: continue
    if not os.path.exists(f"runs/{r['id']}.js"): print('missing', r['id']); continue
    W, H = (OW, OH) if r['kind'] == 'ff' else (OW // 2, OH)
    js = open(f"runs/{r['id']}.js").read(); media = ''
    for m in json.loads(js.split('/*MEDIA')[1].split('MEDIA*/')[0]) if '/*MEDIA' in js else []:
        md = round(min(m.get('dur', dur), dur - m.get('start', 0)), 4)
        media += (f'<div id="vw_{m["id"]}" class="vw" style="left:{m["x"]}px;top:{m["y"]}px;width:{m["w"]}px;height:{m["h"]}px;opacity:0">'
                  f'<video id="v_{m["id"]}" class="clip" src="{m["src"]}" muted playsinline data-start="{m.get("start", 0)}" data-duration="{md}" '
                  f'data-media-start="{m.get("mstart", 0)}" data-track-index="{m.get("track", 1)}"></video></div>')
    html = f"""<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width={W}, height={H}">
<link rel="stylesheet" href="kit/cine.css"><style>#root,#stage{{width:{W}px;height:{H}px}}</style></head><body>
<div id="root" data-composition-id="root" data-start="0" data-duration="{dur:.4f}" data-fps="{float(FPS):.3f}" data-width="{W}" data-height="{H}" style="width:{W}px;height:{H}px">
<div id="stage"><div class="bgl"></div><div id="media">{media}</div></div><div class="vig"></div>
</div>
<script src="vendor/gsap.min.js"></script><script src="kit/motion-kit.js"></script><script src="kit/cine.js"></script>
<script>window.T0={a0:.5f};window.DUR={dur:.4f};window.W={W};window.H={H};const WORDS={json.dumps(WORDS)};
const at=(t)=>t-{a0:.5f};
const wt=(w,n=0)=>{{const k=w.toLowerCase().replace(/[^a-z0-9.']/g,'');let c=0;for(const[x,t]of WORDS){{if(t<{a0:.5f}-0.05)continue;if(x.toLowerCase().replace(/[^a-z0-9.']/g,'').replace(/[.]$/,'')===k.replace(/[.]$/,'')){{if(c===n)return t-{a0:.5f};c++;}}}}throw new Error('wt: no "'+w+'" #'+n+' in run');}};</script>
<script>{js}</script>
<script>C.boot();</script>
</body></html>"""
    open(f"{r['id']}.html", 'w').write(html); print(r['id'], r['kind'], n, 'frames', round(dur, 2), 's')
json.dump(runs, open('runs.json', 'w'), indent=1)
