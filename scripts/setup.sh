#!/bin/bash
# One-time setup: a private Python venv (whisper, DeepFilterNet, OpenCV) inside the skill, GSAP for the MG runtime,
# and a dependency check. Safe to re-run.
set -e
SK="$(cd "$(dirname "$0")/.." && pwd)"
need() { command -v "$1" >/dev/null || { echo "missing: $1 ($2)"; exit 1; }; }
need ffmpeg "brew install ffmpeg"; need ffprobe "brew install ffmpeg"; need node "https://nodejs.org (18+)"; need npx "comes with node"
PY=${PYTHON:-python3}
"$PY" -c 'import sys; assert (3,9) <= sys.version_info[:2] <= (3,12), "need Python 3.9-3.12 for torch/whisper"' \
  || { echo "set PYTHON=/path/to/python3.11 and re-run"; exit 1; }
if [ ! -x "$SK/.venv/bin/python" ]; then "$PY" -m venv "$SK/.venv"; fi
"$SK/.venv/bin/pip" install -q --upgrade pip
"$SK/.venv/bin/pip" install -q "numpy<2" "torch==2.5.1" "torchaudio==2.5.1" deepfilternet openai-whisper opencv-python-headless
mkdir -p "$SK/mg/vendor"
if [ ! -s "$SK/mg/vendor/gsap.min.js" ]; then
  curl -fsSL https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js -o "$SK/mg/vendor/gsap.min.js"
fi
npx --yes hyperframes@0.8.52 --version >/dev/null && echo "hyperframes ok"
"$SK/.venv/bin/python" -c "import whisper, df, cv2; print('python deps ok')"
echo "talking-head-editor ready"
