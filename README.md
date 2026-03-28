# Zagreb Hackathon - Gdje Živjeti

**Zagreb neighborhood intelligence** — an AI-assisted matchmaker and a live view of communal works, built for **Cursor Hackathon Zagreb** under the theme *“Build something Zagreb wants.”*

---

## At a glance

| | |
|:---|:---|
| **What it is** | A **Next.js** web app that turns how you *actually* live — family, commute, noise, car-free life — into **ranked neighborhoods**, a **Google Maps** explorer, and context from **real city data**. |
| **Data** | Pulls from Zagreb’s official open data portal ([data.zagreb.hr](https://data.zagreb.hr)): communal plan, kindergartens, transit-related signals, air quality, and more; the map adds **ZET tram stops** and **bike-sharing** points from bundled datasets. |
| **Standout** | **Komunalni radar** — see road works, closures, and maintenance *on the map* so “quiet” and “easy commute” mean something concrete today, not just on paper. |

---

## What’s in the codebase

| Area | What you get |
|:---|:---|
| **Landing** | Croatian / English copy, **voice input** (browser Web Speech API), and suggested queries; opening animation via a **preloader**. |
| **Results** (`/results?q=…`) | **Gemini** turns free text into structured criteria, merges **live** komunalni works, kindergartens, and air data, then **scores** all **17** gradske četvrti. If you name a **work location**, commute times (Google **Directions**, transit-first) refine the **top five**. Collapsible **AI narrative** explains the match. |
| **Map** | Dark-styled **Google Maps** with toggles: **utility radar**, **ZET stops**, **kindergartens** (with free-capacity cues where data allows), **air quality** markers, **cycling** stations. Neighborhoods are selectable from the list or the map. |
| **Housing** | **Apartment drawer** per neighborhood: deep links to **Nekretnine.hr**, **Crozilla**, **Oglasnik**, **Njuškalo** (rent/sale patterns per `src/lib/apartment-platforms.ts`), plus optional nearby **real-estate agencies** from the Google **Places** API when a key is set. |
| **Neighborhood detail** | `/neighborhood/[id]` — deeper view for one četvrt with map context and local radar / services signals. |

Backend routes include `POST /api/match`, `GET /api/radar`, `GET /api/kindergartens`, `GET /api/airquality`, and `GET /api/apartments`. Implementation details, data links, and architecture notes stay in **[PLAN.md](PLAN.md)**.

---

## Tech stack

- **Next.js 16** (App Router), **React 19**, **TypeScript**, **Tailwind CSS 4**
- **Google Generative AI (Gemini)** — criteria extraction and narrative text
- **Google Maps JavaScript API** — map UI, geocoding, directions, Places (agencies)
- **Framer Motion**, **Radix** primitives, **Lucide** icons

Optional: **Supabase** client/middleware scaffolding exists for future auth/session (`src/lib/supabase`, `src/proxy.ts`); the main matching flow does not depend on it.

---

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Production build: `npm run build` then `npm start`.

### Environment variables

Create `.env.local` in the project root (never commit it):

| Variable | Purpose |
|:---|:---|
| `GEMINI_API_KEY` | **Required** for `/api/match` (criteria + narrative). |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | **Required** for the map, commute scoring, geocoding; **optional** for nearby agencies in `/api/apartments` (gracefully skipped if missing). |

---

## Key points

1. **Plain-language search** — Describe your situation in Croatian or English (e.g. family, no car, quiet, work in Donji grad). The app structures that into criteria and scores Zagreb’s gradske četvrti.
2. **Voice-friendly** — On the home page you can **dictate** the query where the browser supports speech recognition.
3. **Explainable recommendations** — Rankings come with **why** (transit, childcare pressure, active construction, air quality signals, commute when a workplace is given), not just a single number.
4. **Map-first exploration** — Neighborhoods and **five** context layers are visual: compare areas, spot disruption, transit, and cycling at the same time.
5. **Grounded in open government data** — Signals tie back to **published datasets**, not guesswork — aligned with transparency and everyday decision-making.
6. **Closer to “where do I sign?”** — Per-neighborhood links to **major Croatian listing sites** and optional **agency pins** so discovery connects to the next step of a real move.

---

## Who can benefit?

| Who | Why it helps |
|:---|:---|
| **Renters & buyers** | Less tab chaos — one place to match lifestyle, commute, and family needs to areas, with construction and services in view. |
| **Families with young children** | Kindergarten capacity and neighborhood fit surface **together** with noise/disruption from planned works. |
| **Car-free households** | Transit and **cycling** cues matter; scoring can use **realistic commute** times when you name where you work or study. |
| **People relocating to Zagreb** | Natural language + map + official data shortens the “which district even is this?” learning curve. |
| **Locals comparing a move** | Side-by-side reasoning: *this* četvrt vs *that* one with **live** communal context. |
| **City & civic tech angle** | Demonstrates how **open data + UX** can make planning information legible to residents, not only to GIS teams. |

---

## Two pillars

| Pillar | In short |
|:---|:---|
| **Neighborhood matchmaker** | Natural language → structured criteria → scored districts, AI narrative, commute-aware top results, and exploration UI. |
| **Komunalni radar** | Overlay of **Plan komunalnih aktivnosti** and related layers — works, closures, maintenance — **in context** on the map, with **transit**, **childcare**, **air**, and **bike** layers alongside. |

---

## Meet our team

We’re from **Sarajevo**: two Computer Science students at different local universities, and a professional Swift / iOS developer.

- **[Hamza Miladin](https://www.linkedin.com/in/hamza-miladin-5a4105264/)** — Swift developer at [Symphony](https://symphony.is).
- **[Benjamin Mahmutovic](https://www.linkedin.com/in/benjodev/)** — Computer Science student, **International Burch University**, Sarajevo.
- **[Anes Djumisic](https://www.linkedin.com/in/anes-djumisic/)** — Computer Science student, **Faculty of Electrical Engineering**, **University of Sarajevo**.
