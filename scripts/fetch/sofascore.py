#!/usr/bin/env python3
"""Fetch Germany BBL and Puerto Rico BSN box scores from SofaScore's public JSON API.
Keeps every finished event with its tournament name and round info; the build step keeps only regular season
(tournament name without a ", Playoffs"/", Play-in" suffix and no cupRoundType).
Output: <out>/<key>_<season>.jsonl (same per-game shape as bbref_intl.py, plus tournament/round).
Usage: sofascore.py OUTDIR bbl|bsn"""
import json, os, sys, time, urllib.request, urllib.error

API = 'https://api.sofascore.com/api/v1'
TOURN = {'bbl': (227, {'20/21': '20-21', '21/22': '21-22', '22/23': '22-23', '23/24': '23-24', '24/25': '24-25', '25/26': '25-26'}),
         'bsn': (17374, {'2021': '21-22', '2022': '22-23', '2023': '23-24', '2024': '24-25', '2025': '25-26'})}
_last = [0.0]

def get(path):
    for a in range(6):
        w = 1.2 - (time.time() - _last[0])
        if w > 0: time.sleep(w)
        _last[0] = time.time()
        try:
            with urllib.request.urlopen(urllib.request.Request(API + path, headers={'User-Agent': 'Mozilla/5.0'}), timeout=40) as r:
                return json.load(r)
        except urllib.error.HTTPError as e:
            if e.code == 404: return None
            print('HTTP', e.code, path, flush=True); time.sleep(60 * (a + 1))
        except Exception as e:
            print('ERR', e, path, flush=True); time.sleep(20 * (a + 1))
    raise RuntimeError(path)

def main(out, key):
    os.makedirs(out, exist_ok=True)
    tid, seasons = TOURN[key]
    for s in get(f'/unique-tournament/{tid}/seasons')['seasons']:
        if s['year'] not in seasons: continue
        season = seasons[s['year']]
        fn = os.path.join(out, f'{key}_{season}.jsonl')
        done = {json.loads(l)['game_id'] for l in open(fn)} if os.path.exists(fn) else set()
        evs, page = [], 0
        while True:
            d = get(f"/unique-tournament/{tid}/season/{s['id']}/events/last/{page}")
            if not d: break
            evs += d['events']
            if not d.get('hasNextPage'): break
            page += 1
        evs = [e for e in evs if e['status']['type'] == 'finished']
        print(key, season, 'events', len(evs), 'done', len(done), flush=True)
        with open(fn, 'a') as f:
            for e in evs:
                gid = str(e['id'])
                if gid in done: continue
                lu = get(f'/event/{gid}/lineups')
                players = []
                for side in ('home', 'away'):
                    team = str(e[side + 'Team']['id'])
                    for p in (lu or {}).get(side, {}).get('players', []):
                        st = p.get('statistics') or {}
                        if not st.get('secondsPlayed'): continue
                        g = lambda k: int(st.get(k) or 0)
                        players.append(dict(team=team, player_id=str(p['player']['id']), name=p['player']['name'],
                                            min=st['secondsPlayed'] / 60, fgm=g('fieldGoalsMade'), fga=g('fieldGoalAttempts'),
                                            fg3m=g('threePointsMade'), fg3a=g('threePointAttempts'), ftm=g('freeThrowsMade'),
                                            fta=g('freeThrowAttempts'), orb=g('offensiveRebounds'), drb=g('defensiveRebounds'),
                                            ast=g('assists'), stl=g('steals'), blk=g('blocks'), tov=g('turnovers'),
                                            pf=g('personalFouls'), pts=g('points')))
                f.write(json.dumps(dict(game_id=gid, date=e.get('startTimestamp'), tournament=e['tournament']['name'],
                                        round=e.get('roundInfo'), home=str(e['homeTeam']['id']), away=str(e['awayTeam']['id']),
                                        home_name=e['homeTeam']['name'], away_name=e['awayTeam']['name'],
                                        home_pts=e['homeScore'].get('current'), away_pts=e['awayScore'].get('current'),
                                        ot='', totals={}, players=players)) + '\n')
                f.flush()

if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
