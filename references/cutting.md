# Cutting rules

Cuts should be tight enough that there is no dead air, and never clip a word.

- **Pauses.** Inside a kept range, any gap over 0.15 s is removed. The phrase on each side keeps a 0.03 s lead and a 0.06 s tail, so the pause becomes about 0.09 s. Speech sounds continuous without sounding chopped.
- **Out points.** Whisper's word end times are often early. `cut.py` walks forward until the level stays below the quiet threshold (noise floor + 12 dB) for 30 ms. It then looks 250 ms further for a "dip then resume": a soft final syllable like "-ence", "-ts" or "-s" that returns after a short gap inside the word. These are the clipped endings people notice. The out point never passes the start of the next spoken word in the source.
- **In points.** It walks back up to 150 ms over breathy onsets (h-, f-, s-, th-), so first syllables aren't swallowed.
- **Takes.** Keep the last complete take of a line, unless an earlier one is clearly better. Never splice half of one take onto half of another mid-sentence unless the join sits on a natural pause.
- **Audit.** Read cut.py's audit every time. Listen to each flagged tail, and treat any silence over ~0.2 s inside the cut as a bug.
- **Picture.** A cut is invisible when the head position barely changes. When two neighbouring pieces jump, put a punch-in (`punch.json`) or an MG run over the join.
