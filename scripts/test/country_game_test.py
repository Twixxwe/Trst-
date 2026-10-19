#!/usr/bin/env python3
"""Python port of scripts/country_game_test.js (Atlas country-vs-country test), plus a new-BPM lookup.

Same rules as the JS: both teams >= 75% of minutes rated by the 11 leagues; impact = (BPM + offset) * min * 0.02;
home court +-3 where the host is known; error regressed on [1, unknownHost, nbaMinuteEdge/100]; nbaUnderrated = coef/2.

BPM sources
  current  : the Atlas row's bpm_final_bpm (original site, last completed season before the game = pregame)
  new      : this site's bpm for the same (bpm_league, bpm_season, bpm_source_player_id)
  *_retro  : same player, season containing the game (any of the 11 leagues, highest-minute row) = retrospective

Usage: country_game_test.py atlas_compact.json NEW_DATA_JSON ORIG_DATA_JSON ladders.json > out.json
ladders.json = {"name": {"bpm": "current|new|current_retro|new_retro", "offsets": {league: offset}}, ...}"""
import json, math, sys
from collections import defaultdict

L11 = ['NBA', 'EuroLeague', 'Spain ACB', 'NBA G League', 'Turkey BSL', 'Italy LBA', 'France LNB',
       'Israel Winner League', 'Germany BBL', 'Puerto Rico BSN', 'Canadian Elite Basketball League']


def mins(s):
    if s is None: return 0.0
    if isinstance(s, (int, float)): return float(s)
    a, _, b = str(s).partition(':')
    try: return float(a or 0) + float(b or 0) / 60
    except ValueError: return 0.0


def season_of(date):
    y, m = int(date[:4]), int(date[5:7])
    s = y if m >= 9 else y - 1  # Aug games belong to the season that just ended
    return f'{s % 100:02d}-{(s + 1) % 100:02d}'


def lookups(path):
    d = json.load(open(path, encoding='utf-8'))
    exact, best = {}, {}
    for r in d['rows']:
        if r.get('bpm') is None or r['league'] not in L11: continue
        exact[(r['league'], r['season'], str(r['id']))] = r['bpm']
        k = (r['season'], str(r['id']))
        if k not in best or r['mp'] > best[k][2]: best[k] = (r['league'], r['bpm'], r['mp'])
    return exact, best


def reg(rows, yf):
    X = [[1.0, r['unk'], r['nbaDiff'] / 100] for r in rows]; y = [yf(r) for r in rows]
    A = [[sum(x[a] * x[c] for x in X) for c in range(3)] for a in range(3)]
    b = [sum(x[a] * yy for x, yy in zip(X, y)) for a in range(3)]
    M = [A[i][:] + [b[i]] for i in range(3)]
    for i in range(3):
        p = max(range(i, 3), key=lambda r: abs(M[r][i])); M[i], M[p] = M[p], M[i]
        if abs(M[i][i]) < 1e-12: return None
        pv = M[i][i]; M[i] = [v / pv for v in M[i]]
        for r in range(3):
            if r != i: f = M[r][i]; M[r] = [a - f * c for a, c in zip(M[r], M[i])]
    n = len(y)
    return dict(n=n, nbaUnderrated=round(M[2][3] / 2, 2), rmse=round(math.sqrt(sum(e * e for e in y) / n), 3),
                mae=round(sum(abs(e) for e in y) / n, 3), bias=round(sum(y) / n, 3))


def main(atlas, new_path, orig_path, lad_path):
    A = json.load(open(atlas)); lads = json.load(open(lad_path))
    new_exact, new_best = lookups(new_path)
    cur_exact, cur_best = lookups(orig_path)

    def bpm_of(src, p, date):
        if p.get('bpm_status') != 'matched' or p.get('bpm_league') not in L11: return None, None
        lg, ss, pid = p['bpm_league'], p.get('bpm_season'), str(p.get('bpm_source_player_id'))
        if src == 'current':
            v = p.get('bpm_final_bpm')
            return (lg, v) if isinstance(v, (int, float)) and math.isfinite(v) else (None, None)
        if src == 'new':
            v = new_exact.get((lg, ss, pid)); return (lg, v) if v is not None else (None, None)
        best = cur_best if src == 'current_retro' else new_best
        b = best.get((season_of(date), pid))
        return (b[0], b[1]) if b else (None, None)

    games = []
    for k, d in A['details'].items():
        g = d.get('game') or A['games'].get(k)
        if not g or not g.get('country_a_id') or not d.get('players'): continue
        games.append((k, g, d['players']))

    per = {}
    for name, cfg in lads.items():
        rows = {}
        for k, g, players in games:
            T = {s: dict(tot=0.0, cov=0.0, nba=0.0, imp=0.0) for s in 'AB'}
            for p in players:
                side = 'A' if p['country_id'] == g['country_a_id'] else 'B' if p['country_id'] == g['country_b_id'] else None
                if not side: continue
                m = mins(p['minutes']); T[side]['tot'] += m
                lg, v = bpm_of(cfg['bpm'], p, g['date'])
                if lg is None or lg not in cfg['offsets']: continue
                T[side]['cov'] += m
                if lg == 'NBA': T[side]['nba'] += m
                T[side]['imp'] += (v + cfg['offsets'][lg]) * m * 0.02
            if not (T['A']['tot'] > 0 and T['B']['tot'] > 0) or T['A']['cov'] / T['A']['tot'] < 0.75 or T['B']['cov'] / T['B']['tot'] < 0.75: continue
            hca = 0 if g.get('neutral_site') else 3 if g.get('host_country_code') == g['country_a_id'] else -3 if g.get('host_country_code') == g['country_b_id'] else 0
            unk = 1 if g.get('host_country_code') is None and not g.get('neutral_site') else 0
            rows[k] = dict(unk=unk, nbaDiff=T['A']['nba'] - T['B']['nba'], actual=g['score_a'] - g['score_b'],
                           mkt=A['spreads'].get(k), pred=T['A']['imp'] - T['B']['imp'] + hca)
        per[name] = rows

    def score(names, keys):
        out = {}
        for n in names:
            rs = [per[n][k] for k in keys]
            um = [r for r in rs if r['mkt'] is not None]
            nbm = [r for r in um if abs(r['nbaDiff']) >= 40]
            out[n] = dict(bpm=lads[n]['bpm'], vsResult=reg(rs, lambda r: r['actual'] - r['pred']),
                          vsMarket=reg(um, lambda r: r['mkt'] - r['pred']) if um else None,
                          nbaHeavyVsMarket=dict(n=len(nbm), rmse=round(math.sqrt(sum((r['mkt'] - r['pred']) ** 2 for r in nbm) / len(nbm)), 3)) if nbm else None)
        return out

    result = {'own_game_sets': {n: dict(games=len(per[n]), marketGames=sum(1 for r in per[n].values() if r['mkt'] is not None), **score([n], list(per[n]))[n]) for n in per}}
    common = set.intersection(*(set(v) for v in per.values()))
    result['identical_games'] = dict(games=len(common), marketGames=sum(1 for k in common if A['spreads'].get(k) is not None),
                                     results=score(list(per), sorted(common)))
    json.dump(result, sys.stdout, indent=1)


if __name__ == '__main__':
    main(*sys.argv[1:5])
