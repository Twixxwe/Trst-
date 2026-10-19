// Country-vs-country ladder test. Paste into DevTools on https://basketball-atlas-bpm-lab-v2.vercel.app/
// Loads the Atlas game data, then scores any ladders on IDENTICAL games (both teams >=75% of minutes rated by the 11 leagues).
// BPM per player = the Atlas game-detail row's last completed season before the game (bpm_final_bpm), + ladder offset.
// To test a NEW BPM (game-level site): replace p.bpm_final_bpm with a lookup of the new site's bpm_game for (player, league, season).

const V='?v=club-full-bpm2-euro2223-euro2324-20261015';
async function loadAtlas(){
  const j=u=>fetch(u+V).then(r=>r.json());
  const g1=await j('/data/games.json'), g2=await j('/data/extra_games.json'); window.ALLG=[...(g1.games||g1),...(g2.games||g2)];
  const ps=await j('/data/point_spreads.json'); window.PSX=ps.games||ps;
  window.DETX={};
  for(let i=0;i<64;i++){const s=String(i).padStart(2,'0');
    for(const base of ['/data/game_details/shard-','/data/extra_game_details/shard-']){try{const d=await j(base+s+'.json');Object.assign(DETX,d.games||d);}catch(e){}}}
  console.log('games',ALLG.length,'details',Object.keys(DETX).length);
}
function scoreLadders(LADS /* {name:{league:offset}} */){
  const GM={};for(const g of ALLG)GM[String(g.fiba_game_id)]=g;
  const mins=s=>{if(s==null)return 0;if(typeof s==='number')return s;const [a,b]=String(s).split(':');return (+a||0)+(+b||0)/60;};
  const L=Object.keys(Object.values(LADS)[0]);const V2=Object.keys(LADS);const rows=[];
  for(const [k,d] of Object.entries(DETX)){const g=d.game||GM[k];if(!g||!g.country_a_id||!d.players)continue;
    const T={A:{tot:0,cov:0,nba:0,imp:{}},B:{tot:0,cov:0,nba:0,imp:{}}};for(const v of V2){T.A.imp[v]=0;T.B.imp[v]=0;}
    for(const p of d.players){const side=p.country_id===g.country_a_id?'A':p.country_id===g.country_b_id?'B':null;if(!side)continue;const m=mins(p.minutes);T[side].tot+=m;
      if(p.bpm_status==='matched'&&L.includes(p.bpm_league)&&isFinite(p.bpm_final_bpm)){T[side].cov+=m;if(p.bpm_league==='NBA')T[side].nba+=m;for(const v of V2)T[side].imp[v]+=(p.bpm_final_bpm+LADS[v][p.bpm_league])*m*0.02;}}
    if(!(T.A.tot>0&&T.B.tot>0)||T.A.cov/T.A.tot<0.75||T.B.cov/T.B.tot<0.75)continue;
    const hca=g.neutral_site?0:(g.host_country_code===g.country_a_id?3:g.host_country_code===g.country_b_id?-3:0);
    const unk=(g.host_country_code==null&&!g.neutral_site)?1:0;
    rows.push({unk,nbaDiff:T.A.nba-T.B.nba,actual:g.score_a-g.score_b,mkt:PSX[k]?PSX[k].predicted_margin_a:null,pred:Object.fromEntries(V2.map(v=>[v,T.A.imp[v]-T.B.imp[v]+hca]))});}
  // regression: error ~ 1 + unknownHost + nbaMinuteEdge/100 ; nbaUnderrated = coef/2 (BPM points)
  function reg(rs,yf){const X=rs.map(r=>[1,r.unk,r.nbaDiff/100]);const y=rs.map(yf);const k=3,A=Array.from({length:k},()=>Array(k).fill(0)),b=Array(k).fill(0);
    X.forEach((x,i)=>{for(let a=0;a<k;a++){b[a]+=x[a]*y[i];for(let c=0;c<k;c++)A[a][c]+=x[a]*x[c];}});
    const M=A.map((r,i)=>[...r,...[0,1,2].map(j=>+(i===j))]);for(let i=0;i<k;i++){const p=M[i][i];for(let j=0;j<2*k;j++)M[i][j]/=p;for(let r=0;r<k;r++)if(r!==i){const f=M[r][i];for(let j=0;j<2*k;j++)M[r][j]-=f*M[i][j];}}
    const inv=M.map(r=>r.slice(k));const be=inv.map(r=>r.reduce((s,v,j)=>s+v*b[j],0));
    return {nbaUnderrated:+(be[2]/2).toFixed(2),rmse:+Math.sqrt(y.reduce((s,e)=>s+e*e,0)/y.length).toFixed(3),mae:+(y.reduce((s,e)=>s+Math.abs(e),0)/y.length).toFixed(3),bias:+(y.reduce((s,e)=>s+e,0)/y.length).toFixed(3)};}
  const um=rows.filter(r=>r.mkt!=null), nbm=rows.filter(r=>Math.abs(r.nbaDiff)>=40&&r.mkt!=null);
  const st=(a,f)=>({n:a.length,rmse:+Math.sqrt(a.map(f).reduce((s,x)=>s+x*x,0)/a.length).toFixed(3)});
  const out={games:rows.length,marketGames:um.length,nbaHeavyMarketGames:nbm.length};
  for(const v of V2) out[v]={vsResult:reg(rows,r=>r.actual-r.pred[v]),vsMarket:reg(um,r=>r.mkt-r.pred[v]),nbaHeavyVsMarket:st(nbm,r=>r.mkt-r.pred[v])};
  console.table(Object.fromEntries(V2.map(v=>[v,{rmseRes:out[v].vsResult.rmse,rmseMkt:out[v].vsMarket.rmse,nbaHeavyMkt:out[v].nbaHeavyVsMarket.rmse,nbaUnderMkt:out[v].vsMarket.nbaUnderrated}])));
  return out;
}
// Example:
// await loadAtlas();
// scoreLadders({ current:{"NBA":0,"EuroLeague":-0.988,"Spain ACB":-2.723,"NBA G League":-4.130,"Turkey BSL":-4.074,"Italy LBA":-4.246,"France LNB":-4.526,"Israel Winner League":-5.003,"Germany BBL":-5.227,"Puerto Rico BSN":-5.673,"Canadian Elite Basketball League":-7.048},
//                gameLevel:{"NBA":0,"EuroLeague":-1.644,"Spain ACB":-3.366,"NBA G League":-4.800,"Turkey BSL":-4.750,"Italy LBA":-4.890,"France LNB":-5.168,"Israel Winner League":-5.644,"Germany BBL":-5.904,"Puerto Rico BSN":-6.324,"Canadian Elite Basketball League":-7.716} });
// Expected (2,740 games / 1,600 market): current rmseMkt 6.403, gameLevel 6.327; NBA underrated vs market +3.17 / +2.58.
