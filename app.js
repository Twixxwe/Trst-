const PAGE_SIZE = 50;
const requestedLeague = new URLSearchParams(location.search).get("league");
const collegeLeagues = new Set(["SEC", "Big Ten", "Big East", "WCC", "Mountain West", "MAC", "MVC", "AAC", "America East", "Big Sky", "Big South", "Conference USA", "CAA", "Horizon League", "Ivy League", "MAAC", "Northeast Conference", "Ohio Valley Conference", "Patriot League", "Southern Conference", "Southland Conference", "Southwestern Athletic Conference", "Summit League", "Sun Belt", "Western Athletic Conference"]);
const leagueBpmOffsets = Object.freeze({
  "ABA League": -8.125480107955122,
  "Argentina Liga Nacional": -8.876182034669565,
  "Australia NBL": -7.788323277403078,
  "Austria Superliga": -9.161806362137115,
  "BNXT League": -9.54078402597212,
  "Basketball Africa League": -11.302391477286488,
  "Basketball Champions League": -5.229886061088722,
  "Belarus Premier League": -21.20811314433823,
  "Bosnia Division I": -12.266486167787146,
  "Brazil NBB": -9.925568847171286,
  "British BBL / Super League Basketball": -11.699308562101818,
  "Bulgaria NBL": -12.004823541409312,
  "Canadian Elite Basketball League": -9.025931703888244,
  "Chile LNB": -15.34446641757417,
  "China CBA": -10.716303321443611,
  "Croatia Liga": -12.265725859288752,
  "Cyprus Division A": -12.829350199318592,
  "Czech Republic Mattoni NBL": -11.074144777240017,
  "Denmark Basketligaen": -13.861919978668508,
  "Dominican Republic LNB": -10.58530329473666,
  "EuroCup": -6.307711882313473,
  "EuroLeague": -1.911538015736039,
  "Finland Korisliiga": -10.49469558606134,
  "France LNB": -7.148115096793429,
  "France NM1 (Division 3)": -10.935829364031274,
  "France Élite 2 (Pro B)": -6.719515974948249,
  "Georgia Superleague": -13.990235866963662,
  "Germany BBL": -4.399769711574609,
  "Germany ProA": -10.008280866113385,
  "Greece GBL": -7.0595521000079495,
  "Indonesia IBL": -16.799576238671282,
  "Israel Winner League": -8.393258494014557,
  "Italy LBA": -5.650273146372986,
  "Italy Serie A2": -9.49994540447022,
  "Japan B1": -7.804066907850649,
  "Kosovo Superliga": -12.84208473712981,
  "Latvian–Estonian Basketball League": -12.38764790886536,
  "Lithuania LKL": -9.755151107318412,
  "Luxembourg LBBL": -10.920066700993312,
  "Mexico CIBACOPA": -10.576768595565053,
  "Mexico LNBP": -8.26115794648451,
  NBA: 0,
  "NBA G League": -6.3023645548130025,
  "NCAA": -9.47899306813706,
  "New Zealand NBL": -10.30320173086071,
  "Norway BLNO": -19.079903617313,
  "Poland PLK": -5.843698688471054,
  "Portugal Liga Profissional": -10.999649892853984,
  "Puerto Rico BSN": -7.079156025983174,
  "Qatar QBL": -15.0309440433862,
  "Romania Division A": -11.406962374572895,
  "Serbia KLS": -12.123539146398825,
  "Slovakia Extraliga": -12.656586955982212,
  "Slovenia Liga OTP Banka": -11.573226478327529,
  "Spain ACB": -3.6752743073667817,
  "Spain Primera FEB": -7.5341843982257615,
  "Sweden Basketligan": -8.450713686884146,
  "Switzerland SBL": -10.176795295640469,
  "Turkey BSL": -4.292577376523307,
  "Uruguay Liga": -10.271739371280594,
  "VTB United League": -8.285641586202624,
  "Venezuela SPB": -10.754162336030472
});
const test2LeagueBpmOffsets = Object.freeze({
  NBA: 0,
  EuroLeague: -1.984,
  "Spain ACB": -3.877,
  "Turkey BSL": -4.019,
  "Germany BBL": -4.519,
  "Basketball Champions League": -4.905,
  "Italy LBA": -5.440,
  "Poland PLK": -5.701,
  EuroCup: -6.088,
  "NBA G League": -6.136,
  "Greece GBL": -6.387,
  "France Élite 2 (Pro B)": -6.828,
  "France LNB": -6.994,
  "Puerto Rico BSN": -7.145,
  "Australia NBL": -7.600,
  "VTB United League": -7.735,
  "ABA League": -7.821,
  "Spain Primera FEB": -7.924,
  "Mexico LNBP": -7.949,
  "Japan B1": -8.045,
  "Israel Winner League": -8.081,
  "Canadian Elite Basketball League": -8.621,
  "Argentina Liga Nacional": -8.775,
  "Lithuania LKL": -9.107,
  "Sweden Basketligan": -9.143,
  "Italy Serie A2": -9.241,
  "BNXT League": -9.434,
  NCAA: -9.603,
  "Germany ProA": -9.665,
  "Austria Superliga": -9.675,
  "Switzerland SBL": -9.686,
  "Finland Korisliiga": -9.883,
  "Mexico CIBACOPA": -9.997,
  "Brazil NBB": -10.076,
  "Uruguay Liga": -10.363,
  "New Zealand NBL": -10.364,
  "Czech Republic Mattoni NBL": -10.417,
  "Dominican Republic LNB": -10.440,
  "Luxembourg LBBL": -10.529,
  "Basketball Africa League": -10.638,
  "Portugal Liga Profissional": -10.719,
  "Romania Division A": -10.828,
  "China CBA": -10.895,
  "France NM1 (Division 3)": -10.959,
  "Venezuela SPB": -10.989,
  "Serbia KLS": -11.554,
  "British BBL / Super League Basketball": -11.941,
  "Bosnia Division I": -12.110,
  "Bulgaria NBL": -12.171,
  "Slovenia Liga OTP Banka": -12.256,
  "Cyprus Division A": -12.349,
  "Croatia Liga": -12.438,
  "Slovakia Extraliga": -12.468,
  "Kosovo Superliga": -12.490,
  "Latvian–Estonian Basketball League": -12.679,
  "Georgia Superleague": -13.340,
  "Denmark Basketligaen": -13.874,
  "Qatar QBL": -14.857,
  "Chile LNB": -15.101,
  "Indonesia IBL": -16.717,
  "Norway BLNO": -18.918,
  "Belarus Premier League": -19.926
});
const leagues = ["all", "NBA", "NBA G League", "College", "EuroLeague", "EuroCup", "Basketball Champions League", "Australia NBL", "China CBA", "Spain ACB", "Spain Primera FEB", "Turkey BSL", "France LNB", "France Élite 2 (Pro B)", "France NM1 (Division 3)", "Italy LBA", "Italy Serie A2", "Israel Winner League", "Greece GBL", "ABA League", "VTB United League", "British BBL / Super League Basketball", "Finland Korisliiga", "Indonesia IBL", "Venezuela SPB", "Portugal Liga Profissional", "Luxembourg LBBL", "Serbia KLS", "Latvian–Estonian Basketball League", "Kosovo Superliga", "Cyprus Division A", "Slovakia Extraliga", "Georgia Superleague", "Sweden Basketligan", "Austria Superliga", "Croatia Liga", "Bulgaria NBL", "Belarus Premier League", "Uruguay Liga", "Denmark Basketligaen", "Switzerland SBL", "Slovenia Liga OTP Banka", "Qatar QBL", "Bosnia Division I", "Czech Republic Mattoni NBL", "Romania Division A", "BNXT League", "Germany BBL", "Germany ProA", "Puerto Rico BSN", "Canadian Elite Basketball League", "Dominican Republic LNB", "Argentina Liga Nacional", "Brazil NBB", "New Zealand NBL", "Japan B1", "Mexico LNBP", "Mexico CIBACOPA", "Basketball Africa League", "Poland PLK", "Lithuania LKL"];
leagues.splice(6, 0, "Chile LNB");
leagues.splice(7, 0, "Norway BLNO", "NBL1 Central", "NBL1 East", "NBL1 North", "NBL1 South", "NBL1 West");
leagues.splice(leagues.indexOf("China CBA") + 1, 0, "China NBL");
leagues.splice(leagues.indexOf("China NBL") + 1, 0, "South Korea KBL");
leagues.splice(leagues.indexOf("South Korea KBL") + 1, 0, "Philippines PBA");
leagues.splice(leagues.indexOf("Greece GBL") + 1, 0, "Greece A2 / Elite League");
const initialLeague = collegeLeagues.has(requestedLeague) ? "College" : (leagues.includes(requestedLeague) ? requestedLeague : "all");
const defaultMinimum = () => 0;
const state = { rows: [], filtered: [], query: "", league: initialLeague, season: "all", team: "all", minMinutes: defaultMinimum(initialLeague), sort: "bpm", direction: "desc", page: 1, bpmMode: "new" };
const auxiliaryLoaded = { legacy: true, schedule: true, nbl1Identity: true, chinaIdentity: true, kblIdentity: true, pbaIdentity: true };
const scheduleScaledBpm = new Map();
const newBpm = new Map();
const legacyBpm = new Map();
const nbl1OtherLeagueCandidates = new Map();
const verifiedNbl1Matches = new Map();
const verifiedOtherMatches = new Map();
const verifiedChinaNblMatches = new Map();
const verifiedChinaOtherMatches = new Map();
const verifiedKblMatches = new Map();
const verifiedKblOtherMatches = new Map();
const rejectedKblMatches = new Map();
const unresolvedKblMatches = new Map();
const kblPlayerReviews = new Map();
const verifiedPbaMatches = new Map();
const verifiedPbaOtherMatches = new Map();
const pbaPlayerReviews = new Map();
const rejectedPbaMatches = new Map();
const unresolvedPbaMatches = new Map();
const rejectedNbl1Matches = new Map();
const blockedNbl1Matches = new Map();
const builderState = { targetMinutes: 240, scale: "original", roster: [], suggestions: [] };
const $ = (id) => document.getElementById(id);
const fmt = new Intl.NumberFormat("en-US");
const minuteFmt = new Intl.NumberFormat("en-US", { maximumFractionDigits: 3 });
const dec = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2, signDisplay: "exceptZero" });
const LOW_MINUTES_THRESHOLD = 50;
const displayLeague = (league) => league === "NBA" ? "nba" : league.startsWith("NBL1 ") ? `nbl1 ${league.slice(5)}` : league;

