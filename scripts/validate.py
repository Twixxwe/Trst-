#!/usr/bin/env python3
"""Validation (handoff section 3) for the game-level build.
Usage: validate.py WORK_DIR ORIG_DATA_JSON > validation.md
WORK_DIR holds build outputs: games.csv, stints.json (BPM_STINTS_OUT), rows.json, build_report.json."""
import csv, json, os, sys, statistics as st
from collections import defaultdict, Counter


def pct(xs, q):
    xs = sorted(xs)
    return xs[min(len(xs) - 1, int(q * len(xs)))] if xs else float('nan')


def main(work, orig_path):
    rep = json.load(open(os.path.join(work, 'build_report.json')))
    rows = json.load(open(os.path.join(work, 'rows.json')))
    stints = json.load(open(os.path.join(work, 'stints.json')))
    od = json.load(open(orig_path, encoding='utf-8'))
    orig = {(r['league'], r['season'], r['id']): r for r in od['rows']}
    out = []
    P = out.append

    P('## 1. Games per team-season (regular season)\n')
    P('| League | Season | Games | Teams | Games per team (count of teams) |')
    P('|---|---|---|---|---|')
    for k, v in sorted(rep['team_game_counts'].items()):
        lg, ss = k.rsplit(' ', 1)
        dist = Counter(v.values())
        P(f"| {lg} | {ss} | {sum(v.values()) // 2} | {len(v)} | {', '.join(f'{g} ({n})' for g, n in sorted(dist.items()))} |")
    dropped = rep.get('dropped_incomplete_boxes', {})
    P(f"\nDropped games with an incomplete box score: {sum(len(v) for v in dropped.values())} "
      + (', '.join(f'{k}: {len(v)}' for k, v in dropped.items()) if dropped else ''))

    P('\n## 2–3. Against the original site (matched rows, same id)\n')
    P('| League | Rows | Matched | GP equal | |ΔMP| ≤ 2% | Raw: median |Δ| (GP & MP equal) | Raw: share |Δ|<0.25 | Orig BPM mean | New BPM mean |')
    P('|---|---|---|---|---|---|---|---|---|')
    by_l = defaultdict(list)
    for r in rows: by_l[r['league']].append(r)
    for lg, rs in by_l.items():
        m = [(r, orig.get((r['league'], r['season'], r['id']))) for r in rs]
        m = [(r, o) for r, o in m if o]
        gp_eq = sum(1 for r, o in m if r['gp'] == o['gp'])
        mp_ok = sum(1 for r, o in m if abs(r['mp'] - o['mp']) <= 0.02 * max(o['mp'], 1))
        same = [(r, o) for r, o in m if r['gp'] == o['gp'] and abs(r['mp'] - o['mp']) <= 0.02 * max(o['mp'], 1) and o['raw'] is not None and r['mp'] >= 100]
        d = [abs(r['raw'] - o['raw']) for r, o in same]
        def wavg(pairs, f):
            w = sum(r['mp'] for r, o in pairs)
            return sum(f(r, o) * r['mp'] for r, o in pairs) / w if w else float('nan')
        mo = [(r, o) for r, o in m if o['bpm'] is not None]
        P(f"| {lg} | {len(rs)} | {len(m)} | {gp_eq} | {mp_ok} | {st.median(d) if d else float('nan'):.2f} (n={len(d)}) | "
          f"{(sum(1 for x in d if x < 0.25) / len(d) if d else float('nan')):.0%} | {wavg(mo, lambda r, o: o['bpm']):+.2f} | {wavg(mo, lambda r, o: r['bpm']):+.2f} |")
    P('\n(BPM means are minute-weighted over matched rows.)')

    P('\n## 4. Team-adjustment sanity\n')
    tm = defaultdict(lambda: [0.0, 0.0, 0.0])
    for s in stints:
        k = (s['league'], s['season'], s['team'])
        tm[k][0] += s['mp']; tm[k][1] += s['mp'] * (s['raw'] + s['adj_game']); tm[k][2] += s['mp'] * (s['raw'] + s['adj_season'])
    diffs = [abs(5 * (b - c) / a) for a, b, c in tm.values() if a > 0]
    P(f"Team-seasons: {len(diffs)}. |5·Σshare·BPM(game) − 5·Σshare·BPM(season-constant)| (should be ≈ 0; OT games make it inexact): "
      f"median {pct(diffs, .5):.3f}, 95th pct {pct(diffs, .95):.3f}, max {max(diffs):.3f}")
    P('\n| League | GP share band | Players | mean |Δadj| | mean Δadj (game − season) |')
    P('|---|---|---|---|---|')
    bands = [(0.95, 1.01, '95–100%'), (0.80, 0.95, '80–95%'), (0.65, 0.80, '65–80%'), (0.50, 0.65, '50–65%'), (0.35, 0.50, '35–50%'), (0.0, 0.35, '<35%')]
    for lg in by_l:
        for lo, hi, lab in bands:
            ss = [s for s in stints if s['league'] == lg and s['team_games'] and lo <= s['gp'] / s['team_games'] < hi and s['mp'] >= 50]
            if not ss: continue
            dd = [s['adj_game'] - s['adj_season'] for s in ss]
            P(f"| {lg} | {lab} | {len(ss)} | {st.mean(abs(x) for x in dd):.2f} | {st.mean(dd):+.2f} |")

    P('\n## 5. Spot checks\n')
    P('| Player | League | Season | Team(s) | GP | MP | Raw | Adj (game) | BPM (game) | BPM (season const.) | Original site BPM |')
    P('|---|---|---|---|---|---|---|---|---|---|---|')
    for nm in ('Hayden Gray', 'Toby Okani'):
        for r in rows:
            if r['name'] == nm and r['season'] == '25-26':
                o = orig.get((r['league'], r['season'], r['id']))
                P(f"| {nm} | {r['league']} | {r['season']} | {r['teams']} | {r['gp']} | {r['mp']} | {r['raw']:.2f} | {r['adj']:.2f} | {r['bpm']:.2f} | {r['bpm_season_level']:.2f} | {o['bpm'] if o else float('nan'):.2f} |")
    # NBA <-> G League bridge players (same season, >= 185 MP both)
    key = lambda r: r.get('canonical_player_key') or r['player_key']
    best = {}
    for r in rows:
        k = (key(r), r['season'], r['league'])
        if k not in best or r['mp'] > best[k]['mp']: best[k] = r
    by = defaultdict(dict)
    for (p, s, l), r in best.items():
        if r['mp'] >= 185: by[(p, s)][l] = r
    br = [v for v in by.values() if 'NBA' in v and 'NBA G League' in v]
    if br:
        dn = [v['NBA']['bpm'] - v['NBA']['bpm_season_level'] for v in br]
        dg = [v['NBA G League']['bpm'] - v['NBA G League']['bpm_season_level'] for v in br]
        P(f"\nNBA↔G League bridge players (n={len(br)}): mean change game-level − season-constant: NBA side {st.mean(dn):+.2f}, G League side {st.mean(dg):+.2f}")

    P('\n## 6. League averages (minute-weighted final BPM per league-season)\n')
    P('| League | ' + ' | '.join(sorted({r['season'] for r in rows})) + ' |')
    P('|---|' + '---|' * len({r['season'] for r in rows}))
    seasons = sorted({r['season'] for r in rows})
    for lg, rs in by_l.items():
        cells = []
        for s in seasons:
            x = [r for r in rs if r['season'] == s]
            w = sum(r['mp'] for r in x)
            cells.append(f"{sum(r['bpm'] * r['mp'] for r in x) / w:+.2f}" if w else '—')
        P(f"| {lg} | " + ' | '.join(cells) + ' |')
    P(f"\nRows: {rep['rows']}, matched to original ids: {rep['matched']}, unmatched: {sum(rep['unmatched'].values())}")
    print('\n'.join(out))


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
