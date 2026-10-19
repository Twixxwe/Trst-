#!/usr/bin/env python3
"""Build the game-level BPM site data from regular-season box scores.

Steps
  1. Load per-game JSONL from scripts/fetch/* (raw dir), keep REGULAR SEASON games only.
  2. Write games.csv / player_games.csv and run the reference engine scripts/bpm_gamelevel.py
     (raw BPM exactly as the original site + 2.8 game-level team adjustment).
  3. Match every player-season to the original site's row (same league + season) to keep the
     original ids / player_key / canonical_player_key / url, and map team names to the original's names.
  4. Write data.json, api/players.csv, api/players.json, api/players.ndjson, api/<league>/players.json,
     legacy-bpm.json (= original site's season-level BPM) and schedule-scaled-bpm.json (original's, filtered).

Usage: build.py RAW_DIR ORIG_DIR OUT_SITE_DIR WORK_DIR
  ORIG_DIR holds GET-only downloads of the original site: f_data.json, legacy-bpm.json, schedule-scaled-bpm.json
"""
import csv, json, os, re, sys, unicodedata, difflib, datetime
from collections import defaultdict, Counter

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpm_gamelevel  # noqa: E402

SEASONS = ['20-21', '21-22', '22-23', '23-24', '24-25', '25-26']
# source file prefix -> (site league name, source tag)
SOURCES = {
    'nba': ('NBA', 'espn'), 'nba-development': ('NBA G League', 'espn'),
    'euroleague': ('EuroLeague', 'euroleague'),
    'acb': ('Spain ACB', 'bbref'), 'bsl': ('Turkey BSL', 'bbref'), 'lnb': ('France LNB', 'bbref'),
    'italy': ('Italy LBA', 'bbref'), 'israel': ('Israel Winner League', 'bbref'),
    'bbl': ('Germany BBL', 'sofascore'), 'bsn': ('Puerto Rico BSN', 'sofascore'),
    'cebl': ('Canadian Elite Basketball League', 'genius'),
}
SOURCE_URL = {
    'espn': 'https://www.espn.com/{sport}/player/_/id/{pid}',
    'bbref': 'https://www.basketball-reference.com/international/players/{pid}.html',
    'sofascore': 'https://www.sofascore.com/player/x/{pid}',
}
NUM = ['min', 'fgm', 'fga', 'fg3m', 'fg3a', 'ftm', 'fta', 'orb', 'drb', 'ast', 'stl', 'blk', 'tov', 'pf', 'pts']
GL_NOTE = 'G League free-throw scoring differs from ordinary box-score arithmetic; season-level BPM is approximate.'


def load_games(raw):
    """Return {(league, season): [game,...]} with regular-season games only, plus a filter log."""
    out, log = defaultdict(list), []
    for sub in sorted(os.listdir(raw)):
        d = os.path.join(raw, sub)
        if not os.path.isdir(d): continue
        for fn in sorted(os.listdir(d)):
            m = re.match(r'(.+)_(\d\d-\d\d)\.jsonl$', fn)
            if not m or m.group(1) not in SOURCES or m.group(2) not in SEASONS: continue
            key, season = m.groups()
            league, src = SOURCES[key]
            games, seen = [], set()
            for line in open(os.path.join(d, fn)):
                if not line.strip(): continue
                g = json.loads(line)
                if g['game_id'] in seen: continue
                seen.add(g['game_id'])
                g['src'] = src
                if key == 'cebl':
                    for side in ('home', 'away'): g[side] = team_key(g[side])
                    for p in g['players']: p['team'] = team_key(p['team'])
                games.append(g)
            kept, why = regular_season(key, games, season)
            log.append((league, season, len(games), len(kept), dict(why)))
            out[(league, season)] = kept
    return out, log