function formatSourceMinutes(minutes) {
  const formatted = minuteFmt.format(minutes);
  return minutes > 0 && formatted === "0" ? "<0.001" : formatted;
}

function formatBpm(value) {
  return Number.isFinite(value) ? dec.format(value) : "—";
}

function isUnrated(row) {
  return !row.is_placeholder && (row.is_unrated === true || row.mp <= 0);
}

function smallSampleWarning(row) {
  return !row.is_placeholder && !isUnrated(row) && row.mp < LOW_MINUTES_THRESHOLD
    ? `<span class="small-sample-warning">Small sample: ${escapeHtml(formatSourceMinutes(row.mp))} source min (&lt;${LOW_MINUTES_THRESHOLD}); BPM may be unstable.</span>`
    : "";
}

function unavailableModeWarning(row) {
  if (row.is_placeholder) return "";
  if (isUnrated(row)) return `<span class="mode-unavailable-warning">${row.unrated_reason ? escapeHtml(row.unrated_reason) : "Unrated: no recorded source minutes; BPM is N/A."}</span>`;
  return !Number.isFinite(row.bpm) ? `<span class="mode-unavailable-warning">BPM unavailable in selected comparison mode.</span>` : "";
}

function sourceQualityWarning(row) {
  const note = typeof row.source_quality === "string" ? row.source_quality.trim() : "";
  if (isUnrated(row) && note === row.unrated_reason) return "";
  return !row.is_placeholder && note
    ? `<span class="source-quality-warning">Source-quality note: ${escapeHtml(note)}</span>`
    : "";
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]);
}

function valueClass(value) {
  return value > .005 ? "positive" : value < -.005 ? "negative" : "neutral";
}

