# لوحة الأداء التنفيذية — قناة القرآن الكريم
## Executive Performance Dashboard — Enterprise Offline Edition

**هيئة الإذاعة والتلفزيون · Saudi Broadcasting Authority**

A fully self‑contained, 100 % offline build of the executive performance dashboard. Every
external dependency (Google Fonts, Font Awesome / Cloudflare, Leaflet & Chart.js CDNs, and the
online map tiles) has been removed and replaced with a **bundled local copy**. The package runs
on any Windows/macOS/Linux computer **with no Internet connection, no firewall exceptions, and no
web server** — just open `index.html`.

---

## نظرة سريعة (Arabic Quick Start)

1. انسخ مجلد `Quran-Channel-Dashboard-Offline` كاملاً إلى الجهاز المستهدف.
2. افتح ملف `index.html` بالنقر المزدوج (Chrome أو Edge أو Firefox).
3. تعمل اللوحة بالكامل **دون أي اتصال بالإنترنت** — الخطوط والأيقونات والرسوم البيانية والخريطة كلها محلية.

> لا يتطلب التشغيل أي تثبيت، ولا خادم ويب، ولا إعدادات، ولا اتصال بالشبكة.

---

## 1. Project Structure

```
Quran-Channel-Dashboard-Offline/
│
├── index.html                 ← open this file (double‑click)
│
├── css/
│   ├── dashboard.css           design system (unchanged)
│   ├── fonts.css               @font-face for Cairo + IBM Plex Mono (localized)
│   ├── fontawesome.css          Font Awesome 6.5.2 (localized paths)
│   └── leaflet.css              Leaflet 1.9.4 (localized image paths)
│
├── js/
│   ├── app.js                  dashboard logic (map tiles → offline GeoJSON)
│   ├── data.js                 demo dataset + generators (unchanged)
│   ├── chart.min.js            Chart.js 4.4.1 (bundled)
│   ├── leaflet.js              Leaflet 1.9.4 (bundled)
│   └── world-geo.js            offline world base map (GeoJSON as a JS global)
│
├── fonts/
│   ├── Cairo/                  Arabic UI font (variable woff2, all weights)
│   ├── IBMPlexMono/            numeric / monospace font (woff2)
│   └── FontAwesome/            icon webfonts (woff2 + ttf: solid, regular, brands)
│
├── assets/
│   ├── logos/logo.svg          brand mark (reference copy)
│   └── images/leaflet/         Leaflet control images (marker, layers)
│
├── data/
│   ├── dashboard.json          full dataset — reference export (see §6)
│   └── countries.json          country viewer dataset — reference export
│
├── README.md                   this file
└── DEPENDENCY-REPORT.md         offline‑readiness audit / dependency report
```

Fonts reflect the design as built: the UI uses **Cairo** (Arabic) and **IBM Plex Mono** (figures).
No other font is loaded.

---

## 2. How to Run

**The simplest way — no server needed:**

1. Copy the whole folder to the target machine (USB stick, network share, or ZIP).
2. Double‑click **`index.html`**.
3. The dashboard opens in the default browser and runs entirely offline.

**Optional — serve over HTTP** (only if a corporate policy blocks `file://` scripts, which is rare):

```powershell
# From inside the folder, with Node.js installed:
npx --yes serve .
# then browse to the printed http://localhost:3000 address
```

No build step, no `npm install`, no configuration.

---

## 3. Offline Compatibility

This edition was rebuilt specifically to satisfy an air‑gapped / restricted‑network deployment.
It is verified to work when **all** of the following are true:

| Condition | Result |
|---|---|
| Internet completely disconnected | ✅ Works |
| Firewall blocks every external site | ✅ Works |
| Google Fonts unreachable | ✅ Works (fonts are local) |
| Cloudflare / cdnjs unreachable | ✅ Works (Font Awesome is local) |
| jsDelivr / unpkg unreachable | ✅ Works (libraries are local) |
| Online map tiles blocked | ✅ Works (offline GeoJSON base map) |
| No web server running | ✅ Works (`file://` double‑click) |

