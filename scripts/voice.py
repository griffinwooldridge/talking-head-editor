#!/usr/bin/env python3
"""Studio-clean voice from a camera or mic track.
usage: voice.py SOURCE [--out edit/voice.wav] [--atten 24] [--no-dfn]
SOURCE is the raw video (or a separate mic .wav). Steps: 48 kHz mono -> DeepFilterNet3 noise/echo removal limited to
--atten dB (24 sounds natural; 40+ gets robotic) -> 50 % match-EQ toward a standard speech spectrum (boosts capped,
nothing above +0.5 dB from 4 kHz up, so it never turns trebly) -> gentle compressor -> one static gain to -14 LUFS + a
peak limiter with its lookahead compensated (latency=1, so no sync shift). No dynamic loudnorm (it boosts every pause into room noise).
The EQ is zero-phase, so the output stays sample-aligned with SOURCE."""
import argparse, os, sys
sys.path.insert(0, os.path.dirname(__file__)); from common import *
ensure_venv()
import numpy as np
ap = argparse.ArgumentParser(); ap.add_argument('src'); ap.add_argument('--out', default='edit/voice.wav')
ap.add_argument('--atten', type=float, default=24); ap.add_argument('--no-dfn', action='store_true')
ap.add_argument('--strength', type=float, default=0.5); ap.add_argument('--maxboost', type=float, default=2.5)
ap.add_argument('--maxcut', type=float, default=6); ap.add_argument('--hicap', type=float, default=0.5)
a = ap.parse_args(); os.makedirs(os.path.dirname(a.out) or '.', exist_ok=True)
raw = a.out.replace('.wav', '_raw48.wav'); iso = a.out.replace('.wav', '_iso.wav')
run(['ffmpeg', '-v', 'error', '-y', '-i', a.src, '-vn', '-ac', '1', '-ar', '48000', '-c:a', 'pcm_s16le', raw])
if a.no_dfn:
    os.replace(raw, iso)
else:
    import torch, wave
    from df.enhance import enhance, init_df
    m, st, _ = init_df(log_level='ERROR')
    x, _ = read_wav(raw)
    y = enhance(m, st, torch.from_numpy(x)[None], atten_lim_db=a.atten).squeeze(0).numpy()
    o = wave.open(iso, 'wb'); o.setnchannels(1); o.setsampwidth(2); o.setframerate(48000)
    o.writeframes((np.clip(y, -1, 1) * 32767).astype(np.int16).tobytes()); o.close(); os.remove(raw)
# match-EQ: long-term spectrum of the loud (speech) windows vs the LTASS speech curve (Byrne 1994, re 1 kHz)
x, sr = read_wav(iso)
N = 4096; n = len(x) // N; X = x[:n * N].reshape(n, N); lv = 20 * np.log10(np.sqrt((X ** 2).mean(1)) + 1e-9)
P = (np.abs(np.fft.rfft(X * np.hanning(N), axis=1)) ** 2)[lv > np.percentile(lv, 60)].mean(0); fr = np.fft.rfftfreq(N, 1 / sr)
T = {100: -1, 125: 1, 160: 3, 200: 4.5, 250: 5, 315: 5, 400: 5, 500: 4, 630: 3, 800: 1.5, 1000: 0, 1250: -1.5, 1600: -3, 2000: -4.5,
     2500: -6.5, 3150: -7.5, 4000: -8.5, 5000: -9.5, 6300: -10, 8000: -11.5, 10000: -13.5, 12500: -16.5, 16000: -21}
cs = sorted(T); mm = np.array([10 * np.log10(P[(fr >= c / 1.26) & (fr < c * 1.26)].mean() + 1e-20) for c in cs])
mm -= mm[cs.index(1000)]; g = np.array([T[c] for c in cs]) - mm
g = np.convolve(np.pad(g, 1, mode='edge'), [0.25, 0.5, 0.25], 'valid')
g = np.clip(g * a.strength, -a.maxcut, a.maxboost); g = np.array([min(v, a.hicap) if c >= 4000 else v for c, v in zip(cs, g)])
print('match-EQ', ' '.join(f'{c}:{v:+.1f}' for c, v in zip(cs, g)))
tone = ("highpass=f=70,firequalizer=zero_phase=on:gain_entry='" + ';'.join(f'entry({c},{v:.2f})' for c, v in zip(cs, g)) + "',"
        "acompressor=threshold=-22dB:ratio=1.8:attack=12:release=160")
toned = a.out.replace('.wav', '_toned.wav')
run(['ffmpeg', '-v', 'error', '-y', '-i', iso, '-af', tone, '-c:a', 'pcm_s16le', toned])
# loudness as ONE static gain (two-pass): dynamic loudnorm lifts every pause by 40-60 dB and floods the gaps with room noise
import re, subprocess
m = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', toned, '-af', 'ebur128=peak=true', '-f', 'null', '-'], capture_output=True, text=True).stderr
I = float(re.findall(r'I:\s+(-?[\d.]+) LUFS', m)[-1]); P = float(re.findall(r'Peak:\s+(-?[\d.]+) dBFS', m)[-1])
gain = -14 - I
print(f'integrated {I:.1f} LUFS, peak {P:.1f} dBFS -> gain {gain:+.1f} dB')
run(['ffmpeg', '-v', 'error', '-y', '-i', toned, '-af', f'volume={gain:.2f}dB,alimiter=limit=0.89:attack=5:release=60:level=disabled:latency=1', '-c:a', 'pcm_s16le', a.out]); os.remove(toned)
# filters can add latency (firequalizer adds 10 ms): measure the lag against the isolated track and trim it to exactly 0
def _rd(p):
    import wave as _w; f = _w.open(p); return np.frombuffer(f.readframes(f.getnframes()), np.int16).astype(np.float32) / 32768
def _lag(ref, out):
    n = len(ref); c = int(np.argmax([np.abs(ref[i:i + 48000 * 20]).mean() for i in range(0, n - 48000 * 20, 48000 * 10)])) * 48000 * 10
    x = ref[c:c + 48000 * 20]; y = out[max(0, c - 4800):c + 48000 * 20 + 4800]; N = 1 << int(np.ceil(np.log2(len(y) + len(x))))
    r = np.fft.irfft(np.fft.rfft(y, N) * np.conj(np.fft.rfft(x, N)), N); return int(np.argmax(r[:9600])) - (c - max(0, c - 4800))
ref = _rd(iso); lag = _lag(ref, _rd(a.out))
if lag:
    tmp = a.out.replace('.wav', '_lag.wav'); os.replace(a.out, tmp)
    run(['ffmpeg', '-v', 'error', '-y', '-i', tmp, '-af', f'atrim=start_sample={lag},asetpts=PTS-STARTPTS,apad,atrim=end_sample={len(ref)}', '-c:a', 'pcm_s16le', a.out]); os.remove(tmp)
lag2 = _lag(ref, _rd(a.out)); print(f'sync: removed {lag} samples of filter latency, residual {lag2}'); assert lag2 == 0, 'voice is not sample-aligned'
print('wrote', a.out, '(isolated, unprocessed:', iso + ')')