function identityName(value) {
  return String(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function indexNbl1Candidates() {
  nbl1OtherLeagueCandidates.clear();
  const otherByName = new Map();
  const nbl1Names = new Map();
  for (const row of state.rows) {
    if (row.is_placeholder) continue;
    const name = identityName(row.name);
    if (!name) continue;
    if (row.league.startsWith("NBL1 ")) {
      if (!nbl1Names.has(row.player_key)) nbl1Names.set(row.player_key, new Set());
      nbl1Names.get(row.player_key).add(name);
    } else {
      if (!otherByName.has(name)) otherByName.set(name, new Map());
      if (!otherByName.get(name).has(row.player_key)) otherByName.get(name).set(row.player_key, []);
      otherByName.get(name).get(row.player_key).push(row);
    }
  }
  for (const [playerKey, names] of nbl1Names) {
    const candidates = new Map();
    for (const name of names) {
      for (const [key, rows] of otherByName.get(name) || []) candidates.set(key, rows);
    }
    nbl1OtherLeagueCandidates.set(playerKey, [...candidates.entries()].map(([key, rows]) => ({ key, rows })).sort((a, b) => a.rows[0].name.localeCompare(b.rows[0].name) || a.key.localeCompare(b.key)));
  }
}

function nbl1PossibleCount(playerKey) {
  const verifiedKeys = new Set((verifiedNbl1Matches.get(playerKey) || []).map((match) => match.other_player_key));
  const rejectedKeys = new Set((rejectedNbl1Matches.get(playerKey) || []).map((match) => match.other_player_key));
  const blockedKeys = new Set((blockedNbl1Matches.get(playerKey) || []).map((match) => match.other_player_key));
  return (nbl1OtherLeagueCandidates.get(playerKey) || []).filter(({ key }) => !verifiedKeys.has(key) && !rejectedKeys.has(key) && !blockedKeys.has(key)).length;
}

function identityEvidenceLinks(match) {
  const urls = match.evidence_urls?.length ? match.evidence_urls : [match.evidence_url];
  return urls.filter(Boolean).map((url, index) => `<a href="${escapeHtml(url)}" target="_blank" rel="noopener">Evidence ${index + 1} ↗</a>`).join(" ");
}

function playerIdentityMeta(row) {
  if (row.is_placeholder) return `<span class="nbl1-row-meta">Ignore this player · placeholder</span>`;
  if (row.player_key?.startsWith("eurocup:")) return `<span class="nbl1-row-meta">Regular season only · Official EuroCup ID: ${escapeHtml(row.player_key.slice(8))} · ${row.canonical_player_key ? "verified linked ID" : "source ID only"}</span>`;
  if (row.league.startsWith("NBL1 ")) return `<span class="nbl1-row-meta" title="${escapeHtml(row.player_key)}">ID: ${escapeHtml(String(row.id).slice(0, 8))}… · ${verifiedNbl1Matches.get(row.player_key)?.length || 0} verified · ${nbl1PossibleCount(row.player_key)} possible</span>`;
  if (row.league === "China NBL") return `<span class="nbl1-row-meta" title="${escapeHtml(row.player_key)}">Official ID: ${escapeHtml(row.id)} · ${verifiedChinaNblMatches.get(row.player_key)?.length || 0} verified cross-league link(s)</span>`;
  if (row.league === "South Korea KBL") return `<span class="nbl1-row-meta" title="${escapeHtml(row.player_key)}">Official ID: ${escapeHtml(row.id)} · ${verifiedKblMatches.get(row.player_key)?.length || 0} verified · ${unresolvedKblMatches.get(row.player_key)?.length || 0} possible</span>`;
  if (row.league === "Philippines PBA") return `<span class="nbl1-row-meta" title="${escapeHtml(row.player_key)}">RealGM ID: ${escapeHtml(row.id)} · ${verifiedPbaMatches.get(row.player_key)?.length || 0} verified link(s)</span>`;
  const labels = [];
  if (verifiedOtherMatches.has(row.player_key)) labels.push("nbl1");
  if (verifiedChinaOtherMatches.has(row.player_key)) labels.push("China NBL");
  if (verifiedKblOtherMatches.has(row.player_key)) labels.push("South Korea KBL");
  if (verifiedPbaOtherMatches.has(row.player_key)) labels.push("Philippines PBA");
  if (row.verified_player_keys?.some(key => key.startsWith("eurocup:"))) labels.push("EuroCup history");
  return labels.length ? `<span class="nbl1-row-meta">Verified ${escapeHtml(labels.join(" + "))} ID match</span>` : "";
}

function applyFilters() {
  const query = state.query.trim().toLowerCase();
  state.filtered = state.rows.filter((row) => {
    const matchesText = !query || `${row.name} ${row.teams}`.toLowerCase().includes(query);
    const matchesLeague = state.league === "all" || (state.league === "College" ? collegeLeagues.has(row.league) : row.league === state.league);
    const matchesSeason = state.season === "all" || row.season === state.season;
    const matchesTeam = state.team === "all" || row.teams.split(" / ").includes(state.team);
    return matchesText && matchesLeague && matchesSeason && matchesTeam && row.mp >= state.minMinutes;
  });
  const direction = state.direction === "asc" ? 1 : -1;
  state.filtered.sort((a, b) => {
    const av = a[state.sort], bv = b[state.sort];
    if (typeof av === "string") return av.localeCompare(bv) * direction;
    if (!Number.isFinite(av)) return Number.isFinite(bv) ? 1 : 0;
    if (!Number.isFinite(bv)) return -1;
    return (av - bv) * direction;
  });
  const totalPages = Math.max(1, Math.ceil(state.filtered.length / PAGE_SIZE));
  state.page = Math.min(state.page, totalPages);
  updateSummary();
  const coverage = state.nbl1Coverage?.[state.league];
  const notice = $("nbl1Coverage");
  notice.hidden = !coverage;
  if (coverage) {
    const selected = coverage.filter((item) => state.season === "all" || item.season === state.season);
    const used = selected.reduce((sum, item) => sum + item.games_used, 0);
    const listed = selected.reduce((sum, item) => sum + item.games_listed_complete, 0);
    notice.textContent = state.league === "NBL1 East" && state.season === "2021"
      ? "nbl1 East began in 2022; there are no 2021 East ratings."
      : `Official men's regular-season box coverage: ${used}/${listed} completed games with reconcilable stats${listed > used ? `; ${listed - used} incomplete boxes excluded` : ""}.`;
  }
  render();
}

function leagueRows() {
  if (state.league === "all") return state.rows.filter((row) => !row.is_placeholder);
  if (state.league === "College") return state.rows.filter((row) => collegeLeagues.has(row.league));
  return state.rows.filter((row) => row.league === state.league);
}

function updateSummary() {
  const rows = leagueRows();
  const eligibleRows = rows.filter((row) => row.mp >= state.minMinutes && Number.isFinite(row.bpm));
  const teams = new Set(rows.flatMap((row) => row.teams.split(" / ")));
  const seasons = new Set(rows.map((row) => row.season));
  $("playerCount").textContent = fmt.format(rows.length);
  $("seasonCount").textContent = seasons.size;
  $("teamCount").textContent = teams.size;
  $("topBpm").textContent = eligibleRows.length ? dec.format(eligibleRows.reduce((best, row) => Math.max(best, row.bpm), -Infinity)) : "—";
}

function updateTeamOptions() {
  const current = state.team;
  const teams = [...new Set(leagueRows().flatMap((row) => row.teams.split(" / ")))].sort();
  $("team").innerHTML = `<option value="all">All teams</option>${teams.map((team) => `<option value="${escapeHtml(team)}">${escapeHtml(team)}</option>`).join("")}`;
  state.team = teams.includes(current) ? current : "all";
  $("team").value = state.team;
}

function setLeague(league) {
  if (league !== state.league) state.minMinutes = defaultMinimum(league);
  state.league = league;
  state.page = 1;
  $("minutes").value = state.minMinutes;
  $("minutesValue").textContent = fmt.format(state.minMinutes);
  document.querySelectorAll("#leagueTabs button").forEach((button) => button.classList.toggle("active", button.dataset.league === league));
  const url = new URL(location.href);
  if (league === "all") url.searchParams.delete("league"); else url.searchParams.set("league", league);
  history.replaceState(null, "", url);
  updateTeamOptions();
  applyFilters();
}

function aiEndpoint() {
  const paths = {
    NBA: "nba", College: "college", EuroLeague: "euroleague", EuroCup: "eurocup", "Basketball Champions League": "basketball-champions-league",
    "Chile LNB": "chile-lnb",
    "Norway BLNO": "norway-blno",
    "NBL1 Central": "nbl1-central", "NBL1 East": "nbl1-east", "NBL1 North": "nbl1-north", "NBL1 South": "nbl1-south", "NBL1 West": "nbl1-west",
    "Australia NBL": "nbl", "China CBA": "cba", "Spain ACB": "acb",
    "China NBL": "china-nbl",
    "South Korea KBL": "kbl",
    "Spain Primera FEB": "primera-feb", "Turkey BSL": "bsl", "France LNB": "lnb",
    "France Élite 2 (Pro B)": "elite2", "France NM1 (Division 3)": "france-nm1", "Italy LBA": "italy", "Italy Serie A2": "serie-a2",
    "Israel Winner League": "israel", "Greece GBL": "greece", "Greece A2 / Elite League": "greece-a2", "ABA League": "aba",
    "VTB United League": "vtb", "British BBL / Super League Basketball": "british",
    "Finland Korisliiga": "finland", "Czech Republic Mattoni NBL": "czech-nbl",
    "Romania Division A": "romania", "BNXT League": "bnxt", "Germany BBL": "germany",
    "Germany ProA": "proa", "NBA G League": "gleague", "Puerto Rico BSN": "bsn",
    "Canadian Elite Basketball League": "cebl", "Dominican Republic LNB": "dominican-lnb",
    "Argentina Liga Nacional": "argentina-lnb", "Brazil NBB": "brazil-nbb",
    "New Zealand NBL": "nz-nbl", "Japan B1": "japan-b1", "Mexico LNBP": "mexico-lnbp",
    "Mexico CIBACOPA": "cibacopa", "Indonesia IBL": "indonesia-ibl", "Venezuela SPB": "venezuela-spb", "Portugal Liga Profissional": "portugal-liga", "Luxembourg LBBL": "luxembourg-lbbl", "Serbia KLS": "serbia-kls", "Latvian–Estonian Basketball League": "latvian-estonian", "Kosovo Superliga": "kosovo-superliga", "Cyprus Division A": "cyprus-division-a", "Slovakia Extraliga": "slovakia-extraliga", "Georgia Superleague": "georgia-superleague", "Sweden Basketligan": "sweden-basketligan", "Austria Superliga": "austria-superliga", "Croatia Liga": "croatia-liga", "Bulgaria NBL": "bulgaria-nbl", "Belarus Premier League": "belarus-premier-league", "Uruguay Liga": "uruguay-liga", "Denmark Basketligaen": "denmark-basketligaen", "Switzerland SBL": "switzerland-sbl", "Slovenia Liga OTP Banka": "slovenia-otp", "Qatar QBL": "qatar-qbl", "Bosnia Division I": "bosnia-division-i", "Basketball Africa League": "bal",
    "Poland PLK": "plk", "Lithuania LKL": "lkl", "Philippines PBA": "pba"
  };
  const path = paths[state.league];
  return path ? `${location.origin}/api/${path}/players.json` : `${location.origin}/api/players.json`;
}

function buildAiPrompt() {
  const scope = [
    `League: ${state.league === "all" ? "all available leagues" : state.league}`,
    `Season: ${state.season === "all" ? "all available seasons" : state.season}`,
    `Team: ${state.team === "all" ? "all teams" : state.team}`,
    `Minimum minutes: ${state.minMinutes}`,
    `Name/team search: ${state.query || "none"}`
  ].join("\n");
  return `Use the Basketball Custom BPM dataset to answer my question.

DATA
Primary JSON endpoint: ${aiEndpoint()}
API directory and field definitions: ${location.origin}/api/index.json
Formula and unit conventions: ${location.origin}/api/methodology.json
JSON Schema: ${location.origin}/api/schema.json
Reviewed nbl1 cross-source IDs: ${location.origin}/identity-matches.json
Reviewed China NBL cross-source IDs: ${location.origin}/china-nbl-identity-matches.json
Reviewed South Korea KBL cross-source IDs: ${location.origin}/kbl-identity-matches.json
Reviewed Philippines PBA cross-source IDs: ${location.origin}/pba-identity-matches.json
Reviewed historical EuroCup IDs: ${location.origin}/eurocup-identity-matches.json
Historical EuroCup game coverage and timing discrepancies: ${location.origin}/eurocup-history-coverage.json

CURRENT SCOPE
${scope}

IDENTITY RULES
- Track a player within the same source with player_key, which uses that source's player ID.
- Track an individual player-season result with record_id.
- Official nbl1 UUIDs and Proballers/Sports Reference IDs are different namespaces. Only join pairs listed in identity-matches.json matches; rejected pairs are known nonmatches, blocked pairs have source-data conflicts, and all remaining same-name pairs are unresolved.
- Official KBL, Proballers, RealGM and other source IDs are different namespaces. Join only reviewed pairs in kbl-identity-matches.json matches. Its rejected and unresolved lists are not links. canonical_player_key and verified_player_keys retain these confirmed identity groups in both directions. All 390 KBL profile review statuses: ${location.origin}/kbl-identity-review.csv
- Philippines PBA uses namespaced RealGM IDs. Join only the reviewed matches in pba-identity-matches.json. canonical_player_key and verified_player_keys expose these confirmed links; unresolved or rejected candidates must not be merged.
- Never join players across sources by display name alone.
- Multi-team seasons have already been calculated by stint and combined using minutes.

FIELD RULES
- bpm is Final BPM.
- raw is BPM before the team adjustment.
- adj is the team adjustment.
- teams may contain multiple clubs separated by " / ".
- Ignore records with is_placeholder=true; Temp Player and Temp Player 2 are zero-BPM templates, not real players.
- The API always serves the new BPM 2.0-style calculation. An on-page comparison-mode selection does not change this endpoint.
- Apply the scope above to the records array before answering.

Please load the endpoint, briefly confirm the number of matching records, and then answer this question:

[TYPE MY QUESTION HERE]`;
}

function openAiDialog() {
  const prompt = buildAiPrompt();
  $("aiPrompt").value = prompt;
  $("aiDataLink").href = aiEndpoint();
  $("copyAiPrompt").textContent = "Copy AI prompt";
  $("aiDialog").showModal();
}

async function copyAiPrompt() {
  const text = $("aiPrompt").value;
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    $("aiPrompt").focus();
    $("aiPrompt").select();
    document.execCommand("copy");
  }
  $("copyAiPrompt").textContent = "Copied — paste it into AI";
}

// Copy-only demonstration row; it is not part of the statistical dataset or API.
const copyExampleRow = Object.freeze({
  id: "example-ignore-this-player",
  league: "N/A",
  name: "Example Player (Ignore this player)",
  season: "N/A",
  teams: "N/A",
  gp: 0,
  mp: 0,
  stints: 0,
  raw: 0,
  adj: 0,
  bpm: 0,
  is_placeholder: true,
  is_copy_example: true
});
const copyExampleRows = Object.freeze([
  copyExampleRow,
  Object.freeze({ ...copyExampleRow, id: "example-player-2", name: "Example Player 2 (Ignore this player)" }),
  Object.freeze({ ...copyExampleRow, id: "template-player", name: "Template Player (Ignore this player)" })
]);
const copyRowCount = () => state.rows.length + copyExampleRows.length;
const copyButtonLabel = () => `Copy ${fmt.format(state.rows.length)} dataset row${state.rows.length === 1 ? "" : "s"} + ${copyExampleRows.length} examples`;

function allRowsTsv() {
  const fields = [
    ["player_id", (row) => row.proballers_id || String(row.id)],
    ["league", (row) => row.league],
    ["player", (row) => row.name],
    ["season", (row) => row.season],
    ["teams", (row) => row.teams],
    ["games", (row) => row.gp],
    ["minutes", (row) => row.mp],
    ["stints", (row) => row.stints],
    ["raw_bpm", (row) => Number.isFinite(row.raw) ? row.raw.toFixed(4) : ""],
    ["team_adjustment", (row) => Number.isFinite(row.adj) ? row.adj.toFixed(4) : ""],
    ["final_bpm", (row) => Number.isFinite(row.bpm) ? row.bpm.toFixed(4) : ""],
    ["requested_bpm_mode", () => state.bpmMode],
    ["bpm_available", (row) => Boolean(!row.is_placeholder && !isUnrated(row) && Number.isFinite(row.bpm))],
    ["is_unrated", (row) => Boolean(isUnrated(row))],
    ["is_placeholder", (row) => Boolean(row.is_placeholder)],
    ["copy_only_example", (row) => Boolean(row.is_copy_example)],
    ["player_key", (row) => row.player_key || ""],
    ["canonical_player_key", (row) => row.canonical_player_key || row.player_key || ""],
    ["verified_player_keys", (row) => (row.verified_player_keys || []).join(" | ")]
  ];
  const clean = (value) => String(value ?? "").replace(/[\t\r\n]+/g, " ");
  const ordered = [...state.rows].sort((a, b) => a.league.localeCompare(b.league) || b.season.localeCompare(a.season) || a.name.localeCompare(b.name));
  return [
    fields.map(([name]) => name).join("\t"),
    ...ordered.map((row) => fields.map(([, getter]) => clean(getter(row))).join("\t")),
    ...copyExampleRows.map((row) => fields.map(([, getter]) => clean(getter(row))).join("\t"))
  ].join("\n");
}

async function copyAllRows() {
  const button = $("copyAllRows");
  if (!state.rows.length) {
    button.textContent = "Data is still loading…";
    return;
  }
  const text = allRowsTsv();
  const copiedMode = $("bpmModeSelect").selectedOptions[0].textContent;
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const temporary = document.createElement("textarea");
    temporary.value = text;
    temporary.style.position = "fixed";
    temporary.style.opacity = "0";
    document.body.appendChild(temporary);
    temporary.select();
    const copied = document.execCommand("copy");
    temporary.remove();
    if (!copied) {
      button.textContent = "Copy failed — try again";
      return;
    }
  }
  button.textContent = `Copied ${fmt.format(copyRowCount())} rows (${fmt.format(state.rows.length)} dataset + ${copyExampleRows.length} examples; ${copiedMode})`;
  button.classList.add("copied");
  setTimeout(() => {
    button.textContent = copyButtonLabel();
    button.classList.remove("copied");
  }, 4500);
}

