"""Find scans that are pieces already shelved, or scanned twice, before naming anything.

usage: python3 -I rescan-fingerprint.py <new-list.txt> <old-list.txt>
Each list holds image paths, one per line (thumbs or display tiers are enough).
Prints, best match first, each new image's closest old image over all four
quarter turns as a 12x12 RGB correlation. At 0.92 and above the 2026-10 intake
found only true re-scans; read every match by eye before calling it one. Pass
the same list twice to find doubles inside a batch. A keyed piece is laid back
on black, so it still matches its lid scan. Needs only magick.
"""
import math, subprocess, sys

N = 12

def vec(p):
    raw = subprocess.run(['magick', p, '-background', 'black', '-alpha', 'remove', '-alpha', 'off', '-resize', f'{N}x{N}!', '-depth', '8', 'rgb:-'], capture_output=True, check=True).stdout
    m = sum(raw) / len(raw)
    s = math.sqrt(sum((x - m) ** 2 for x in raw) / len(raw)) or 1
    return [(x - m) / s for x in raw]

def turn(v):
    out = [0] * len(v)
    for y in range(N):
        for x in range(N):
            for c in range(3):
                out[(x * N + (N - 1 - y)) * 3 + c] = v[(y * N + x) * 3 + c]
    return out

def corr(a, b):
    return sum(x * y for x, y in zip(a, b)) / len(a)

def main(new_list, old_list):
    new = [l.strip() for l in open(new_list) if l.strip()]
    old = [l.strip() for l in open(old_list) if l.strip()]
    same = new_list == old_list
    olds = {p: vec(p) for p in old}
    rows = []
    for a in new:
        turns = [vec(a)]
        for _ in range(3):
            turns.append(turn(turns[-1]))
        scored = sorted(((max(corr(t, vb) for t in turns), b) for b, vb in olds.items() if not (same and b == a)), reverse=True)
        rows.append((scored[0][0], a, scored[0][1], scored[1][0] if len(scored) > 1 else 0))
    for score, a, b, second in sorted(rows, reverse=True):
        print(f'{score:.2f}  {a}  ->  {b}  (next {second:.2f})')

if __name__ == '__main__':
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    main(sys.argv[1], sys.argv[2])