def regular_season(key, games, season):
    why = Counter()
    if key == 'nba':
        nba_ids = {str(i) for i in range(1, 31)}
        kept = []
        by_day = Counter(g['date'][:10] for g in games if g.get('espn_type') == 2)
        for g in games:
            if g.get('espn_type') != 2: why['not regular season (ESPN type %s)' % g.get('espn_type')] += 1; continue
            if g['home'] not in nba_ids or g['away'] not in nba_ids: why['non-NBA teams (All-Star etc.)'] += 1; continue
            # NBA Cup final: neutral-site December game that is the only game that day (does not count in standings)
            if g.get('neutral') and g['date'][5:7] == '12' and by_day[g['date'][:10]] == 1:
                why['NBA Cup final'] += 1; continue
            kept.append(g)
        # ESPN labels some play-in games (e.g. April 2023) as regular season: cap each team at its schedule length in date order
        cap = 72 if season == '20-21' else 82
        n, final = Counter(), []
        for g in sorted(kept, key=lambda g: g['date']):
            if n[g['home']] >= cap or n[g['away']] >= cap: why['beyond %d games (play-in labeled as regular season)' % cap] += 1; continue
            n[g['home']] += 1; n[g['away']] += 1; final.append(g)
        return final, why
    if key == 'nba-development':
        kept = []
        for g in games:
            # 2 = regular season, 5 = Showcase Cup / Tip-Off Tournament. ESPN files part of the 2023-24 Tip-Off
            # Tournament (Nov-Dec) under type 1, so type-1 games from November on count as Showcase games.
            if g.get('espn_type') in (2, 5) or (g.get('espn_type') == 1 and g['date'][5:7] in ('11', '12')): kept.append(g)
            else: why['not regular season / Showcase (ESPN type %s)' % g.get('espn_type')] += 1
        return kept, why
    if key in ('bbl', 'bsn'):
        base = {'bbl': 'Germany BBL', 'bsn': 'Puerto Rico BSN'}[key]
        kept = []
        for g in games:
            if g.get('tournament') != base: why[g.get('tournament')] += 1; continue
            if g.get('round') and g['round'].get('cupRoundType'): why['cup round'] += 1; continue
            kept.append(g)
        return kept, why
    return games, why  # EuroLeague (phase RS), BBRef (regular-season table), CEBL (phase Regular Season) filtered at fetch


def team_key(name):
    s = unicodedata.normalize('NFKD', name or '')
    return re.sub(r'[^a-z0-9]+', '-', ''.join(c for c in s if not unicodedata.combining(c)).lower()).strip('-')


def team_minutes_ok(g):
    tm = Counter()
    for p in g['players']: tm[p['team']] += p['min']
    return all(tm.get(t, 0) >= 150 for t in (g['home'], g['away'])), tm


def write_engine_inputs(games_by_ls, work):
    gpath, ppath = os.path.join(work, 'games.csv'), os.path.join(work, 'player_games.csv')
    dropped = defaultdict(list)
    with open(gpath, 'w', newline='', encoding='utf-8') as gf, open(ppath, 'w', newline='', encoding='utf-8') as pf:
        gw, pw = csv.writer(gf), csv.writer(pf)
        gw.writerow(['league', 'season', 'game_id', 'team', 'opp', 'team_pts', 'opp_pts', 'team_poss'])
        pw.writerow(['league', 'season', 'game_id', 'team', 'player_id', 'name'] + NUM)
        for (league, season), games in sorted(games_by_ls.items()):
            for g in games:
                ok, tm = team_minutes_ok(g)
                if not ok:
                    dropped[(league, season)].append((g['game_id'], dict(tm))); continue
                gw.writerow([league, season, g['game_id'], g['home'], g['away'], g['home_pts'], g['away_pts'], ''])
                gw.writerow([league, season, g['game_id'], g['away'], g['home'], g['away_pts'], g['home_pts'], ''])
                for p in g['players']:
                    if p['min'] <= 0: continue
                    pw.writerow([league, season, g['game_id'], p['team'], f"{g['src']}:{p['player_id']}", p['name']] +
                                [round(p[k], 4) if k == 'min' else p.get(k, 0) for k in NUM])
    return gpath, ppath, dropped


# ---------------------------------------------------------------- identity matching
SUFFIX = {'jr', 'sr', 'ii', 'iii', 'iv', 'v'}


def norm(name):
    s = unicodedata.normalize('NFKD', name or '')
    s = ''.join(c for c in s if not unicodedata.combining(c)).lower()
    if ',' in s:  # "DIALLO, ALPHA" -> "alpha diallo"
        a, b = s.split(',', 1); s = b + ' ' + a
    s = re.sub(r"[^a-z ]+", ' ', s.replace("'", '').replace('-', ' '))
    toks = [t for t in s.split() if t not in SUFFIX]
    return ' '.join(toks)


def keyset(name):
    return ' '.join(sorted(norm(name).split()))


