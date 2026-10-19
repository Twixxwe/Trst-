#!/usr/bin/env python3
"""Download the Atlas site's country-game data (GET only) and keep a compact copy for the country-game test.
Output: OUT/atlas_compact.json = {games:{id: game}, spreads:{id: margin}, details:{id:{game, players:[...]}}}"""
import json, sys, time, urllib.request, urllib.error
B = 'https://basketball-atlas-bpm-lab-v2.vercel.app'
V = '?v=club-full-bpm2-euro2223-euro2324-20261015'
KEEP_G = ['fiba_game_id', 'date', 'country_a_id', 'country_b_id', 'score_a', 'score_b', 'neutral_site', 'host_country_code', 'competition']
KEEP_P = ['country_id', 'minutes', 'bpm_status', 'bpm_league', 'bpm_season', 'bpm_source_player_id', 'bpm_final_bpm', 'player']

def j(path):
    for a in range(6):
        try:
            with urllib.request.urlopen(urllib.request.Request(B + path + V, headers={'User-Agent': 'Mozilla/5.0'}), timeout=300) as r:
                return json.load(r)
        except urllib.error.HTTPError as e:
            if e.code == 404: raise
            err = e
        except Exception as e:
            err = e
        print('retry', path, err, flush=True); time.sleep(5 * (a + 1))
    raise err

def main(out):
    games = {}
    for p in ('/data/games.json', '/data/extra_games.json'):
        g = j(p); g = g.get('games', g) if isinstance(g, dict) else g
        for x in g: games[str(x['fiba_game_id'])] = {k: x.get(k) for k in KEEP_G}
    ps = j('/data/point_spreads.json'); ps = ps.get('games', ps)
    spreads = {k: v.get('predicted_margin_a') for k, v in ps.items()}
    det = {}
    for i in range(64):
        for base in ('/data/game_details/shard-', '/data/extra_game_details/shard-'):
            try: d = j(f'{base}{i:02d}.json')
            except Exception as e: print('skip', base, i, e, flush=True); continue
            d = d.get('games', d) if 'games' in d and isinstance(d.get('games'), dict) else d
            for k, v in d.items():
                if not isinstance(v, dict) or 'players' not in v: continue
                det[k] = dict(game={kk: (v.get('game') or {}).get(kk) for kk in KEEP_G} if v.get('game') else None,
                              players=[{kk: p.get(kk) for kk in KEEP_P} for p in v['players']])
        print('shard', i, len(det), flush=True)
    json.dump(dict(games=games, spreads=spreads, details=det), open(out + '/atlas_compact.json', 'w'))
    print('games', len(games), 'details', len(det), 'spreads', len(spreads))

if __name__ == '__main__':
    main(sys.argv[1])
