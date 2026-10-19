#!/usr/bin/env python3
"""Fetch CEBL regular-season box scores: match ids from the Genius Sports hosted schedule
(phaseName=Regular Season), box scores from FIBA LiveStats data.json.
Output: <out>/cebl_<season>.jsonl (same per-game shape as bbref_intl.py). Season label: summer Y -> "(YY-1)-YY",
matching the original site's CEBL labels (summer 2022 -> 21-22, verified on GP/MP of matched players).
Usage: cebl.py OUTDIR"""
import json, os, re, sys, time, urllib.request

COMPS = {2021: 29423, 2022: 33076, 2023: 35363, 2024: 37308, 2025: 40250, 2026: 47852}
HOSTED = 'https://hosted.dcd.shared.geniussports.com/CEBL/en/competition/{}/schedule?phaseName=Regular%20Season'
LIVE = 'https://fibalivestats.dcd.shared.geniussports.com/data/{}/data.json'

def get(url, js=True):
    for a in range(5):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'}), timeout=40) as r:
                b = r.read()
                return json.loads(b) if js else b.decode('utf-8', 'replace')
        except Exception as e:
            print('ERR', e, url, flush=True); time.sleep(10 * (a + 1))
    raise RuntimeError(url)

def mins(s):
    s = str(s or '0:00')
    if ':' not in s: return float(s or 0)
    m, sec = s.split(':')[:2]
    return int(m) + int(sec) / 60

def main(out):
    os.makedirs(out, exist_ok=True)
    for y, comp in COMPS.items():
        season = f'{(y - 1) % 100:02d}-{y % 100:02d}'
        fn = os.path.join(out, f'cebl_{season}.jsonl')
        done = {json.loads(l)['game_id'] for l in open(fn)} if os.path.exists(fn) else set()
        ids = sorted(set(re.findall(r'match/(\d+)/boxscore', get(HOSTED.format(comp), js=False))))
        print('cebl', season, 'matches', len(ids), 'done', len(done), flush=True)
        with open(fn, 'a') as f:
            for mid in ids:
                if mid in done: continue
                d = get(LIVE.format(mid))
                tm = d['tm']
                players = []
                for k in ('1', '2'):
                    t = tm[k]
                    for pid, p in (t.get('pl') or {}).items():
                        m = mins(p.get('sMinutes'))
                        if m <= 0: continue
                        g = lambda x: int(p.get(x) or 0)
                        players.append(dict(team=t['name'], player_id=f"{p.get('firstName','')} {p.get('familyName','')}".strip(),
                                            name=f"{p.get('firstName','')} {p.get('familyName','')}".strip(), min=m,
                                            fgm=g('sFieldGoalsMade'), fga=g('sFieldGoalsAttempted'), fg3m=g('sThreePointersMade'),
                                            fg3a=g('sThreePointersAttempted'), ftm=g('sFreeThrowsMade'), fta=g('sFreeThrowsAttempted'),
                                            orb=g('sReboundsOffensive'), drb=g('sReboundsDefensive'), ast=g('sAssists'),
                                            stl=g('sSteals'), blk=g('sBlocks'), tov=g('sTurnovers'), pf=g('sFoulsPersonal'),
                                            pts=g('sPoints')))
                totals = {tm[k]['name']: dict(team_tov=int(tm[k].get('tot_sTurnoversTeam') or 0),
                                              team_orb=int(tm[k].get('tot_sReboundsTeamOffensive') or 0)) for k in ('1', '2')}
                f.write(json.dumps(dict(game_id=mid, home=tm['1']['name'], away=tm['2']['name'], home_name=tm['1']['name'],
                                        away_name=tm['2']['name'], home_pts=int(tm['1'].get('score') or 0),
                                        away_pts=int(tm['2'].get('score') or 0), ot='', totals=totals, players=players)) + '\n')
                f.flush(); time.sleep(0.5)

if __name__ == '__main__':
    main(sys.argv[1])