def match_rows(ours, orig):
    """ours/orig: lists of dicts with name, mp, gp. Returns {our_index: orig_index}."""
    res, used = {}, set()
    by_key = defaultdict(list)
    for j, o in enumerate(orig): by_key[keyset(o['name'])].append(j)
    pend = []
    for i, r in enumerate(ours):
        c = [j for j in by_key.get(keyset(r['name']), []) if j not in used]
        if len(c) == 1: res[i] = c[0]; used.add(c[0])
        elif len(c) > 1:
            j = min(c, key=lambda j: abs(orig[j]['mp'] - r['mp'])); res[i] = j; used.add(j)
        else: pend.append(i)
    # fuzzy pass: name similarity + minutes closeness
    cands = []
    for i in pend:
        a = norm(ours[i]['name'])
        for j, o in enumerate(orig):
            if j in used: continue
            b = norm(o['name'])
            ta, tb = a.split(), b.split()
            if not ta or not tb: continue
            sim = difflib.SequenceMatcher(None, a, b).ratio()
            last_ok = ta[-1] == tb[-1] or ta[0] == tb[0] or difflib.SequenceMatcher(None, ta[-1], tb[-1]).ratio() > 0.8
            mp_ok = abs(o['mp'] - ours[i]['mp']) <= max(40, 0.15 * max(o['mp'], ours[i]['mp']))
            if (sim >= 0.80 and last_ok) or (sim >= 0.6 and last_ok and mp_ok) or (mp_ok and (ta[-1] == tb[-1]) and ta[0][0] == tb[0][0]):
                cands.append((-(sim + (0.3 if mp_ok else 0)), i, j))
    for _, i, j in sorted(cands):
        if i in res or j in used: continue
        res[i] = j; used.add(j)
    return res


def league_slug(rec):
    return rec.split(':', 1)[0]


