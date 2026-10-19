# Zerper BPM Explorer — game-level, regular season only

A copy of the [Zerper BPM Explorer](https://basketball-bpm-rebuilt.vercel.app) that looks and works the same. The differences:

- **Regular-season games only.** The G League includes the Showcase Cup.
- **Game-level team adjustment (BPM 2.0 style).** Each player's team adjustment follows the opponent-adjusted ratings of the games he actually played, weighted by minutes. The original applies one season-level constant per team.
- **Coverage:** 11 leagues (NBA, G League, EuroLeague, ACB, BSL, LBA, LNB, Israel, BBL, BSN, CEBL), 2020-21 to 2025-26.

Everything is rebuilt from game box scores. Raw BPM uses exactly the original site's published formula.

This is a separate site for the Vercel project `basketball-bpm-gamelevel`. It has no link to the original project.
