# Use More Kerb Season Planner

A free karting season planner: UK club rounds, rental championships and rental-track events, free weekends and clashes.

- `index.html` is the whole app. Each person's calendar is saved on their own device.
- `data/races.json` is the shared list of club, rental and track dates. It is refreshed automatically every week.

Hosted on Netlify. Every push to `main` goes live automatically.

## Team manager

`team/index.html` is a second app for endurance team managers, at `/team/`. It shows only the endurance races from `data/races.json`, plus any races the manager adds. Managers add drivers, coaches and mechanics, put a coach and mechanic with each driver at each race, and tick off staff payments. It is saved on the manager's own device, with backup and restore.

Both apps share `sw.js` for offline use and `fonts/f1.ttf`.

## USA and Europe versions

Tap the flag next to the logo to switch between UK, Europe and USA. The Europe version reads `data/races-eu.json` and the USA version reads `data/races-us.json` (same shape as `data/races.json`) and keeps its own saved calendar on the device. Weekends, clashes, booking and shop work the same; "Where's Brad racing?" is UK only.

## Setup coach

`setup/` is a kart troubleshooting app. Drivers describe a problem by text or voice and get driving and setup fixes from the guide in `setup/guide.js` (works offline). A Rental toggle hides setup advice. "Ask the AI" calls the Netlify function `netlify/functions/coach.mjs`, which needs an `ANTHROPIC_API_KEY` environment variable on Netlify (optional: `COACH_MODEL`, `COACH_DAILY_LIMIT`). It only works on the Netlify address, not GitHub Pages.
