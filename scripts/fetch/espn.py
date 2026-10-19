#!/usr/bin/env python3
"""Fetch NBA / G League box scores from ESPN's public JSON API.
Lists events for season types 1 (pre), 2 (regular), 5 (play-in / G League Showcase) via sports.core.api.espn.com,
then each event's summary. Regular-season filtering happens later in build (type and team checks).
Output: <out>/<league>_<season>.jsonl (same per-game shape as bbref_intl.py, plus espn_type, date, notes).
Usage: espn.py OUTDIR nba|nba-development [endYear ...]"""
import json, os, re, sys, time, urllib.request
from concurrent.futures import ThreadPoolExecutor

CORE = 'https://sports.core.api.espn.com/v2/sports/basketball/leagues'
SITE = 'https://site.api.espn.com/apis/site/v2/sports/basketball'

def get(url):
    for a in range(6):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'}), timeout=40) as r:
                return json.load(r)
        except Exception as e:
            print('ERR', e, url, flush=True); time.sleep(5 * (a + 1) ** 2)
    raise RuntimeError(url)

def events(league, year, t):
    ids, page = [], 1
    while True:
        d = get(f'{CORE}/{league}/seasons/{year}/types/{t}/events?limit=500&page={page}')
        ids += [re.search(r'events/(\d+)', i['$ref']).group(1) for i in d.get('items', [])]
        if page >= d.get('pageCount', 1): return ids
        page += 1

def num(v):
    try: return int(str(v).replace('+', ''))
    except: return 0

def parse(league, eid, t):
    d = get(f'{SITE}/{league}/summary?event={eid}')
    h = d['header']; c = h['competitions'][0]
    status = c.get('status', {}).get('type', {})
    if not status.get('completed'): return None
    comp = {x['homeAway']: x for x in c['competitors']}
    players, totals = [], {}
    for blk in d.get('boxscore', {}).get('players', []):
        tid = blk['team']['id']
        st = blk['statistics'][0]; keys = st['keys']
        for a in st.get('athletes', []):
            if a.get('didNotPlay') or not a.get('stats'): continue
            v = dict(zip(keys, a['stats']))
            fg = v.get('fieldGoalsMade-fieldGoalsAttempted', '0-0').split('-')
            f3 = v.get('threePointFieldGoalsMade-threePointFieldGoalsAttempted', '0-0').split('-')
            ft = v.get('freeThrowsMade-freeThrowsAttempted', '0-0').split('-')
            players.append(dict(team=tid, player_id=str(a['athlete'].get('id') or a['athlete'].get('displayName')), name=a['athlete'].get('displayName', ''),
                                min=float(num(v.get('minutes'))), fgm=num(fg[0]), fga=num(fg[1]), fg3m=num(f3[0]),
                                fg3a=num(f3[1]), ftm=num(ft[0]), fta=num(ft[1]), orb=num(v.get('offensiveRebounds')),
                                drb=num(v.get('defensiveRebounds')), ast=num(v.get('assists')), stl=num(v.get('steals')),
                                blk=num(v.get('blocks')), tov=num(v.get('turnovers')), pf=num(v.get('fouls')),
                                pts=num(v.get('points'))))
    for tb in d.get('boxscore', {}).get('teams', []):
        s = {x['name']: x.get('displayValue') for x in tb.get('statistics', [])}
        totals[tb['team']['id']] = dict(team_tov=num(s.get('teamTurnovers')), total_tov=num(s.get('totalTurnovers')),
                                        team_reb=num(s.get('teamRebounds')))
    team = lambda x: x['team']
    return dict(game_id=eid, espn_type=t, date=c.get('date') or h.get('date'),
                notes=[n.get('headline') for n in c.get('notes', [])] + [n.get('headline', '') for n in h.get('gameNote', [])] if isinstance(h.get('gameNote'), list) else [n.get('headline') for n in c.get('notes', [])],
                neutral=c.get('neutralSite'),
                home=comp['home']['team']['id'], away=comp['away']['team']['id'],
                home_name=team(comp['home']).get('displayName'), away_name=team(comp['away']).get('displayName'),
                home_abbr=team(comp['home']).get('abbreviation'), away_abbr=team(comp['away']).get('abbreviation'),
                home_pts=num(comp['home'].get('score')), away_pts=num(comp['away'].get('score')),
                totals=totals, players=players)

def safe(league, eid, t):
    try: return parse(league, eid, t)
    except Exception as e:
        print('PARSE-FAIL', eid, repr(e), flush=True); return None

def main(out, league, years):
    os.makedirs(out, exist_ok=True)
    for y in years:
        season = f'{(y - 1) % 100:02d}-{y % 100:02d}'
        fn = os.path.join(out, f'{league}_{season}.jsonl')
        done = {json.loads(l)['game_id'] for l in open(fn)} if os.path.exists(fn) else set()
        todo = [(eid, t) for t in (1, 2, 5) for eid in events(league, y, t) if eid not in done]
        print(league, season, 'todo', len(todo), 'done', len(done), flush=True)
        with open(fn, 'a') as f, ThreadPoolExecutor(4) as ex:
            for r in ex.map(lambda e: safe(league, *e), todo):
                if r: f.write(json.dumps(r) + '\n'); f.flush()
        print(league, season, 'complete', flush=True)

if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2], [int(x) for x in sys.argv[3:]] or [2021, 2022, 2023, 2024, 2025, 2026])
