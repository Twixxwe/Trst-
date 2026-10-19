#!/usr/bin/env python3
"""Fetch EuroLeague regular-season (phaseType RS) box scores from api-live.euroleague.net.
Output: <out>/euroleague_<season>.jsonl in the same per-game shape as bbref_intl.py.
Usage: euroleague.py OUTDIR"""
import json, os, sys, time, urllib.request

API = 'https://api-live.euroleague.net'
F = [('fieldGoalsMadeTotal', 'fgm'), ('fieldGoalsAttemptedTotal', 'fga'), ('fieldGoalsMade3', 'fg3m'),
     ('fieldGoalsAttempted3', 'fg3a'), ('freeThrowsMade', 'ftm'), ('freeThrowsAttempted', 'fta'),
     ('offensiveRebounds', 'orb'), ('defensiveRebounds', 'drb'), ('assistances', 'ast'), ('steals', 'stl'),
     ('blocksFavour', 'blk'), ('turnovers', 'tov'), ('foulsCommited', 'pf'), ('points', 'pts')]

def get(url):
    for a in range(5):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'}), timeout=40) as r:
                return json.load(r)
        except Exception as e:
            print('ERR', e, url, flush=True); time.sleep(10 * (a + 1))
    raise RuntimeError(url)

def main(out):
    os.makedirs(out, exist_ok=True)
    for year in range(2020, 2026):
        season = f'{year % 100:02d}-{(year + 1) % 100:02d}'
        fn = os.path.join(out, f'euroleague_{season}.jsonl')
        done = {json.loads(l)['game_id'] for l in open(fn)} if os.path.exists(fn) else set()
        games = [g for g in get(f'{API}/v2/competitions/E/seasons/E{year}/games')['data']
                 if g['played'] and g['phaseType']['code'] == 'RS']
        print(season, len(games), flush=True)
        with open(fn, 'a') as f:
            for g in sorted(games, key=lambda g: g['gameCode']):
                gid = g['identifier']
                if gid in done: continue
                b = get(f"{API}/v3/competitions/E/seasons/E{year}/games/{g['gameCode']}/stats")
                players, totals = [], {}
                for side, key in (('local', 'home'), ('road', 'away')):
                    team = g[side]['club']['code']
                    for p in b[side]['players']:
                        s = p['stats']
                        rec = {k2: int(s.get(k1) or 0) for k1, k2 in F}
                        rec.update(team=team, player_id=p['player']['person']['code'], name=p['player']['person']['name'],
                                   min=(s.get('timePlayed') or 0) / 60)
                        players.append(rec)
                    tt = b[side].get('total') or b[side].get('totals') or {}
                    if tt:
                        totals[team] = {k2: int(tt.get(k1) or 0) for k1, k2 in F}
                        totals[team]['min'] = (tt.get('timePlayed') or 0) / 60
                f.write(json.dumps(dict(game_id=gid, home=g['local']['club']['code'], away=g['road']['club']['code'],
                                        home_name=g['local']['club']['name'], away_name=g['road']['club']['name'],
                                        home_pts=g['local']['score'], away_pts=g['road']['score'], ot='',
                                        totals=totals, players=players)) + '\n')
                time.sleep(0.4)

if __name__ == '__main__':
    main(sys.argv[1])