def main(raw, origdir, site, work):
    os.makedirs(work, exist_ok=True)
    games_by_ls, log = load_games(raw)
    gpath, ppath, dropped = write_engine_inputs(games_by_ls, work)
    outp = os.path.join(work, 'players_out.csv')
    bpm_gamelevel.main(gpath, ppath, outp)

    # team game counts (validation)
    tgc = defaultdict(Counter)
    for r in csv.DictReader(open(gpath, encoding='utf-8')): tgc[(r['league'], r['season'])][r['team']] += 1
    team_names = {}
    for (lg, ss), games in games_by_ls.items():
        for g in games:
            team_names[(lg, ss, g['home'])] = g['home_name']; team_names[(lg, ss, g['away'])] = g['away_name']

    od = json.load(open(os.path.join(origdir, 'f_data.json'), encoding='utf-8'))
    L = {v[0] for v in SOURCES.values()}
    orig_rows = [r for r in od['rows'] if r['league'] in L and r['season'] in SEASONS]
    orig_by_ls = defaultdict(list)
    for r in orig_rows: orig_by_ls[(r['league'], r['season'])].append(r)
    slug = {r['league']: league_slug(r['record_id']) for r in orig_rows}

    new = list(csv.DictReader(open(outp, encoding='utf-8')))
    for r in new:
        for k in ('gp',): r[k] = int(r[k])
        for k in ('mp', 'raw', 'adj_season', 'adj_game', 'bpm_season', 'bpm_game', 'team_games'): r[k] = float(r[k])
    new_by_ls = defaultdict(list)
    for r in new: new_by_ls[(r['league'], r['season'])].append(r)

    # match per league-season, then propagate source-id -> original id across seasons of the same league
    link = {}  # (league, season, player_id) -> orig row
    src2orig = defaultdict(Counter)
    for ls, rows in new_by_ls.items():
        orig = orig_by_ls.get(ls, [])
        m = match_rows([dict(name=r['name'], mp=r['mp'], gp=r['gp']) for r in rows], orig)
        for i, j in m.items():
            link[(ls[0], ls[1], rows[i]['player_id'])] = orig[j]
            src2orig[rows[i]['player_id']][orig[j]['player_key']] += 1  # source ids are global across a source's leagues
    orig_by_key = {}
    for r in od['rows']:
        if r['league'] in L: orig_by_key.setdefault(r['player_key'], r)
    # rows reached only through the source-id map must not inherit another season's stats, only identity fields


    # team-name map: our team id -> original team string (majority of matched single-stint players)
    votes = defaultdict(Counter)
    for r in new:
        o = link.get((r['league'], r['season'], r['player_id']))
        if o and ' / ' not in r['teams'] and int(o.get('stints', 1)) == 1:
            votes[(r['league'], r['season'], r['teams'])][o['teams']] += r['mp']
    def tname(lg, ss, tid):
        v = votes.get((lg, ss, tid))
        return v.most_common(1)[0][0] if v else team_names.get((lg, ss, tid), tid)

    out_rows, unmatched = [], Counter()
    for r in new:
        lg, ss, pid = r['league'], r['season'], r['player_id']
        src, sid = pid.split(':', 1)
        o = link.get((lg, ss, pid))
        if o is None:
            pk = src2orig.get(pid)
            if pk:
                b = orig_by_key.get(pk.most_common(1)[0][0], {})
                o = {k: b[k] for k in ('name', 'id', 'url', 'proballers_id', 'player_key', 'canonical_player_key', 'verified_player_keys') if k in b}
        tids = r['teams'].split(' / ')
        row = dict(league=lg, name=r['name'], season=ss,
                   teams=' / '.join(tname(lg, ss, t) for t in tids), gp=r['gp'], mp=int(round(r['mp'])),
                   stints=len(tids), raw=r['raw'], adj=r['adj_game'], bpm=r['bpm_game'])
        if o:
            row['name'] = o['name']
            row.update(id=o['id'], url=o.get('url', ''), proballers_id=o['proballers_id'], player_key=o['player_key'])
            for k in ('canonical_player_key', 'verified_player_keys'):
                if o.get(k): row[k] = o[k]
        else:
            unmatched[(lg, ss)] += 1
            sport = 'nba' if lg == 'NBA' else 'nba-g-league'
            url = SOURCE_URL.get(src, '').format(sport=sport, pid=sid) if src in SOURCE_URL and sid != r['name'] else ''
            row.update(id=pid, url=url, proballers_id=pid, player_key=pid)
        row['record_id'] = f"{slug.get(lg, re.sub('[^a-z0-9]+', '-', lg.lower()))}:{ss}:{row['player_key']}"
        row['is_unrated'] = False
        row['source_gameids'] = 'regular-season box scores'
        row['bpm_season_level'] = r['bpm_season']  # 2.7 constant adjustment on the same regular-season inputs
        row['adj_season_level'] = r['adj_season']
        row['team_games'] = int(r['team_games'])
        row['gp_share'] = round(r['gp'] / r['team_games'], 3) if r['team_games'] else None
        if lg == 'NBA G League': row['source_quality'] = GL_NOTE
        out_rows.append(row)

    # duplicates (two source players linked to the same original id in one league-season): keep both, but disambiguate id
    seen = Counter((r['league'], r['season'], r['id']) for r in out_rows)
    for r in out_rows:
        if seen[(r['league'], r['season'], r['id'])] > 1:
            r['identity_note'] = 'two source players matched one original id; check identity'

    out_rows.sort(key=lambda r: (list(L).index(r['league']) if False else 0, r['league'] != 'NBA', r['league'], [-ord(c) for c in r['season']], -r['mp']))
    write_site(site, out_rows, od, origdir, slug)

    report = dict(filter_log=log, dropped_incomplete_boxes={f'{k[0]} {k[1]}': v for k, v in dropped.items()},
                  team_game_counts={f'{k[0]} {k[1]}': {team_names.get((k[0], k[1], t), t): n for t, n in v.items()} for k, v in tgc.items()},
                  unmatched={f'{k[0]} {k[1]}': v for k, v in unmatched.items()},
                  matched=len(out_rows) - sum(unmatched.values()), rows=len(out_rows))
    json.dump(report, open(os.path.join(work, 'build_report.json'), 'w'), indent=1)
    json.dump(out_rows, open(os.path.join(work, 'rows.json'), 'w'))
    print('rows', len(out_rows), 'unmatched', sum(unmatched.values()))


CSV_COLS = ['league', 'proballers_id', 'player_key', 'record_id', 'name', 'season', 'teams', 'gp', 'mp', 'stints', 'raw',
            'adj', 'bpm', 'url', 'source_quality', 'is_unrated', 'is_placeholder', 'canonical_player_key',
            'original_site_bpm', 'bpm_season_level', 'team_games', 'gp_share']


