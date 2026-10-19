#!/usr/bin/env python3
"""
Reference implementation: Zerper BPM 2.0-style (exact site formula from
https://basketball-bpm-rebuilt.vercel.app/api/methodology.json) + NEW game-level team adjustment.

INPUT (CSV, regular-season games only; G League includes Showcase):
  games.csv        league,season,game_id,team,opp,team_pts,opp_pts[,team_poss]
                   one row PER TEAM PER GAME (so each game appears twice)
  player_games.csv league,season,game_id,team,player_id,name,min,fgm,fga,fg3m,fg3a,ftm,fta,orb,drb,ast,stl,blk,tov,pf,pts
                   one row per player per game (min in decimal minutes; only rows with min>0)
OUTPUT:
  players_out.csv  league,season,player_id,name,teams,gp,mp,raw,adj_season,adj_game,bpm_season,bpm_game,team_games,gp_share

Usage: python3 bpm_gamelevel.py games.csv player_games.csv players_out.csv

Notes
- Raw BPM, position/role, centering, team adjustment: exact formulas published by the original site.
- Team possessions: if team_poss missing, uses the Basketball-Reference estimate
  0.5*((FGA + 0.4*FTA - 1.07*(ORB/(ORB+oppDRB))*(FGA-FGM) + TOV) + (same for opponent)).
  (The original site says "estimated possessions"; check its exact estimator if you can and match it.)
- Game-level adjustment (Section 2.8 of the handoff): minute-weighted, opponent-adjusted.
- Multi-team players: computed per team stint, then minute-averaged (same as the original).
"""
import csv, sys, math, os, json
from collections import defaultdict

NUM = ['min','fgm','fga','fg3m','fg3a','ftm','fta','orb','drb','ast','stl','blk','tov','pf','pts']

def fnum(x):
    try: return float(x)
    except: return 0.0

def load(games_path, pg_path):
    games = [r for r in csv.DictReader(open(games_path, encoding='utf-8'))]
    pgs = [r for r in csv.DictReader(open(pg_path, encoding='utf-8'))]
    for r in games:
        r['team_pts']=fnum(r['team_pts']); r['opp_pts']=fnum(r['opp_pts'])
        r['team_poss']=fnum(r.get('team_poss') or 0)
    for r in pgs:
        for k in NUM: r[k]=fnum(r.get(k))
    return games, pgs

def center(vals, mins, iters=60):
    """shift by one constant, clip to [1,5], so minute-weighted mean == 3 (bisection on the shift)."""
    tot = sum(mins)
    if tot <= 0: return vals
    def mean(s): return sum(m*min(5,max(1,v+s)) for v,m in zip(vals,mins))/tot
    lo, hi = -10.0, 10.0
    for _ in range(iters):
        mid=(lo+hi)/2
        if mean(mid) < 3: lo=mid
        else: hi=mid
    s=(lo+hi)/2
    return [min(5,max(1,v+s)) for v in vals]

