"""Shared helpers: the skill venv, ffprobe, frame-rate maths and 10 ms RMS levels."""
import json, os, subprocess, sys, wave
from fractions import Fraction
SK = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VPY = os.path.join(SK, '.venv', 'bin', 'python')

def ensure_venv():
    """Re-exec under the skill's venv so numpy/whisper/df/cv2 are importable."""
    if os.path.exists(VPY) and os.path.realpath(sys.executable) != os.path.realpath(VPY) and not os.environ.get('THE_VENV'):
        os.environ['THE_VENV'] = '1'; os.execv(VPY, [VPY] + sys.argv)

def run(cmd, **kw):
    return subprocess.run(cmd, check=True, **kw)

def probe(path):
    j = json.loads(subprocess.run(['ffprobe', '-v', 'error', '-show_streams', '-show_format', '-of', 'json', path],
                                  capture_output=True, text=True, check=True).stdout)
    v = next((s for s in j['streams'] if s['codec_type'] == 'video'), None)
    a = next((s for s in j['streams'] if s['codec_type'] == 'audio'), None)
    return {'fps': Fraction(v['r_frame_rate']) if v else None, 'w': int(v['width']) if v else 0, 'h': int(v['height']) if v else 0,
            'dur': float(j['format']['duration']), 'has_audio': a is not None}

def read_wav(path):
    import numpy as np
    w = wave.open(path); sr = w.getframerate(); ch = w.getnchannels()
    x = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(np.float32) / 32768
    if ch > 1: x = x.reshape(-1, ch).mean(1)
    return x, sr

def levels(x, sr, hop=0.01):
    """dB FS per 10 ms window."""
    import numpy as np
    n = int(sr * hop); m = len(x) // n
    return 20 * np.log10(np.sqrt((x[:m * n].reshape(m, n) ** 2).mean(1)) + 1e-9)

def load(p):
    return json.load(open(p))

def save(p, o):
    json.dump(o, open(p, 'w'), indent=1)