function render() {
  const start = (state.page - 1) * PAGE_SIZE;
  const pageRows = state.filtered.slice(start, start + PAGE_SIZE);
  $("visibleCount").textContent = fmt.format(state.filtered.length);
  $("rows").innerHTML = pageRows.map((row) => `
    <tr data-id="${escapeHtml(row.id)}" data-season="${escapeHtml(row.season)}" data-league="${escapeHtml(row.league)}" tabindex="0">
      <td class="player">${escapeHtml(row.name)}${playerIdentityMeta(row)}${smallSampleWarning(row)}${unavailableModeWarning(row)}${sourceQualityWarning(row)}</td>
      <td><span class="league-tag ${row.league.toLowerCase().replace(/[^a-z0-9]+/g, "-")}">${escapeHtml(displayLeague(row.league))}</span></td>
      <td><span class="season-tag">${escapeHtml(row.season)}</span></td>
      <td title="${escapeHtml(row.teams)}">${escapeHtml(row.teams)}</td>
      <td class="number">${row.gp}</td>
      <td class="number">${escapeHtml(formatSourceMinutes(row.mp))}</td>
      <td class="number">${formatBpm(row.raw)}</td>
      <td class="number ${valueClass(row.adj)}">${formatBpm(row.adj)}</td>
      <td class="number bpm ${valueClass(row.bpm)}">${formatBpm(row.bpm)}</td>
    </tr>`).join("");
  $("empty").hidden = state.filtered.length !== 0;
  const pages = Math.max(1, Math.ceil(state.filtered.length / PAGE_SIZE));
  $("pageInfo").textContent = `Page ${state.page} of ${pages}`;
  $("prev").disabled = state.page <= 1;
  $("next").disabled = state.page >= pages;
  renderChips();
}

function renderChips() {
  const chips = [];
  if (state.query) chips.push(`Search: ${escapeHtml(state.query)}`);
  if (state.league !== "all") chips.push(`League: ${escapeHtml(displayLeague(state.league))}`);
  if (state.season !== "all") chips.push(`Season: ${escapeHtml(state.season)}`);
  if (state.team !== "all") chips.push(`Team: ${escapeHtml(state.team)}`);
  if (state.minMinutes) chips.push(`${fmt.format(state.minMinutes)}+ minutes`);
  $("activeFilters").innerHTML = chips.map((chip) => `<span class="chip">${chip}</span>`).join("");
}

function pbaIdentityDetails(row) {
  const isPba = row.league === "Philippines PBA";
  const matches = (isPba ? verifiedPbaMatches : verifiedPbaOtherMatches).get(row.player_key) || [];
  if (!isPba && !matches.length) return "";
  if (!auxiliaryLoaded.pbaIdentity) return `<div class="identity-section"><h4>PBA identity review unavailable</h4><p>The reviewed match file did not load; no PBA link can be confirmed.</p></div>`;
  const candidates = isPba ? [...rejectedPbaMatches.get(row.player_key) || [], ...unresolvedPbaMatches.get(row.player_key) || []] : [];
  const review = isPba ? pbaPlayerReviews.get(row.player_key) : null;
  const reviewText = !review ? "" : review.status === "profile_and_aliases_checked_no_candidate_in_covered_dataset"
    ? "Profile and aliases checked against every covered source namespace; no candidate found in this dataset. This is not proof the player cannot appear elsewhere."
    : review.status === "reviewed_candidates_unresolved" ? "Profile checked; candidate evidence remains insufficient. IDs stay separate."
    : review.status === "reviewed_candidates_rejected" ? "Profile checked; the proposed candidates were rejected. No cross-source match is confirmed."
    : "Profile and supported cross-source links reviewed. Source IDs are preserved.";
  return `<div class="identity-section"><h4>${isPba ? "Verified cross-league IDs" : "Verified Philippines PBA IDs"} (${matches.length})</h4>
    ${isPba ? `<code>${escapeHtml(row.player_key)}</code>` : ""}
    ${review ? `<p>${escapeHtml(reviewText)}</p>${review.source_warning ? `<p class="source-quality-note">${escapeHtml(review.source_warning)}</p>` : ""}<p><a href="/pba-identity-review.csv" download>Download all 495 PBA player reviews</a></p>` : ""}
    ${matches.length ? matches.map(m => {
      const key = isPba ? m.other_player_key : m.pba_player_key;
      const linked = state.rows.filter(r => r.player_key === key);
      return `<div class="identity-candidate"><strong>${escapeHtml(isPba ? m.other_name : m.pba_name)}</strong><code>${escapeHtml(key)}</code>
        <span>${escapeHtml([...new Set(linked.map(r => displayLeague(r.league)))].join(" · "))}</span>
        <span>${escapeHtml(m.evidence)}</span>${identityEvidenceLinks(m)}</div>`;
    }).join("") : "<p>No cross-source identity has been verified for this player.</p>"}
    ${candidates.length ? `<h4>Reviewed but unlinked (${candidates.length})</h4>${candidates.map(m => `<div class="identity-candidate"><strong>${escapeHtml(m.other_name)}</strong><code>${escapeHtml(m.other_player_key)}</code><span>${escapeHtml(m.evidence)}</span>${identityEvidenceLinks(m)}</div>`).join("")}` : ""}
  </div>`;
}