def main(gp, pp, outp):
    games, pgs = load(gp, pp)
    # ---------- team-game box totals (from player rows) ----------
    tg = defaultdict(lambda: defaultdict(float))   # (league,season,game,team) -> totals
    for r in pgs:
        k=(r['league'],r['season'],r['game_id'],r['team'])
        for s in NUM: tg[k][s]+=r[s]
    gmeta = {(r['league'],r['season'],r['game_id'],r['team']): r for r in games}
    # possessions per team-game
    def est_poss(t, o):
        def one(a,b):
            orb_pct = a['orb']/(a['orb']+b['drb']) if (a['orb']+b['drb'])>0 else 0
            return a['fga'] + 0.4*a['fta'] - 1.07*orb_pct*(a['fga']-a['fgm']) + a['tov']
        return 0.5*(one(t,o)+one(o,t))
    poss = {}
    for k,g in gmeta.items():
        if g['team_poss']>0: poss[k]=g['team_poss']; continue
        ok=(k[0],k[1],k[2],g['opp'])
        if k in tg and ok in tg: poss[k]=est_poss(tg[k],tg[ok])
    # ---------- team-season ----------
    ts = defaultdict(lambda: {'games':[], 'pts':0,'opp':0,'poss':0})
    for k,g in gmeta.items():
        L,S,G,T=k; d=ts[(L,S,T)]
        d['games'].append(G); d['pts']+=g['team_pts']; d['opp']+=g['opp_pts']; d['poss']+=poss.get(k,0)
    # per-game margin per 100 poss
    margin = {}
    for k,g in gmeta.items():
        p=poss.get(k)
        margin[k] = 100*(g['team_pts']-g['opp_pts'])/p if p else None
    team_avg = {}
    for (L,S,T),d in ts.items():
        m=[margin[(L,S,G,T)] for G in d['games'] if margin.get((L,S,G,T)) is not None]
        team_avg[(L,S,T)] = sum(m)/len(m) if m else 0
    game_rating = {}
    for k,g in gmeta.items():
        if margin.get(k) is None: continue
        game_rating[k] = margin[k] + team_avg.get((k[0],k[1],g['opp']),0)    # opponent-adjusted
    season_rating = {}
    for (L,S,T),d in ts.items():
        v=[game_rating[(L,S,G,T)] for G in d['games'] if (L,S,G,T) in game_rating]
        season_rating[(L,S,T)] = sum(v)/len(v) if v else 0
    team_net = {k: (100*(d['pts']-d['opp'])/d['poss'] if d['poss'] else 0) for k,d in ts.items()}
    # ---------- player-team-season totals ----------
    pt = defaultdict(lambda: defaultdict(float))
    names, pgames = {}, defaultdict(list)
    for r in pgs:
        k=(r['league'],r['season'],r['team'],r['player_id'])
        for s in NUM: pt[k][s]+=r[s]
        pt[k]['gp']+=1; names[r['player_id']]=r['name']
        pgames[k].append((r['game_id'], r['min']))
    team_tot = defaultdict(lambda: defaultdict(float))
    for (L,S,T,P),d in pt.items():
        for s in NUM: team_tot[(L,S,T)][s]+=d[s]
    # ---------- raw BPM per team-season (exact site formula) ----------
    rows=[]
    by_team=defaultdict(list)
    for k in pt: by_team[k[:3]].append(k)
    for tkey, plist in by_team.items():
        T=team_tot[tkey]; TMP=T['min']; tposs=ts[tkey]['poss']
        if TMP<=0 or tposs<=0: continue
        trb=lambda d:d['orb']+d['drb']
        ppsa = T['pts']/(T['fga']+0.44*T['fta']) if (T['fga']+0.44*T['fta'])>0 else 1.0
        thr = ppsa-0.33
        T_thr = T['pts']-thr*(T['fga']+0.44*T['fta'])
        def share(pv,tv,mp): return (pv/tv)*TMP/(5*mp) if tv and mp>0 else 0
        pos0, rol0, mins = [], [], []
        for k in plist:
            d=pt[k]; mp=d['min']
            if mp<=0: pos0.append(3); rol0.append(4); mins.append(0); continue
            preg = 2.130 + 8.668*share(trb(d),trb(T),mp) - 2.486*share(d['stl'],T['stl'],mp) + 0.992*share(d['pf'],T['pf'],mp) - 3.536*share(d['ast'],T['ast'],mp) + 1.667*share(d['blk'],T['blk'],mp)
            pthr = d['pts']-thr*(d['fga']+0.44*d['fta'])
            rreg = 6 - 6.642*share(d['ast'],T['ast'],mp) - 8.544*share(pthr,T_thr,mp)
            pos0.append((mp*preg+50*3)/(mp+50)); rol0.append((mp*rreg+50*4)/(mp+50)); mins.append(mp)
        pos=center(pos0,mins); rol=center(rol0,mins)
        raws=[]
        for i,k in enumerate(plist):
            d=pt[k]; mp=d['min']
            if mp<=0: raws.append(None); continue
            x=(pos[i]-1)/4; y=(rol[i]-1)/4
            pposs = tposs*5*mp/TMP
            adjpts = d['pts'] + (1.0-ppsa)*(d['fga']+0.44*d['fta'])
            core = (0.860*adjpts + 0.389*d['fg3m'] + (0.580+0.454*x)*d['ast'] - 0.964*d['tov']
                    + (0.613-0.432*x)*d['orb'] + (0.116+0.065*x)*d['drb'] + (1.369-0.361*x)*d['stl']
                    + (1.327-0.624*x)*d['blk'] - 0.367*d['pf'] - (0.560+0.220*y)*d['fga'] - (0.246+0.097*y)*d['fta'])
            raw = (100/pposs)*core - 0.409*max(0,3-pos[i]) + 1.387*(rol[i]-3)
            raws.append(raw)
        sh=[5*pt[k]['min']/TMP for k in plist]
        ssum=sum(s for s,r in zip(sh,raws) if r is not None)
        adj_season=(team_net[tkey]-sum(s*r for s,r in zip(sh,raws) if r is not None))/ssum if ssum else 0
        for i,k in enumerate(plist):
            if raws[i] is None: continue
            L,S,Tm,P=k
            g=pgames[k]; w=sum(m for _,m in g)
            ctx=sum(game_rating.get((L,S,G,Tm),season_rating[tkey])*m for G,m in g)/w if w else season_rating[tkey]
            adj_game = adj_season + (ctx-season_rating[tkey])/5
            rows.append(dict(league=L,season=S,team=Tm,player_id=P,name=names[P],gp=pt[k]['gp'],mp=pt[k]['min'],
                             raw=raws[i],adj_season=adj_season,adj_game=adj_game,team_games=len(ts[tkey]['games'])))
    # ---------- combine stints (minute-weighted) ----------
    if os.environ.get('BPM_STINTS_OUT'):  # optional per-stint dump for validation (no effect on results)
        json.dump(rows, open(os.environ['BPM_STINTS_OUT'], 'w'))
    comb=defaultdict(list)
    for r in rows: comb[(r['league'],r['season'],r['player_id'])].append(r)
    with open(outp,'w',newline='',encoding='utf-8') as f:
        wtr=csv.writer(f); wtr.writerow(['league','season','player_id','name','teams','gp','mp','raw','adj_season','adj_game','bpm_season','bpm_game','team_games','gp_share'])
        for (L,S,P),rs in comb.items():
            mp=sum(r['mp'] for r in rs);
            if mp<=0: continue
            wa=lambda key: sum(r[key]*r['mp'] for r in rs)/mp
            raw,a1,a2=wa('raw'),wa('adj_season'),wa('adj_game')
            gp=sum(r['gp'] for r in rs); tgms=max(r['team_games'] for r in rs)
            wtr.writerow([L,S,P,rs[0]['name'],' / '.join(r['team'] for r in rs),int(gp),round(mp,1),round(raw,4),round(a1,4),round(a2,4),round(raw+a1,4),round(raw+a2,4),tgms,round(gp/tgms,3) if tgms else ''])

if __name__=='__main__':
    if len(sys.argv)!=4: print(__doc__); sys.exit(1)
    main(*sys.argv[1:])