def write_site(site, rows, od, origdir, slug):
    gen = datetime.datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%S.000Z')
    orig_bpm = {(r['league'], r['season'], r['id']): r for r in od['rows']}
    site_rows = []
    for r in rows:
        o = orig_bpm.get((r['league'], r['season'], r['id']))
        r['original_site_bpm'] = o['bpm'] if o else None
        sr = {k: r[k] for k in ('league', 'id', 'name', 'season', 'teams', 'gp', 'mp', 'stints', 'raw', 'adj', 'bpm', 'url',
                                 'is_unrated', 'proballers_id', 'player_key', 'record_id')}
        for k in ('canonical_player_key', 'verified_player_keys', 'source_quality'):
            if r.get(k): sr[k] = r[k]
        site_rows.append(sr)
    leagues = []
    for r in site_rows:
        if r['league'] not in leagues: leagues.append(r['league'])
    seasons = sorted({r['season'] for r in site_rows}, reverse=True)
    teams = sorted({t for r in site_rows for t in r['teams'].split(' / ')})
    data = dict(dataset='Basketball Custom BPM 2.0-style (game-level team adjustment, regular season only)', version=5,
                generated=gen, nbl1Coverage={}, leagues=leagues, seasons=seasons, teams=teams, rows=site_rows)
    with open(os.path.join(site, 'data.json'), 'w', encoding='utf-8') as f: json.dump(data, f, ensure_ascii=False, separators=(',', ':'))
    os.makedirs(os.path.join(site, 'api'), exist_ok=True)
    with open(os.path.join(site, 'api', 'players.csv'), 'w', newline='', encoding='utf-8') as f:
        w = csv.writer(f); w.writerow(CSV_COLS)
        for r in rows:
            v = []
            for k in CSV_COLS:
                x = r.get(k)
                if k == 'is_placeholder': x = 'false'
                elif isinstance(x, bool): x = 'true' if x else 'false'
                elif x is None: x = ''
                v.append(x)
            w.writerow(v)
    api_rows = [{**{k: r.get(k) for k in CSV_COLS if k not in ('is_placeholder',)}, 'is_placeholder': False} for r in rows]
    with open(os.path.join(site, 'api', 'players.json'), 'w', encoding='utf-8') as f:
        json.dump(dict(dataset=data['dataset'], generated_at=gen, count=len(api_rows), rows=api_rows), f, ensure_ascii=False)
    with open(os.path.join(site, 'api', 'players.ndjson'), 'w', encoding='utf-8') as f:
        for r in api_rows: f.write(json.dumps(r, ensure_ascii=False) + '\n')
    for lg in leagues:
        p = os.path.join(site, 'api', API_SLUG[lg]); os.makedirs(p, exist_ok=True)
        lr = [r for r in api_rows if r['league'] == lg]
        json.dump(dict(league=lg, generated_at=gen, count=len(lr), rows=lr), open(os.path.join(p, 'players.json'), 'w', encoding='utf-8'), ensure_ascii=False)
    # comparison modes: "Previous BPM" slot = original site's season-level BPM; schedule slot = original's schedule-scaled
    keys = {(r['league'], r['season'], r['id']) for r in site_rows}
    leg = [dict(league=r['league'], season=r['season'], id=r['id'], raw=r['raw'], adj=r['adj'], bpm=r['bpm'])
           for r in od['rows'] if (r['league'], r['season'], r['id']) in keys]
    json.dump(dict(source='https://basketball-bpm-rebuilt.vercel.app/data.json (original site, season-level team adjustment, all games in its source totals)',
                   rows=leg), open(os.path.join(site, 'legacy-bpm.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
    sc = json.load(open(os.path.join(origdir, 'schedule-scaled-bpm.json'), encoding='utf-8'))
    sc['rows'] = [r for r in sc['rows'] if (r['league'], r['season'], r['id']) in keys]
    sc['source'] = 'https://basketball-bpm-rebuilt.vercel.app/schedule-scaled-bpm.json (original site, filtered to rows on this site)'
    json.dump(sc, open(os.path.join(site, 'schedule-scaled-bpm.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))


API_SLUG = {'NBA': 'nba', 'NBA G League': 'gleague', 'EuroLeague': 'euroleague', 'Spain ACB': 'acb', 'Turkey BSL': 'bsl',
            'France LNB': 'lnb', 'Italy LBA': 'italy', 'Israel Winner League': 'israel', 'Germany BBL': 'germany',
            'Puerto Rico BSN': 'bsn', 'Canadian Elite Basketball League': 'cebl'}

if __name__ == '__main__':
    main(*sys.argv[1:5])