**What changed vs. the original:** the only functional change is the map. The original pulled
raster tiles from `basemaps.cartocdn.com` (online). This edition renders a **bundled vector world
map** (`js/world-geo.js`) through Leaflet instead — same pan/zoom, same country markers, same
tooltips, same light/dark theming — with **zero network calls**. All colors, layout, charts, RTL
behavior, animations, and features are otherwise **identical** to the original.

---

## 4. Browser Compatibility

Tested and supported on current versions of:

- **Google Chrome**
- **Microsoft Edge**
- **Mozilla Firefox**

No installation, plug‑ins, or configuration required. The dashboard is responsive
(desktop, laptop, tablet) and supports both **light and dark** modes plus full **RTL** Arabic layout.

---

## 5. Deployment

The package is fully portable — it is just a folder of static files.

- **Single workstation:** copy the folder, double‑click `index.html`.
- **Shared drive / intranet:** place the folder on a file share or internal web server
  (IIS, Apache, Nginx). Any static host works; no server‑side runtime is needed.
- **Kiosk / display screen:** point the browser at `index.html` (or the intranet URL) in kiosk mode.
- **Distribution:** ZIP the folder and hand it over. It contains everything it needs.

Because there are **no external requests**, the dashboard behaves identically inside secured
government / banking networks as it does on an isolated machine.

---

## 6. Data

The live dashboard loads its dataset from **`js/data.js`**, which is included via a `<script>` tag.
This is deliberate: browsers block `fetch()`/`XMLHttpRequest` of local files under the `file://`
protocol (CORS), so a `fetch('data.json')` approach would fail on a double‑clicked page. Loading the
data as a script keeps the dashboard working offline with no server.

For integration and reporting convenience, the same data is **also** exported as static JSON under
`data/` (`dashboard.json`, `countries.json`). These are **reference copies** — editing them does not
change the dashboard; to change the displayed numbers, edit `js/data.js`.

All figures are representative demo data for presentation purposes.

---

## 7. Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| Page is blank / unstyled | Folder was moved but sub‑folders (`css/`, `js/`, `fonts/`) were left behind | Copy the **entire** folder, keeping the structure intact |
| Boxes appear instead of Arabic text | `fonts/` folder missing or renamed | Restore the `fonts/` folder next to `index.html` |
| Icons show as empty squares | `fonts/FontAwesome/` missing, or `css/fontawesome.css` not loaded | Restore `fonts/FontAwesome/` and `css/fontawesome.css` |
| Map area is empty | `js/leaflet.js` or `js/world-geo.js` not loaded | Ensure both files are present in `js/` |
| Charts don't appear | `js/chart.min.js` not loaded | Ensure `js/chart.min.js` is present in `js/` |
| Want to confirm "no Internet used" | — | Open DevTools → **Network**, reload: every request is local (`file://` or same host); no external domains |

**Verifying offline operation manually:** disconnect the network entirely, then open `index.html`.
Everything — fonts, icons, all charts, the map, search, filters, theme toggle, CSV export — continues
to work.

---

## 8. Credits & Licensing (bundled components)

| Component | Version | License |
|---|---|---|
| Cairo (font) | Google Fonts | SIL Open Font License 1.1 |
| IBM Plex Mono (font) | Google Fonts | SIL Open Font License 1.1 |
| Font Awesome Free | 6.5.2 | Icons CC BY 4.0 · Fonts SIL OFL 1.1 · Code MIT |
| Leaflet | 1.9.4 | BSD‑2‑Clause |
| Chart.js | 4.4.1 | MIT |
| World base map (GeoJSON) | Natural Earth derived | Public Domain |

All components are redistributed unmodified except for local path references. Original license
notices are preserved inside the respective files.

---

*Enterprise Offline Edition — prepared for delivery to ministries, government organizations, banks,
and enterprise customers. No Internet connection is ever required.*
