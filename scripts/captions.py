#!/usr/bin/env python3
"""Word-timed captions as a transparent overlay page (mg/captions.html), rendered to an alpha .mov and burned in by compose.py.
usage: captions.py [--words edit/words_cut.json] [--plan mg/plan.json] [--fix fix.json] [--y 0.84] [--accent #FFB020]
Groups of up to 4 words (broken at sentence ends and pauses); a card holds until the next one starts (no flicker), and
only a real silence (> 1 s) leaves the screen empty. The word being spoken turns --accent. In "ov" runs the card centres under the face (left half); hidden during "ff" runs,
where the motion graphic carries the words. fix.json = {"case": {"opus": "Opus"}, "replace": [["clawed", "Claude"]]}."""
import argparse, json, os, re, sys
from fractions import Fraction
ap = argparse.ArgumentParser(); ap.add_argument('--words', default='edit/words_cut.json'); ap.add_argument('--plan', default='mg/plan.json')
ap.add_argument('--fix'); ap.add_argument('--y', type=float, default=0.84); ap.add_argument('--accent', default='#FFB020')
ap.add_argument('--no-render', action='store_true'); ap.add_argument('--max', type=int, default=4); ap.add_argument('--size', type=int, default=50); a = ap.parse_args()
W = json.load(open(a.words)); P = json.load(open(a.plan)); FPS = Fraction(P.get('fps', '24000/1001')); OW, OH = P.get('size', [1920, 1080])
fx = json.load(open(a.fix)) if a.fix else {}
def fix(w):
    for x, y in fx.get('replace', []): w = w.replace(x, y)
    core = re.sub(r'[^\w.\'-]', '', w).lower()
    for k, v in fx.get('case', {}).items():
        if core.strip('.') == k: w = w.replace(re.sub(r'[^\w-]', '', w), v)
    return w
ff = [(r['a'], r['b']) for r in P['runs'] if r['kind'] == 'ff']
ov = [(r['a'], r['b']) for r in P['runs'] if r['kind'] == 'ov']
groups, g = [], []
for i, w in enumerate(W):
    if any(s - 0.05 <= w['t'] < e for s, e in ff):
        if g: groups.append(g); g = []
        continue
    g.append(w); end = w['w'][-1:] in '.?!,' ; gap = i + 1 < len(W) and W[i + 1]['t'] - w['e'] > 0.45
    if len(g) >= a.max or end or gap: groups.append(g); g = []
if g: groups.append(g)
cards = []
for k, g in enumerate(groups):
    t0 = g[0]['t']; nxt = groups[k + 1][0]['t'] if k + 1 < len(groups) else g[-1]['e'] + 0.5
    t1 = nxt if nxt - g[-1]['e'] < 1.0 else g[-1]['e'] + 0.25
    t1 = min([t1] + [s for s, e in ff if s > t0])
    x = 25 if any(s_ - 0.05 <= t0 < e_ for s_, e_ in ov) else 50   # in split runs the card sits under the face (left half)
    if x == 25: t1 = min([t1] + [e_ for s_, e_ in ov if s_ - 0.05 <= t0 < e_])
    cards.append({'x': x, 't0': round(t0, 3), 't1': round(t1, 3), 'w': [[fix(x['w']), round(x['t'], 3), round(x['e'], 3)] for x in g]})
dur = float(round(max(c['t1'] for c in cards) * FPS + 1) / FPS) if cards else 1
html = f"""<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="kit/cine.css">
<style>html,body,#root{{background:transparent!important}}#root{{width:{OW}px;height:{OH}px;position:relative}}
.cap{{position:absolute;left:50%;top:{a.y * 100:.1f}%;transform:translate(-50%,-50%);padding:14px 28px;border-radius:18px;background:rgba(10,10,10,.62);
font-family:Geist;font-weight:600;font-size:{a.size}px;letter-spacing:-.01em;color:#fff;white-space:nowrap;display:none}}
.cap span{{display:inline-block;margin:0 .13em}}</style></head><body>
<div id="root" data-composition-id="root" data-start="0" data-duration="{dur:.4f}" data-fps="{float(FPS):.3f}" data-width="{OW}" data-height="{OH}"></div>
<script src="vendor/gsap.min.js"></script><script src="kit/motion-kit.js"></script>
<script>const CARDS={json.dumps(cards)};const root=document.getElementById('root');
const els=CARDS.map(c=>{{const d=document.createElement('div');d.className='cap';d.style.left=c.x+'%';d.innerHTML=c.w.map(w=>`<span>${{w[0]}}</span>`).join('');root.appendChild(d);return d;}});
function render(t){{CARDS.forEach((c,i)=>{{const on=t>=c.t0&&t<c.t1;els[i].style.display=on?'block':'none';if(!on)return;
const sp=els[i].children;c.w.forEach((w,j)=>{{const nx=j+1<c.w.length?c.w[j+1][1]:c.t1;sp[j].style.color=(t>=w[1]&&t<Math.max(w[2],Math.min(nx,w[2]+0.25)))?'{a.accent}':'#fff';}});}});}}
const tl=gsap.timeline({{paused:true}});MK.drive(tl,{dur:.4f},render);window.__timelines={{root:tl}};</script></body></html>"""
open('mg/captions.html', 'w').write(html); print(len(cards), 'caption cards ->', 'mg/captions.html', f'({dur:.2f} s)')
if not a.no_render:   # alpha ProRes at the plan's exact frame rate (without --fps HyperFrames renders MOV at 30 fps)
    import subprocess
    os.makedirs('mg/renders', exist_ok=True)
    subprocess.run(['npx', '--yes', 'hyperframes@0.8.52', 'render', '.', '-c', 'captions.html', '-o', 'renders/captions.mov', '--format', 'mov',
                    '--fps', str(P.get('fps', '24000/1001')), '--workers', '1'], cwd='mg', check=True)
    n = subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-count_packets', '-show_entries', 'stream=nb_read_packets', '-of', 'csv=p=0', 'mg/renders/captions.mov'], capture_output=True, text=True).stdout.strip()
    print('mg/renders/captions.mov', n, 'frames')
