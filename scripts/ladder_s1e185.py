#!/usr/bin/env python3
"""
S1E 185 league ladder from a players CSV (same columns as https://basketball-bpm-rebuilt.vercel.app/api/players.csv,
or the new site's players_out.csv with --bpm-col bpm_game).

Method (km's S1E 185):
  - player identity = canonical_player_key (or player_id); per (player, season, league) keep the highest-minute row
  - bridge A-B = players with >= 185 MP in BOTH leagues in the SAME season; gap = mean(BPM_B - BPM_A)
  - weight: s2 = ((n-1)*sd^2 + K*POOLED^2)/(n-1+K) with K=10, POOLED=3.221;  w = 1/( t_{0.975,n-1+K}^2 * s2 / n )
  - weighted least squares, NBA fixed at 0, slope 1
Check: on the original players.csv with the 11 leagues this reproduces EuroLeague -0.988, ACB -2.723, G League -4.130 ...

Usage:
  python3 ladder_s1e185.py players.csv [--bpm-col bpm] [--min-mp 185] [--seasons 20-21,21-22,...]
"""
import csv, sys, math, argparse
from collections import defaultdict

L11 = ['NBA','EuroLeague','Spain ACB','NBA G League','Turkey BSL','Italy LBA','France LNB',
       'Israel Winner League','Germany BBL','Puerto Rico BSN','Canadian Elite Basketball League']

def t975(df):
    # Cornish-Fisher style expansion of the t quantile (accurate to ~1e-4 for df>=10)
    z=1.959964
    return z+(z**3+z)/4/df+(5*z**5+16*z**3+3*z)/96/df**2+(3*z**7+19*z**5+17*z**3-15*z)/384/df**3

def solve(A,b):
    n=len(b); M=[row[:]+[b[i]] for i,row in enumerate(A)]
    for k in range(n):
        p=max(range(k,n),key=lambda i:abs(M[i][k])); M[k],M[p]=M[p],M[k]
        pv=M[k][k]
        for j in range(k,n+1): M[k][j]/=pv
        for i in range(n):
            if i!=k:
                f=M[i][k]
                for j in range(k,n+1): M[i][j]-=f*M[k][j]
    return [M[i][n] for i in range(n)]

def main():
    ap=argparse.ArgumentParser(); ap.add_argument('csv'); ap.add_argument('--bpm-col',default='bpm')
    ap.add_argument('--min-mp',type=float,default=185); ap.add_argument('--seasons',default='')
    ap.add_argument('--leagues',default=','.join(L11)); a=ap.parse_args()
    leagues=a.leagues.split(','); seasons=set(s for s in a.seasons.split(',') if s)
    best={}
    for r in csv.DictReader(open(a.csv,encoding='utf-8')):
        if r.get('is_unrated')=='true' or r.get('is_placeholder')=='true': continue
        if r['league'] not in leagues: continue
        if seasons and r['season'] not in seasons: continue
        try: mp=float(r['mp']); b=float(r[a.bpm_col])
        except: continue
        key=(r.get('canonical_player_key') or r.get('player_key') or r.get('player_id'), r['season'], r['league'])
        if key not in best or mp>best[key][0]: best[key]=(mp,b)
    by=defaultdict(dict)
    for (p,s,l),(mp,b) in best.items():
        if mp>=a.min_mp: by[(p,s)][l]=b
    diffs=defaultdict(list)
    for o in by.values():
        ls=[l for l in leagues if l in o]
        for i in range(len(ls)):
            for j in range(i+1,len(ls)): diffs[(ls[i],ls[j])].append(o[ls[j]]-o[ls[i]])
    PS,K=3.221,10; edges=[]
    for (x,y),d in diffs.items():
        n=len(d); m=sum(d)/n
        s2=sum((v-m)**2 for v in d)/(n-1) if n>1 else PS*PS
        st2=((n-1)*s2+K*PS*PS)/(n-1+K) if n>1 else PS*PS
        edges.append((x,y,n,m,1/((t975(n-1+K)**2)*st2/n)))
    seen={'NBA'}; ch=True
    while ch:
        ch=False
        for x,y,*_ in edges:
            if x in seen and y not in seen: seen.add(y); ch=True
            if y in seen and x not in seen: seen.add(x); ch=True
    names=[l for l in leagues if l!='NBA' and l in seen]; ix={n:i for i,n in enumerate(names)}
    A=[[0.0]*len(names) for _ in names]; b=[0.0]*len(names)
    for x,y,n,m,w in edges:
        if x not in seen or y not in seen: continue
        i=ix.get(x,-1); j=ix.get(y,-1)
        if i>=0: A[i][i]+=w; b[i]+=w*m
        if j>=0: A[j][j]+=w; b[j]-=w*m
        if i>=0 and j>=0: A[i][j]-=w; A[j][i]-=w
    off=solve(A,b) if names else []
    print('league,offset'); print('NBA,0.000')
    for nme,v in zip(names,off): print(f'{nme},{v:.3f}')
    miss=[l for l in leagues if l not in seen]
    if miss: print('# not connected:',', '.join(miss))
    print('# bridges: '+'; '.join(f'{x}-{y} n={n} gap={m:.2f} w={w:.3f}' for x,y,n,m,w in sorted(edges,key=lambda e:-e[4])))

if __name__=='__main__': main()