function showPlayer(row) {
  if (row.is_placeholder) {
    $("dialogContent").innerHTML = `<div class="dialog-inner"><div class="section-kicker">TEMP PLAYER</div><h3>${escapeHtml(row.name)}</h3><p>Ignore this player. It is a 0.00-BPM placeholder with no affiliate league, not a real statistical record.</p></div>`;
    $("playerDialog").showModal();
    return;
  }
  const history = state.rows.filter((item) => item.league === row.league &&
    (item.id === row.id || row.league === "EuroCup" && (item.canonical_player_key || item.player_key) === (row.canonical_player_key || row.player_key)))
    .sort((a, b) => b.season.localeCompare(a.season));
  const ratedHistory = history.filter((item) => Number.isFinite(item.bpm));
  const min = Math.min(...ratedHistory.map((item) => item.bpm), 0);
  const max = Math.max(...ratedHistory.map((item) => item.bpm), 0);
  const range = Math.max(max - min, 1);
  const verifiedMatches = verifiedNbl1Matches.get(row.player_key) || [];
  const verifiedKeys = new Set(verifiedMatches.map((match) => match.other_player_key));
  const rejectedMatches = rejectedNbl1Matches.get(row.player_key) || [];
  const rejectedKeys = new Set(rejectedMatches.map((match) => match.other_player_key));
  const blockedMatches = blockedNbl1Matches.get(row.player_key) || [];
  const blockedKeys = new Set(blockedMatches.map((match) => match.other_player_key));
  const nbl1Candidates = row.league.startsWith("NBL1 ") ? (nbl1OtherLeagueCandidates.get(row.player_key) || []).filter(({ key }) => !verifiedKeys.has(key) && !rejectedKeys.has(key) && !blockedKeys.has(key)) : null;
  const identityDetails = nbl1Candidates === null ? "" : !auxiliaryLoaded.nbl1Identity
    ? `<div class="identity-section"><h4>nbl1 identity review unavailable</h4><p>The reviewed cross-league match file did not load. No match status can be confirmed here.</p></div>` : `
      <div class="identity-section">
        <h4>Official nbl1 player ID</h4>
        <code>${escapeHtml(row.player_key)}</code>
        <h4>Verified cross-league IDs (${verifiedMatches.length})</h4>
        ${verifiedMatches.length ? verifiedMatches.map((match) => {
          const linkedRows = state.rows.filter((item) => item.player_key === match.other_player_key);
          return `<div class="identity-candidate">
            <strong>${escapeHtml(match.name)}</strong>
            <code>${escapeHtml(match.other_player_key)}</code>
            <span>${escapeHtml([...new Set(linkedRows.map((item) => displayLeague(item.league)))].join(" · "))}</span>
            <span>${match.confidence === "profile_dob_confirmed" ? "Name + exact birth-date match" : "Published career match"}</span>
            <span>${escapeHtml(match.evidence)}</span>
            ${identityEvidenceLinks(match)}
            ${linkedRows[0] ? `<a href="${escapeHtml(linkedRows[0].url)}" target="_blank" rel="noopener">Open linked profile ↗</a>` : ""}
          </div>`;
        }).join("") : `<p>No cross-source ID has been verified for this player yet.</p>`}
        ${rejectedMatches.length ? `<h4>Not the same player (${rejectedMatches.length})</h4>${rejectedMatches.map((match) => `<div class="identity-candidate">
          <code>${escapeHtml(match.other_player_key)}</code>
          <span>${escapeHtml(match.evidence)}</span>
          ${identityEvidenceLinks(match)}
        </div>`).join("")}` : ""}
        ${blockedMatches.length ? `<h4>Source-data conflict — not linked (${blockedMatches.length})</h4>${blockedMatches.map((match) => `<div class="identity-candidate">
          <code>${escapeHtml(match.other_player_key)}</code>
          <span>${escapeHtml(match.evidence)}</span>
          ${identityEvidenceLinks(match)}
        </div>`).join("")}` : ""}
        <h4>Possible matches in other leagues (${nbl1Candidates.length})</h4>
        <p>These share an exact normalized name, not a verified identity. Different websites use different IDs. Compare teams, seasons and source profiles before joining records.</p>
        ${nbl1Candidates.length ? nbl1Candidates.map(({ key, rows }) => `
          <div class="identity-candidate">
            <strong>${escapeHtml(rows[0].name)}</strong>
            <code>${escapeHtml(key)}</code>
            <span>${escapeHtml([...new Set(rows.map((item) => displayLeague(item.league)))].join(" · "))}</span>
            <span>${escapeHtml([...new Set(rows.map((item) => item.season))].sort().join(", "))} · ${escapeHtml([...new Set(rows.map((item) => item.teams))].slice(0, 4).join(" / "))}</span>
            <a href="${escapeHtml(rows[0].url)}" target="_blank" rel="noopener">Check source profile ↗</a>
          </div>`).join("") : `<p>No exact-name candidate in the other leagues currently loaded. This does not rule out a match under another name.</p>`}
      </div>`;
  const reverseMatches = verifiedOtherMatches.get(row.player_key) || [];
  const reverseIdentityDetails = row.league.startsWith("NBL1 ") || !reverseMatches.length ? "" : `
      <div class="identity-section">
        <h4>Verified nbl1 IDs (${reverseMatches.length})</h4>
        ${reverseMatches.map((match) => `<div class="identity-candidate">
          <strong>${escapeHtml(match.name)}</strong>
          <code>${escapeHtml(match.nbl1_player_key)}</code>
          <span>${match.confidence === "profile_dob_confirmed" ? "Name + exact birth-date match" : "Published career match"}</span>
          <span>${escapeHtml(match.evidence)}</span>
          ${identityEvidenceLinks(match)}
        </div>`).join("")}
      </div>`;
  const chinaMatches = verifiedChinaNblMatches.get(row.player_key) || [];
  const chinaIdentityDetails = row.league !== "China NBL" ? "" : !auxiliaryLoaded.chinaIdentity
    ? `<div class="identity-section"><h4>China NBL identity review unavailable</h4><p>The reviewed cross-league match file did not load. No match status can be confirmed here.</p></div>` : `
      <div class="identity-section">
        <h4>Official China NBL player ID</h4>
        <code>${escapeHtml(row.player_key)}</code>
        <h4>Verified cross-league IDs (${chinaMatches.length})</h4>
        ${chinaMatches.length ? chinaMatches.map((match) => {
          const linkedRows = state.rows.filter((item) => item.player_key === match.other_player_key);
          return `<div class="identity-candidate">
            <strong>${escapeHtml(match.other_name)}</strong>
            <code>${escapeHtml(match.other_player_key)}</code>
            <span>${escapeHtml([...new Set(linkedRows.map((item) => displayLeague(item.league)))].join(" · "))}</span>
            <span>${escapeHtml(match.evidence)}</span>
            ${identityEvidenceLinks(match)}
            ${linkedRows[0] ? `<a href="${escapeHtml(linkedRows[0].url)}" target="_blank" rel="noopener">Open linked profile ↗</a>` : ""}
          </div>`;
        }).join("") : `<p>No cross-source ID has been verified for this player yet. A name match alone is not treated as an identity match.</p>`}
      </div>`;
  const chinaReverseMatches = verifiedChinaOtherMatches.get(row.player_key) || [];
  const chinaReverseDetails = row.league === "China NBL" || !chinaReverseMatches.length ? "" : `
      <div class="identity-section">
        <h4>Verified China NBL IDs (${chinaReverseMatches.length})</h4>
        ${chinaReverseMatches.map((match) => `<div class="identity-candidate">
          <strong>${escapeHtml(match.china_nbl_name)}</strong>
          <code>${escapeHtml(match.china_nbl_player_key)}</code>
          <span>${escapeHtml(match.evidence)}</span>
          ${identityEvidenceLinks(match)}
        </div>`).join("")}
      </div>`;
  const kblMatches = verifiedKblMatches.get(row.player_key) || [];
  const kblRejected = rejectedKblMatches.get(row.player_key) || [];
  const kblUnresolved = unresolvedKblMatches.get(row.player_key) || [];
  const kblReview = kblPlayerReviews.get(row.player_key);
  const kblReviewText = !kblReview ? "" : kblReview.status === "profile_and_aliases_checked_no_candidate_in_covered_dataset"
    ? "Official profile and aliases checked against every covered source namespace; no candidate found in this dataset. This is not proof the player cannot appear elsewhere."
    : kblReview.status === "reviewed_candidates_unresolved" ? "Official profile checked; candidate evidence remains insufficient. IDs stay separate."
    : kblReview.status === "reviewed_candidates_rejected" ? "Official profile checked; proposed candidates were rejected. No cross-source match is confirmed."
    : "Official profile and supported cross-source links reviewed. Original source IDs are preserved.";
  const kblIdentityDetails = row.league !== "South Korea KBL" ? "" : !auxiliaryLoaded.kblIdentity
    ? `<div class="identity-section"><h4>KBL identity review unavailable</h4><p>The reviewed cross-league match file did not load. No match status can be confirmed here.</p></div>` : `
      <div class="identity-section">
        <h4>Official KBL player ID</h4>
        <code>${escapeHtml(row.player_key)}</code>
        ${kblReview ? `<p>${escapeHtml(kblReviewText)}</p>${kblReview.source_warning ? `<p class="source-quality-note">${escapeHtml(kblReview.source_warning)}</p>` : ""}<p><a href="/kbl-identity-review.csv" download>Download all 390 KBL player reviews</a> · <a href="/kbl-identity-matches.csv" download>Verified KBL links CSV</a></p>` : ""}
        <h4>Verified cross-league IDs (${kblMatches.length})</h4>
        ${kblMatches.length ? kblMatches.map((match) => {
          const linkedRows = state.rows.filter((item) => item.player_key === match.other_player_key);
          return `<div class="identity-candidate">
            <strong>${escapeHtml(match.other_name)}</strong>
            <code>${escapeHtml(match.other_player_key)}</code>
            <span>${escapeHtml([...new Set(linkedRows.map((item) => displayLeague(item.league)))].join(" · "))}</span>
            <span>${escapeHtml(match.evidence)}</span>
            ${identityEvidenceLinks(match)}
          </div>`;
        }).join("") : `<p>No cross-source ID has been verified for this player yet.</p>`}
        ${kblRejected.length ? `<h4>Reviewed but rejected — unlinked (${kblRejected.length})</h4>${kblRejected.map((match) => `<div class="identity-candidate"><code>${escapeHtml(match.other_player_key)}</code><span>${escapeHtml(match.evidence)}</span>${identityEvidenceLinks(match)}</div>`).join("")}` : ""}
        ${kblUnresolved.length ? `<h4>Unverified name candidates (${kblUnresolved.length})</h4><p>These share a name, but the available identity evidence is insufficient to link their IDs.</p>${kblUnresolved.map((match) => `<div class="identity-candidate"><code>${escapeHtml(match.other_player_key)}</code><span>${escapeHtml(match.evidence)}</span>${identityEvidenceLinks(match)}</div>`).join("")}` : ""}
      </div>`;
  const kblReverseMatches = verifiedKblOtherMatches.get(row.player_key) || [];
  const kblReverseDetails = row.league === "South Korea KBL" || !kblReverseMatches.length ? "" : `
      <div class="identity-section">
        <h4>Verified South Korea KBL ID (${kblReverseMatches.length})</h4>
        ${kblReverseMatches.map((match) => `<div class="identity-candidate"><strong>${escapeHtml(match.kbl_name)}</strong><code>${escapeHtml(match.kbl_player_key)}</code><span>${escapeHtml(match.evidence)}</span>${identityEvidenceLinks(match)}</div>`).join("")}
      </div>`;
  $("dialogContent").innerHTML = `
    <div class="dialog-inner">
      <div class="section-kicker">${escapeHtml(displayLeague(row.league))} · ${escapeHtml(row.season)} PLAYER PROFILE</div>
      <h3>${escapeHtml(row.name)}</h3>
      ${smallSampleWarning(row)}${unavailableModeWarning(row)}${sourceQualityWarning(row)}
      <div class="dialog-team">${escapeHtml(row.teams)} · ${row.stints} stint${row.stints === 1 ? "" : "s"}</div>
      <div class="dialog-score">
        <div><strong class="${valueClass(row.bpm)}">${formatBpm(row.bpm)}</strong><span>FINAL BPM</span></div>
        <div><strong>${formatBpm(row.raw)}</strong><span>RAW BPM</span></div>
        <div><strong>${escapeHtml(formatSourceMinutes(row.mp))}</strong><span>MINUTES</span></div>
      </div>
      <div class="history">
        <h4>Season history</h4>
        ${history.map((item) => `
          <div class="history-row">
            <span>${item.season}</span>
            <div class="bar-track">${Number.isFinite(item.bpm) ? `<div class="bar" style="width:${Math.max(4, ((item.bpm - min) / range) * 100)}%"></div>` : ""}</div>
            <span class="${valueClass(item.bpm)}">${formatBpm(item.bpm)}</span>
          </div>`).join("")}
      </div>
      ${identityDetails}
      ${reverseIdentityDetails}
      ${chinaIdentityDetails}
      ${chinaReverseDetails}
      ${kblIdentityDetails}
      ${kblReverseDetails}
      ${pbaIdentityDetails(row)}
      ${row.league === "EuroCup" ? `<p class="source-quality-note">2016–21: regular season only (official RS phase); Top 16 and all playoffs excluded. Later seasons are unchanged. IDs retain verified same-team/season stat fingerprints as identity evidence. <a href="/eurocup-history-coverage.json" target="_blank" rel="noopener">Coverage</a> · <a href="/eurocup-identity-matches.json" target="_blank" rel="noopener">Verified ID links</a></p>` : ""}
      <a class="profile-link" href="${escapeHtml(row.url)}" target="_blank" rel="noopener">${row.player_key.startsWith("eurocup:") ? "Open official source" : "Open player profile"} ↗</a>
    </div>`;
  $("playerDialog").showModal();
}

