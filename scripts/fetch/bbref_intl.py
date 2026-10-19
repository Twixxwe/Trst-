#!/usr/bin/env python3
"""Fetch regular-season box scores from Basketball-Reference international pages.
Polite: one request every ~4 s (BBRef allows ~20/min). Resumable.
Output: <out>/<league_key>_<season>.jsonl, one JSON object per game:
  {game_id, date, home, away, home_pts, away_pts, players:[{team, player_id, name, min, fgm, ...}]}
Usage: bbref_intl.py OUTDIR [league_key ...]"""
import json, os, re, sys, time, urllib.request, urllib.error, html as htmlmod

LEAGUES = {  # league_key: (bbref slug, site league name)
    'acb': ('spain-liga-acb', 'Spain ACB'),
    'bsl': ('turkey-super-league', 'Turkey BSL'),
    'lnb': ('france-lnb-pro-a', 'France LNB'),
    'italy': ('italy-basket-serie-a', 'Italy LBA'),
    'israel': ('israel-super-league', 'Israel Winner League'),
}
YEARS = [2021, 2022, 2023, 2024, 2025, 2026]
BASE = 'https://www.basketball-reference.com'
DELAY = 4.0
_last = [0.0]

def get(path):
    for attempt in range(6):
        wait = DELAY - (time.time() - _last[0])
        if wait > 0: time.sleep(wait)
        _last[0] = time.time()
        req = urllib.request.Request(BASE + path, headers={'User-Agent': 'Mozilla/5.0 (research; low-rate)'})
        try:
            with urllib.request.urlopen(req, timeout=40) as r:
                return r.read().decode('utf-8', 'replace').replace('<!--', '').replace('-->', '')
        except urllib.error.HTTPError as e:
            if e.code == 404: return None
            if e.code == 429:
                print('429: sleeping 3700 s', flush=True); time.sleep(3700); continue
            print('HTTP', e.code, path, flush=True); time.sleep(30 * (attempt + 1))
        except Exception as e:
            print('ERR', e, path, flush=True); time.sleep(30 * (attempt + 1))
    raise RuntimeError('failed ' + path)

def cells(row):
    out = {}
    for stat, body in re.findall(r'data-stat="([^"]*)"[^>]*>(.*?)</t[dh]>', row, re.S):
        out[stat] = body
    return out

def text(s): return htmlmod.unescape(re.sub('<[^>]+>', '', s)).strip()

def schedule(slug, year):
    h = get(f'/international/{slug}/{year}-schedule.html')
    if h is None: return []
    games = []
    for tid, body in re.findall(r'<table[^>]*id="([^"]*)"(.*?)</table>', h, re.S):
        if not tid.startswith('regular-season'): continue
        for row in re.findall(r'<tr[^>]*>(.*?)</tr>', body, re.S):
            c = cells(row)
            m = re.search(r'href="(/international/boxscores/[^"]+)"', c.get('date_game', ''))
            if not m or not text(c.get('home_pts', '')): continue
            team = lambda k: (re.search(r'/international/teams/([^/]+)/', c.get(k, '')) or [None, text(c.get(k, ''))])[1]
            games.append(dict(path=m.group(1),
                              away=team('visitor_team_name'), home=team('home_team_name'),
                              away_name=text(c.get('visitor_team_name', '')), home_name=text(c.get('home_team_name', '')),
                              away_pts=int(text(c['visitor_pts'])), home_pts=int(text(c['home_pts'])),
                              ot=text(c.get('overtimes', ''))))
    return games

def minutes(s):
    s = text(s)
    if not s or ':' not in s:
        try: return float(s)
        except: return 0.0
    m, sec = s.split(':')[:2]
    return int(m) + int(sec) / 60

STATS = [('fg', 'fgm'), ('fga', 'fga'), ('fg3', 'fg3m'), ('fg3a', 'fg3a'), ('ft', 'ftm'), ('fta', 'fta'), ('orb', 'orb'),
         ('drb', 'drb'), ('ast', 'ast'), ('stl', 'stl'), ('blk', 'blk'), ('tov', 'tov'), ('pf', 'pf'), ('pts', 'pts')]

def box(g):
    h = get(g['path'])
    if h is None: return None
    players, totals = [], {}
    for side, team in (('visitor', g['away']), ('home', g['home'])):
        m = re.search(r'<table[^>]*id="box-score-' + side + r'"(.*?)</table>', h, re.S)
        if not m: return None
        for row in re.findall(r'<tr[^>]*>(.*?)</tr>', m.group(1), re.S):
            c = cells(row)
            name = text(c.get('player', ''))
            if not name or name == 'Player' or 'fga' not in c: continue
            rec = {k2: int(text(c[k1]) or 0) for k1, k2 in STATS if k1 in c}
            if name == 'Team Totals':
                rec['min'] = minutes(c.get('mp', '')); totals[team] = rec; continue
            pid = re.search(r'/international/players/([^".]+)\.html', c.get('player', ''))
            rec.update(team=team, player_id=pid.group(1) if pid else name, name=name, min=minutes(c.get('mp', '')))
            players.append(rec)
    return players, totals

def main(outdir, keys):
    os.makedirs(outdir, exist_ok=True)
    for key in keys:
        slug, _ = LEAGUES[key]
        for year in YEARS:
            season = f'{(year - 1) % 100:02d}-{year % 100:02d}'
            fn = os.path.join(outdir, f'{key}_{season}.jsonl')
            done = set()
            if os.path.exists(fn):
                done = {json.loads(l)['game_id'] for l in open(fn) if l.strip()}
            games = schedule(slug, year)
            print(key, season, 'schedule', len(games), 'done', len(done), flush=True)
            with open(fn, 'a') as f:
                for g in games:
                    gid = g['path'].rsplit('/', 1)[1].replace('.html', '')
                    if gid in done: continue
                    r = box(g)
                    if r is None:
                        print('no box', gid, flush=True); continue
                    players, totals = r
                    f.write(json.dumps(dict(game_id=gid, home=g['home'], away=g['away'], home_name=g['home_name'],
                                            away_name=g['away_name'], home_pts=g['home_pts'], away_pts=g['away_pts'],
                                            ot=g['ot'], totals=totals, players=players)) + '\n')
                    f.flush()
            print(key, season, 'complete', flush=True)

if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2:] or list(LEAGUES))
