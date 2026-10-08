#!/bin/bash
# usage: [SUB=4] ./render.sh r01 [r02 ...]  -> renders/<id>.mp4 with real motion blur:
# render SUB x the frame rate, average SUB neighbouring frames (tmix), keep one in SUB. SUB=8 for very fast camera moves.
cd "$(dirname "$0")"; SUB=${SUB:-4}; mkdir -p renders
FPS=$(python3 -c "import json;print(json.load(open('plan.json')).get('fps','24000/1001'))"); NUM=${FPS%/*}; DEN=${FPS#*/}; [ "$NUM" = "$FPS" ] && DEN=1
Wt=$(python3 -c "print(' '.join(['1']*$SUB))")
for r in "$@"; do
  echo "== $r $(date +%T) sub=$SUB"
  npx --yes hyperframes@0.8.52 render . -c $r.html -o renders/${r}_hi.mp4 --fps $((NUM*SUB))/$DEN -q high 2>&1 | tail -1
  ffmpeg -v error -y -i renders/${r}_hi.mp4 -vf "tmix=frames=$SUB:weights='$Wt',select='not(mod(n-$((SUB-1))\,$SUB))',setpts=N/($NUM/$DEN)/TB" -r $NUM/$DEN \
    -c:v libx264 -preset slow -crf 14 -pix_fmt yuv420p renders/$r.mp4 && rm renders/${r}_hi.mp4
  echo "frames $(ffprobe -v error -count_frames -select_streams v:0 -show_entries stream=nb_read_frames -of csv=p=0 renders/$r.mp4)"
done
