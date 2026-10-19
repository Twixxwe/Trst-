// Browser snippets that worked on 2026-10-18. Paste into the DevTools console of a tab opened ON THE SAME SITE
// (CORS: stats.nba.com from an nba.com tab; EuroLeague API from euroleaguebasketball.net; BBRef from basketball-reference.com).
// They download CSVs via a Blob link. REGULAR SEASON ONLY (+ G League Showcase).

function saveCSV(name, rows){ const csv=rows.map(r=>r.map(v=>{v=v==null?'':String(v);return /[",\n]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v}).join(',')).join('\n');
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));a.download=name;a.click(); }
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const toMin=s=>{if(s==null||s==='')return 0;if(typeof s==='number')return s;const [a,b]=String(s).split(':');return (+a||0)+(+b||0)/60;};

// ---------------------------------------------------------------- NBA + G LEAGUE (open https://www.nba.com/stats first)
// LeagueID 00 = NBA, 20 = G League. SeasonType 'Regular Season' (+ 'Showcase' for G League 2021-22+).
async function nbaSeason(leagueId, season /* '2023-24' */, leagueName){
  const types = leagueId==='20' ? ['Regular%20Season','Showcase'] : ['Regular%20Season'];
  const games=[['league','season','game_id','team','opp','team_pts','opp_pts']], pg=[['league','season','game_id','team','player_id','name','min','fgm','fga','fg3m','fg3a','ftm','fta','orb','drb','ast','stl','blk','tov','pf','pts']];
  const ss=season.slice(2,4)+'-'+season.slice(5);
  for(const st of types){
    const u=pt=>`https://stats.nba.com/stats/leaguegamelog?Counter=0&DateFrom=&DateTo=&Direction=ASC&LeagueID=${leagueId}&PlayerOrTeam=${pt}&Season=${season}&SeasonType=${st}&Sorter=DATE`;
    const T=(await fetch(u('T')).then(r=>r.json())).resultSets[0]; await sleep(1500);
    const P=(await fetch(u('P')).then(r=>r.json())).resultSets[0]; await sleep(1500);
    const ti=k=>T.headers.indexOf(k), pi=k=>P.headers.indexOf(k);
    const byG={}; for(const r of T.rowSet){(byG[r[ti('GAME_ID')]]=byG[r[ti('GAME_ID')]]||[]).push(r);}
    for(const [g,rs] of Object.entries(byG)){ if(rs.length!==2) continue;
      for(const [a,b] of [[rs[0],rs[1]],[rs[1],rs[0]]]) games.push([leagueName,ss,g,a[ti('TEAM_ABBREVIATION')],b[ti('TEAM_ABBREVIATION')],a[ti('PTS')],b[ti('PTS')]]); }
    for(const r of P.rowSet){ if(!(r[pi('MIN')]>0)) continue;
      pg.push([leagueName,ss,r[pi('GAME_ID')],r[pi('TEAM_ABBREVIATION')],r[pi('PLAYER_ID')],r[pi('PLAYER_NAME')],r[pi('MIN')],r[pi('FGM')],r[pi('FGA')],r[pi('FG3M')],r[pi('FG3A')],r[pi('FTM')],r[pi('FTA')],r[pi('OREB')],r[pi('DREB')],r[pi('AST')],r[pi('STL')],r[pi('BLK')],r[pi('TOV')],r[pi('PF')],r[pi('PTS')]]); }
  }
  saveCSV(`games_${leagueName}_${ss}.csv`,games); saveCSV(`player_games_${leagueName}_${ss}.csv`,pg);
}
// e.g. for(const s of ['2020-21','2021-22','2022-23','2023-24','2024-25','2025-26']){ await nbaSeason('00',s,'NBA'); await nbaSeason('20',s,'NBA G League'); }
// NOTE: MIN in leaguegamelog may be rounded to whole minutes; boxscoretraditionalv3 per game has exact seconds if needed.

// ---------------------------------------------------------------- EUROLEAGUE (open https://www.euroleaguebasketball.net first)
// seasonCode E2020..E2025 = 2020-21..2025-26. Regular season = phaseType.code 'RS'.
async function euroleagueSeason(year){
  const sc='E'+year, ss=String(year%100).padStart(2,'0')+'-'+String((year+1)%100).padStart(2,'0');
  let list=null; for(let t=0;t<8&&!list;t++){ try{ list=(await fetch(`https://api-live.euroleague.net/v2/competitions/E/seasons/${sc}/games`).then(r=>r.json())).data; }catch(e){ await sleep(15000);} }
  const rs=list.filter(d=>d.played&&d.phaseType&&d.phaseType.code==='RS');
  const games=[['league','season','game_id','team','opp','team_pts','opp_pts']], pg=[['league','season','game_id','team','player_id','name','min','fgm','fga','fg3m','fg3a','ftm','fta','orb','drb','ast','stl','blk','tov','pf','pts']];
  for(const d of rs){ let b=null; for(let t=0;t<4&&!b;t++){ try{ const r=await fetch(`https://api-live.euroleague.net/v3/competitions/E/seasons/${sc}/games/${d.gameCode}/stats`); if(r.status===200) b=await r.json(); else await sleep(3000);}catch(e){await sleep(3000);} }
    if(!b) { console.warn('missing',d.gameCode); continue; }
    const H=d.local.club.code, A=d.road.club.code;
    games.push(['EuroLeague',ss,d.gameCode,H,A,d.local.score,d.road.score]); games.push(['EuroLeague',ss,d.gameCode,A,H,d.road.score,d.local.score]);
    for(const [side,code] of [['local',H],['road',A]]) for(const p of b[side].players){ const s=p.stats||{}; const m=(s.timePlayed||0)/60; if(!(m>0)) continue;
      pg.push(['EuroLeague',ss,d.gameCode,code,p.player.person.code,p.player.person.name,m.toFixed(2),s.fieldGoalsMadeTotal,s.fieldGoalsAttemptedTotal,s.fieldGoalsMade3,s.fieldGoalsAttempted3,s.freeThrowsMade,s.freeThrowsAttempted,s.offensiveRebounds,s.defensiveRebounds,s.assistances,s.steals,s.blocksFavour,s.turnovers,s.foulsCommited,s.points]); }
    await sleep(200); }
  saveCSV(`games_EuroLeague_${ss}.csv`,games); saveCSV(`player_games_EuroLeague_${ss}.csv`,pg);
}
// e.g. for(let y=2020;y<=2025;y++) await euroleagueSeason(y);

// ---------------------------------------------------------------- DOMESTIC EUROPE via Basketball-Reference (open https://www.basketball-reference.com first)
// Schedule page: /international/schedules/{team-slug}/{year}.html  (year = season END year, e.g. 2026 = 2025-26)
// Regular-season table id ends with '{CC}-regular-season' (ISR, SPA, ITA, FRA, GER, TUR ...). ~20 req/min max -> sleep 3600ms.
// Team slugs: read opponent links from any team's schedule page. Box table ids: box-score-home / box-score-visitor.
async function bbrTeamSeason(slug, year, leagueName){
  const parse=h=>new DOMParser().parseFromString(h.replace(/<!--|-->/g,''),'text/html');
  const d=parse(await fetch(`/international/schedules/${slug}/${year}.html`).then(r=>r.text()));
  const t=[...d.querySelectorAll('table')].find(x=>/-regular-season$/.test(x.id)); if(!t) return null;
  const out=[];
  for(const tr of t.querySelectorAll('tbody tr')){ const c=[...tr.children].map(x=>x.textContent.trim()); const box=[...tr.querySelectorAll('a')].map(a=>a.getAttribute('href')).find(h=>h&&h.includes('/boxscores/')); if(!box||!c[6]) continue;
    await sleep(3600); const b=parse(await fetch(box).then(r=>r.text())); const away=c[2]==='@';
    const tb=b.getElementById(away?'box-score-visitor':'box-score-home'); if(!tb) continue;
    const head=[...tb.querySelectorAll('thead tr:last-child th')].map(x=>x.textContent.trim());
    const players=[...tb.querySelectorAll('tbody tr')].map(tr=>Object.fromEntries([...tr.children].map((x,i)=>[head[i],x.textContent.trim()]))).filter(p=>p.Player&&p.MP);
    out.push({date:c[1],away,opp:c[3],pf:+c[6],pa:+c[7],box,players}); }
  return out; // convert to games.csv / player_games.csv rows (team = slug, opp = opponent name -> map to slug)
}