function resetFilters() {
  const minMinutes = defaultMinimum(state.league);
  Object.assign(state, { query: "", season: "all", team: "all", minMinutes, page: 1 });
  $("search").value = "";
  $("season").value = "all";
  $("team").value = "all";
  $("minutes").value = minMinutes;
  $("minutesValue").textContent = fmt.format(minMinutes);
  applyFilters();
}

function normalizeSearch(value) {
  return String(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function leagueBpmOffset(row) {
  if (builderState.scale === "original") return null;
  const offsets = builderState.scale === "test2" ? test2LeagueBpmOffsets : leagueBpmOffsets;
  const league = collegeLeagues.has(row.league) ? "NCAA" : row.league;
  return Object.prototype.hasOwnProperty.call(offsets, league) ? offsets[league] : null;
}

function builderBpm(row) {
  if (isUnrated(row) || !Number.isFinite(row.bpm)) return null;
  const offset = leagueBpmOffset(row);
  return row.bpm + (offset ?? 0);
}

function builderBpmMeta(player) {
  if (!Number.isFinite(player.bpmUsed)) return "BPM unavailable in selected mode; rotation total unavailable";
  if (builderState.scale === "original") return "Selected Final BPM, no league offset";
  if (player.offset === null) return "No NBA-relative offset supplied; unscaled BPM";
  return `${dec.format(player.row.bpm)} ${player.offset >= 0 ? "+" : "−"} ${Math.abs(player.offset).toFixed(3)}`;
}

function renderBuilderSuggestions() {
  const query = normalizeSearch($("builderSearch").value.trim());
  const box = $("builderSuggestions");
  if (query.length < 2) {
    builderState.suggestions = [];
    box.hidden = true;
    box.innerHTML = "";
    return;
  }
  const added = new Set(builderState.roster.map((item) => item.row.record_id));
  builderState.suggestions = state.rows
    .filter((row) => !added.has(row.record_id) && query.split(/\s+/).every(term =>
      normalizeSearch(`${row.name} ${row.season} ${row.league} ${row.teams}`).includes(term)))
    .sort((a, b) => {
      const aPrefix = normalizeSearch(a.name).startsWith(query) ? 0 : 1;
      const bPrefix = normalizeSearch(b.name).startsWith(query) ? 0 : 1;
      return aPrefix - bPrefix || a.name.localeCompare(b.name) || b.season.localeCompare(a.season) || b.mp - a.mp;
    })
    .slice(0, 14);
  box.innerHTML = builderState.suggestions.length
    ? builderState.suggestions.map((row, index) => `
      <button class="builder-suggestion" type="button" data-suggestion-index="${index}" ${Number.isFinite(builderBpm(row)) ? "" : "disabled"}>
        <strong>${escapeHtml(row.name)} · ${escapeHtml(row.season)}${smallSampleWarning(row)}${unavailableModeWarning(row)}${sourceQualityWarning(row)}</strong>
        <span>${escapeHtml(displayLeague(row.league))} · ${escapeHtml(row.teams)}</span>
        <em>${Number.isFinite(builderBpm(row)) ? `${formatBpm(builderBpm(row))} ${builderState.scale === "original" ? "BPM" : "BPM used"}` : "N/A · cannot add"}</em>
      </button>`).join("")
    : `<div class="builder-no-match">No player-seasons match that search.</div>`;
  box.hidden = false;
}

function refreshBuilderSuggestions() {
  const box = $("builderSuggestions");
  const wasHidden = box.hidden;
  renderBuilderSuggestions();
  if (wasHidden) box.hidden = true;
}

function setBuilderScale(scale) {
  builderState.scale = scale;
  renderTeamBuilder();
  refreshBuilderSuggestions();
}

function addBuilderPlayer(row) {
  if (!row || !Number.isFinite(builderBpm(row)) || builderState.roster.some((item) => item.row.record_id === row.record_id)) return;
  builderState.roster.push({ row, enteredMinutes: 20 });
  $("builderSearch").value = "";
  $("builderSuggestions").hidden = true;
  builderState.suggestions = [];
  renderTeamBuilder();
}

function safeBuilderMinutes(value) {
  const minutes = Number(value);
  return Number.isFinite(minutes) && minutes > 0 ? minutes : 0;
}

function builderCalculations() {
  const enteredTotal = builderState.roster.reduce((sum, item) => sum + safeBuilderMinutes(item.enteredMinutes), 0);
  const factor = enteredTotal > 0 ? builderState.targetMinutes / enteredTotal : 0;
  const players = builderState.roster.map((item) => {
    const enteredMinutes = safeBuilderMinutes(item.enteredMinutes);
    const stretchedMinutes = enteredMinutes * factor;
    const possessions = stretchedMinutes * 2;
    const offset = leagueBpmOffset(item.row);
    const bpmUsed = builderBpm(item.row);
    const impact = Number.isFinite(bpmUsed) ? (bpmUsed / 100) * possessions : null;
    return { ...item, enteredMinutes, offset, bpmUsed, stretchedMinutes, possessions, impact };
  });
  const possessionsTotal = players.reduce((sum, player) => sum + player.possessions, 0);
  const unavailablePlayers = players.filter((player) => !Number.isFinite(player.bpmUsed));
  const impactTotal = unavailablePlayers.some((player) => player.possessions > 0) ? null : players.reduce((sum, player) => sum + (player.impact ?? 0), 0);
  const teamPossessions = possessionsTotal / 5;
  return {
    enteredTotal,
    factor,
    players,
    stretchedTotal: factor > 0 ? builderState.targetMinutes : 0,
    possessionsTotal,
    teamPossessions,
    unavailablePlayers: unavailablePlayers.length,
    impactTotal,
    netRating: impactTotal === null ? null : teamPossessions > 0 ? (impactTotal / teamPossessions) * 100 : 0
  };
}

function renderTeamBuilder() {
  const calculation = builderCalculations();
  $("builderRows").innerHTML = calculation.players.map((player, index) => `
    <tr>
      <td class="player">${escapeHtml(player.row.name)}<span class="builder-player-meta">${escapeHtml(player.row.season)} · ${escapeHtml(formatSourceMinutes(player.row.mp))} source min</span>${smallSampleWarning(player.row)}${unavailableModeWarning(player.row)}${sourceQualityWarning(player.row)}</td>
      <td title="${escapeHtml(`${displayLeague(player.row.league)} · ${player.row.teams}`)}">${escapeHtml(displayLeague(player.row.league))}<span class="builder-player-meta">${escapeHtml(player.row.teams)}</span></td>
      <td class="number ${valueClass(player.bpmUsed)}">${formatBpm(player.bpmUsed)}<span class="builder-player-meta">${escapeHtml(builderBpmMeta(player))}</span></td>
      <td class="number"><input class="builder-minute-input" data-builder-minutes="${index}" type="number" min="0" step="any" value="${player.enteredMinutes}" aria-label="Entered minutes for ${escapeHtml(player.row.name)} ${escapeHtml(player.row.season)}" /></td>
      <td class="number" data-builder-stretched="${index}"></td>
      <td class="number" data-builder-possessions="${index}"></td>
      <td class="number" data-builder-impact="${index}"></td>
      <td><button class="builder-remove" type="button" data-builder-remove="${index}" aria-label="Remove ${escapeHtml(player.row.name)}">×</button></td>
    </tr>`).join("");
  $("builderEmpty").hidden = calculation.players.length > 0;
  refreshBuilderCalculations();
}

function refreshBuilderCalculations() {
  const calculation = builderCalculations();
  $("builderEntered").textContent = calculation.enteredTotal.toFixed(1);
  $("builderStretched").textContent = calculation.stretchedTotal.toFixed(1);
  $("builderPossessions").textContent = calculation.possessionsTotal.toFixed(1);
  $("builderImpact").textContent = formatBpm(calculation.impactTotal);
  $("builderImpact").className = valueClass(calculation.impactTotal);
  $("builderNetRating").textContent = formatBpm(calculation.netRating);
  $("builderNetRating").className = valueClass(calculation.netRating);
  $("builderFactor").textContent = calculation.factor ? `×${calculation.factor.toFixed(3)}` : "—";
  $("builderTargetLabel").textContent = builderState.targetMinutes;
  $("builderZeroWarning").hidden = !(calculation.players.length && calculation.enteredTotal === 0);
  $("builderScaleSelect").value = builderState.scale;
  $("builderScaleFormula").textContent = builderState.scale === "original"
    ? "Selected Final BPM, no league offset"
    : `${builderState.scale === "test1" ? "Test 1" : "Test 2"} · Starting universal BPM = Final BPM + league offset`;
  const bpmMode = $("bpmModeSelect").value;
  const ladderWarning = bpmMode === "new"
    ? " WARNING: these offsets were fitted to the previous BPM formula. No RMSE or NBA-relative accuracy claim applies to the new BPM 2.0-style results."
    : bpmMode === "schedule"
      ? " WARNING: these offsets were not refitted for the schedule-scaled comparison mode."
      : "";
  const missingOffsets = builderState.scale === "original" ? 0 : calculation.players.filter((player) => player.offset === null && !player.row.is_placeholder).length;
  const missingOffsetWarning = missingOffsets ? ` ${missingOffsets} player-season${missingOffsets === 1 ? " has" : "s have"} no supplied offset and remain unscaled.` : "";
  const unavailableWarning = calculation.unavailablePlayers
    ? ` ${calculation.unavailablePlayers} roster player-season${calculation.unavailablePlayers === 1 ? " is" : "s are"} unavailable in this BPM mode. Totals are N/A while any unavailable player has positive minutes.`
    : "";
  $("builderScaleNote").classList.toggle("unvalidated", builderState.scale !== "original" && bpmMode !== "legacy" || calculation.unavailablePlayers > 0);
  $("builderScaleNote").textContent = builderState.scale === "test1"
    ? "Test 1 uses the full-precision previous-model NBA-relative ladder. Its 12.091 RMSE also included player-minute rules and game adjustments, which this builder does not apply." + ladderWarning + missingOffsetWarning + unavailableWarning
    : builderState.scale === "test2"
      ? "Test 2 uses the previous-model source-only, offset-only ladder, which scored 12.925 RMSE on 168 market-lined games. The builder applies the supplied rounded offsets." + ladderWarning + missingOffsetWarning + unavailableWarning
      : "No league offset is applied. Test 1 and Test 2 were fitted to the previous BPM model, not the new BPM 2.0-style model." + unavailableWarning;
  document.querySelectorAll("[data-team-minutes]").forEach((button) => {
    button.classList.toggle("active", Number(button.dataset.teamMinutes) === builderState.targetMinutes);
  });
  calculation.players.forEach((player, index) => {
    const stretched = document.querySelector(`[data-builder-stretched="${index}"]`);
    const possessions = document.querySelector(`[data-builder-possessions="${index}"]`);
    const impact = document.querySelector(`[data-builder-impact="${index}"]`);
    if (stretched) stretched.textContent = player.stretchedMinutes.toFixed(1);
    if (possessions) possessions.textContent = player.possessions.toFixed(1);
    if (impact) {
      impact.textContent = formatBpm(player.impact);
      impact.className = `number ${valueClass(player.impact)}`;
    }
  });
}

async function fetchJson(url, label) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${label} failed to load`);
  return response.json();
}

const optionalArray = (value) => Array.isArray(value) ? value : [];

function updateAuxiliaryDataNotice() {
  const names = [
    ["legacy", "original-site BPM comparison"],
    ["schedule", "original-site schedule-scaled BPM comparison"],
    ["nbl1Identity", "nbl1 identity review"],
    ["chinaIdentity", "China NBL identity review"],
    ["kblIdentity", "KBL identity review"],
    ["pbaIdentity", "PBA identity review"]
  ].filter(([key]) => !auxiliaryLoaded[key]).map(([, label]) => label);
  const notice = $("auxiliaryDataNote");
  notice.hidden = names.length === 0;
  notice.textContent = names.length
    ? `Some optional data could not load: ${names.join(", ")}. The new BPM dataset remains available. Missing comparisons show N/A; missing identity reviews cannot confirm matches.`
    : "";
}

async function init() {
  try {
    const [data, legacy, scaled, identities, chinaIdentities, kblIdentities, pbaIdentities] = await Promise.all([
      fetchJson("data.json?v=20261019-gamelevel", "Dataset"),
      fetchJson("legacy-bpm.json?v=20261019-gamelevel", "Original-site BPM dataset").catch(() => null),
      fetchJson("schedule-scaled-bpm.json?v=20261019-gamelevel", "Schedule-scaled BPM dataset").catch(() => null),
      fetchJson("identity-matches.json?v=20261007-409-verified", "Verified nbl1 ID matches").catch(() => null),
      fetchJson("china-nbl-identity-matches.json?v=20261008-verified", "Verified China NBL ID matches").catch(() => null),
      fetchJson("kbl-identity-matches.json?v=20261011-kbl-deep-ids", "Verified KBL ID matches").catch(() => null),
      fetchJson("pba-identity-matches.json?v=20261011-pba-deep-ids", "Verified PBA ID matches").catch(() => null)
    ]);
    if (!Array.isArray(data?.rows) || !Array.isArray(data?.seasons)) throw new Error("Dataset has an invalid format");
    auxiliaryLoaded.legacy = Array.isArray(legacy?.rows);
    auxiliaryLoaded.schedule = Array.isArray(scaled?.rows);
    auxiliaryLoaded.nbl1Identity = Array.isArray(identities?.matches);
    auxiliaryLoaded.chinaIdentity = Array.isArray(chinaIdentities?.matches);
    auxiliaryLoaded.kblIdentity = Array.isArray(kblIdentities?.matches);
    auxiliaryLoaded.pbaIdentity = Array.isArray(pbaIdentities?.matches);
    updateAuxiliaryDataNotice();
    state.rows = data.rows;
    indexNbl1Candidates();
    for (const match of optionalArray(identities?.matches)) {
      if (!verifiedNbl1Matches.has(match.nbl1_player_key)) verifiedNbl1Matches.set(match.nbl1_player_key, []);
      verifiedNbl1Matches.get(match.nbl1_player_key).push(match);
      if (!verifiedOtherMatches.has(match.other_player_key)) verifiedOtherMatches.set(match.other_player_key, []);
      verifiedOtherMatches.get(match.other_player_key).push(match);
    }
    for (const match of optionalArray(chinaIdentities?.matches)) {
      if (!verifiedChinaNblMatches.has(match.china_nbl_player_key)) verifiedChinaNblMatches.set(match.china_nbl_player_key, []);
      verifiedChinaNblMatches.get(match.china_nbl_player_key).push(match);
      if (!verifiedChinaOtherMatches.has(match.other_player_key)) verifiedChinaOtherMatches.set(match.other_player_key, []);
      verifiedChinaOtherMatches.get(match.other_player_key).push(match);
    }
    for (const match of optionalArray(kblIdentities?.matches)) {
      if (!verifiedKblMatches.has(match.kbl_player_key)) verifiedKblMatches.set(match.kbl_player_key, []);
      verifiedKblMatches.get(match.kbl_player_key).push(match);
      if (!verifiedKblOtherMatches.has(match.other_player_key)) verifiedKblOtherMatches.set(match.other_player_key, []);
      verifiedKblOtherMatches.get(match.other_player_key).push(match);
    }
    for (const review of optionalArray(kblIdentities?.player_reviews)) kblPlayerReviews.set(review.player_key, review);
    for (const review of optionalArray(pbaIdentities?.player_reviews)) pbaPlayerReviews.set(review.player_key, review);
    for (const match of optionalArray(pbaIdentities?.matches)) {
      if (!verifiedPbaMatches.has(match.pba_player_key)) verifiedPbaMatches.set(match.pba_player_key, []);
      verifiedPbaMatches.get(match.pba_player_key).push(match);
      if (!verifiedPbaOtherMatches.has(match.other_player_key)) verifiedPbaOtherMatches.set(match.other_player_key, []);
      verifiedPbaOtherMatches.get(match.other_player_key).push(match);
    }
    for (const [items, map] of [[pbaIdentities?.rejected, rejectedPbaMatches], [pbaIdentities?.unresolved, unresolvedPbaMatches]]) for (const match of optionalArray(items)) {
      if (!map.has(match.pba_player_key)) map.set(match.pba_player_key, []);
      map.get(match.pba_player_key).push(match);
    }
    for (const match of optionalArray(kblIdentities?.rejected)) {
      if (!rejectedKblMatches.has(match.kbl_player_key)) rejectedKblMatches.set(match.kbl_player_key, []);
      rejectedKblMatches.get(match.kbl_player_key).push(match);
    }
    for (const match of optionalArray(kblIdentities?.unresolved)) {
      if (!unresolvedKblMatches.has(match.kbl_player_key)) unresolvedKblMatches.set(match.kbl_player_key, []);
      unresolvedKblMatches.get(match.kbl_player_key).push(match);
    }
    for (const match of optionalArray(identities?.rejected)) {
      if (!rejectedNbl1Matches.has(match.nbl1_player_key)) rejectedNbl1Matches.set(match.nbl1_player_key, []);
      rejectedNbl1Matches.get(match.nbl1_player_key).push(match);
    }
    for (const match of optionalArray(identities?.blocked)) {
      if (!blockedNbl1Matches.has(match.nbl1_player_key)) blockedNbl1Matches.set(match.nbl1_player_key, []);
      blockedNbl1Matches.get(match.nbl1_player_key).push(match);
    }
    state.nbl1Coverage = data.nbl1Coverage || {};
    for (const row of state.rows) {
      if (row.is_placeholder) continue;
      if (isUnrated(row)) {
        row.is_unrated = true;
        row.raw = null;
        row.adj = null;
        row.bpm = null;
      }
      newBpm.set(`${row.league}:${row.season}:${row.id}`, { raw: row.raw, adj: row.adj, bpm: row.bpm });
    }
    for (const row of optionalArray(legacy?.rows)) legacyBpm.set(`${row.league}:${row.season}:${row.id}`, row);
    for (const row of optionalArray(scaled?.rows)) scheduleScaledBpm.set(`${row.league}:${row.season}:${row.id}`, row);
    $("bpmModeSelect").disabled = false;
    $("minutes").value = state.minMinutes;
    $("minutesValue").textContent = fmt.format(state.minMinutes);
    $("copyAllRows").textContent = copyButtonLabel();
    $("season").insertAdjacentHTML("beforeend", data.seasons.map((season) => `<option value="${season}">${season}</option>`).join(""));
    setLeague(state.league);
    renderTeamBuilder();
  } catch (error) {
    $("rows").innerHTML = `<tr><td colspan="9" class="player">Could not load the dataset. ${escapeHtml(error.message)}</td></tr>`;
  }
}

function setBpmMode(mode) {
  state.bpmMode = mode;
  let unavailable = 0;
  for (const row of state.rows) {
    const key = `${row.league}:${row.season}:${row.id}`;
    const values = row.is_placeholder ? { raw: 0, adj: 0, bpm: 0 } : mode === "schedule" ? scheduleScaledBpm.get(key) : mode === "legacy" ? legacyBpm.get(key) : newBpm.get(key);
    if (isUnrated(row) || !values || !Number.isFinite(values.raw) || !Number.isFinite(values.adj) || !Number.isFinite(values.bpm)) {
      row.raw = null;
      row.adj = null;
      row.bpm = null;
      if (!isUnrated(row)) unavailable++;
    } else {
      row.raw = values.raw;
      row.adj = values.adj;
      row.bpm = values.bpm;
    }
  }
  const notes = {
    new: "Game-level BPM 2.0-style is on. Regular season only (G League includes Showcase Cup). Game-level team adjustment (BPM 2.0 style): each player's team adjustment follows the opponent-adjusted ratings of the games he actually played, minute-weighted; the team still sums to its net rating, no ×1.2. Not official Basketball-Reference BPM. Downloads and the API use this mode.",
    legacy: "Original-site BPM is on for comparison: the values published at basketball-bpm-rebuilt.vercel.app, with one season-level team adjustment for every player on a team and that site's source totals. Downloads and the API use the game-level mode; Copy all rows follows this selection.",
    schedule: "Original-site schedule-scaled BPM is on for comparison (copied from basketball-bpm-rebuilt.vercel.app). This is not the game-level model. Downloads and the API use the game-level mode; Copy all rows follows this selection."
  };
  const missingComparison = mode !== "new" && !auxiliaryLoaded[mode]
    ? " This entire comparison dataset could not load; its BPMs display as N/A, not as substituted new-model values."
    : "";
  $("bpmModeNote").textContent = notes[mode] + missingComparison + (unavailable && !missingComparison ? ` ${fmt.format(unavailable)} player-season${unavailable === 1 ? " is" : "s are"} not covered by this comparison mode; those BPMs display as N/A rather than using a different model.` : "");
  $("formulaTeamTarget").textContent = mode === "new"
    ? "Team adjustment = season constant + (game context − team rating) / 5 · regular season only · no ×1.2"
    : "Original site: one season-level team adjustment per team · comparison only";
  $("footerBpmMode").textContent = `BPM mode: ${$("bpmModeSelect").selectedOptions[0].textContent}`;
  $("footerBpmMode").classList.toggle("active", mode !== "new");
  applyFilters();
  renderTeamBuilder();
  refreshBuilderSuggestions();
}

$("bpmModeSelect").addEventListener("change", (event) => setBpmMode(event.target.value));

$("search").addEventListener("input", (event) => {
  state.query = event.target.value;
  state.page = 1;
  if (state.query.trim() && state.league !== "all") setLeague("all");
  else applyFilters();
});
$("season").addEventListener("change", (event) => { state.season = event.target.value; state.page = 1; applyFilters(); });
$("team").addEventListener("change", (event) => { state.team = event.target.value; state.page = 1; applyFilters(); });
$("minutes").addEventListener("input", (event) => { state.minMinutes = Number(event.target.value); $("minutesValue").textContent = fmt.format(state.minMinutes); state.page = 1; applyFilters(); });
$("reset").addEventListener("click", resetFilters);
$("leagueTabs").addEventListener("click", (event) => { const button = event.target.closest("button[data-league]"); if (button) setLeague(button.dataset.league); });
$("openAiKit").addEventListener("click", openAiDialog);
$("copyAiPrompt").addEventListener("click", copyAiPrompt);
$("copyAllRows").addEventListener("click", copyAllRows);
$("closeAiDialog").addEventListener("click", () => $("aiDialog").close());
$("aiDialog").addEventListener("click", (event) => { if (event.target === $("aiDialog")) $("aiDialog").close(); });
$("prev").addEventListener("click", () => { state.page--; render(); window.scrollTo({ top: $("rows").offsetTop - 180, behavior: "smooth" }); });
$("next").addEventListener("click", () => { state.page++; render(); window.scrollTo({ top: $("rows").offsetTop - 180, behavior: "smooth" }); });
document.querySelector("thead").addEventListener("click", (event) => {
  const header = event.target.closest("th[data-sort]");
  if (!header) return;
  const key = header.dataset.sort;
  state.direction = state.sort === key && state.direction === "desc" ? "asc" : "desc";
  state.sort = key;
  document.querySelectorAll("th").forEach((th) => { th.classList.remove("sorted"); const mark = th.querySelector("span"); if (mark) mark.textContent = "↕"; });
  header.classList.add("sorted");
  header.querySelector("span").textContent = state.direction === "desc" ? "↓" : "↑";
  applyFilters();
});
$("rows").addEventListener("click", (event) => { const tr = event.target.closest("tr[data-id]"); if (tr) showPlayer(state.filtered.find((row) => row.id === tr.dataset.id && row.season === tr.dataset.season && row.league === tr.dataset.league)); });
$("rows").addEventListener("keydown", (event) => { if (event.key === "Enter") event.target.click(); });
$("closeDialog").addEventListener("click", () => $("playerDialog").close());
$("playerDialog").addEventListener("click", (event) => { if (event.target === $("playerDialog")) $("playerDialog").close(); });
document.addEventListener("keydown", (event) => { if (event.key === "/" && document.activeElement !== $("search")) { event.preventDefault(); $("search").focus(); } });
$("builderSearch").addEventListener("input", renderBuilderSuggestions);
$("builderSearch").addEventListener("keydown", (event) => {
  const firstAvailable = builderState.suggestions.find((row) => Number.isFinite(builderBpm(row)));
  if (event.key === "Enter" && firstAvailable) {
    event.preventDefault();
    addBuilderPlayer(firstAvailable);
  } else if (event.key === "Escape") {
    $("builderSuggestions").hidden = true;
  }
});
$("builderSuggestions").addEventListener("click", (event) => {
  const button = event.target.closest("[data-suggestion-index]");
  if (button) addBuilderPlayer(builderState.suggestions[Number(button.dataset.suggestionIndex)]);
});
$("builderRows").addEventListener("input", (event) => {
  const input = event.target.closest("[data-builder-minutes]");
  if (!input) return;
  const item = builderState.roster[Number(input.dataset.builderMinutes)];
  if (item) {
    item.enteredMinutes = safeBuilderMinutes(input.value);
    refreshBuilderCalculations();
  }
});
$("builderRows").addEventListener("change", (event) => {
  const input = event.target.closest("[data-builder-minutes]");
  if (!input) return;
  const item = builderState.roster[Number(input.dataset.builderMinutes)];
  if (!item) return;
  item.enteredMinutes = safeBuilderMinutes(input.value);
  input.value = item.enteredMinutes;
  refreshBuilderCalculations();
});
$("builderRows").addEventListener("click", (event) => {
  const button = event.target.closest("[data-builder-remove]");
  if (!button) return;
  builderState.roster.splice(Number(button.dataset.builderRemove), 1);
  renderTeamBuilder();
});
document.querySelector(".builder-target").addEventListener("click", (event) => {
  const button = event.target.closest("[data-team-minutes]");
  if (!button) return;
  builderState.targetMinutes = Number(button.dataset.teamMinutes);
  refreshBuilderCalculations();
});
$("builderScaleSelect").addEventListener("change", (event) => {
  setBuilderScale(event.target.value);
});
document.addEventListener("click", (event) => {
  if (!event.target.closest(".builder-search-area")) $("builderSuggestions").hidden = true;
});

const bibleVerses = [
  { reference: "Psalm 23:1", text: "The Lord is my shepherd; I shall not want." },
  { reference: "Proverbs 3:5", text: "Trust in the Lord with all thine heart; and lean not unto thine own understanding." },
  { reference: "Psalm 119:105", text: "Thy word is a lamp unto my feet, and a light unto my path." },
  { reference: "1 Thessalonians 5:17", text: "Pray without ceasing." },
  { reference: "Philippians 4:13", text: "I can do all things through Christ which strengtheneth me." },
  { reference: "Proverbs 16:3", text: "Commit thy works unto the Lord, and thy thoughts shall be established." },
  { reference: "Romans 12:12", text: "Rejoicing in hope; patient in tribulation; continuing instant in prayer;" },
];
let currentBibleVerse = -1;
function showRandomBibleVerse() {
  const next = currentBibleVerse < 0
    ? Math.floor(Math.random() * bibleVerses.length)
    : (currentBibleVerse + 1 + Math.floor(Math.random() * (bibleVerses.length - 1))) % bibleVerses.length;
  currentBibleVerse = next;
  const verse = bibleVerses[next];
  $("bibleVerseText").textContent = `“${verse.text}”`;
  $("bibleVerseRef").textContent = `${verse.reference} · KJV ↗`;
  $("bibleVerseRef").href = `https://www.biblegateway.com/passage/?search=${encodeURIComponent(verse.reference)}&version=KJV`;
}
$("anotherVerse").addEventListener("click", showRandomBibleVerse);
showRandomBibleVerse();

init();
