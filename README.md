# Commun Broadcast Monitor

A MERN (MongoDB, Express, React, Node) application for importing, monitoring, filtering and
exporting WhatsApp broadcast delivery reports downloaded from Commun.

JavaScript only

## Features

- Chunk-based imports (CSV / XLS / XLSX) with drag & drop, preview and column mapping
- Automatic column detection with manual override
- SHA-256 file-hash duplicate protection + row fingerprint duplicate counting
- Indian-aware phone normalization (stores both normalized and original)
- Dashboard with status cards, donut chart, chunk performance bars and date presets
- Broadcast list + broadcast detail with results breakdown and delivery details
- Global multi-filter bar (chunks, broadcasts, templates, statuses, categories, dates, phone, error, search)
- Server-side pagination and MongoDB indexes for scale
- Backend CSV and multi-sheet Excel exports using exactly the same filters
- Saved reports (save / run / export / delete)
- Dark mode persisted in localStorage, fully responsive layout

## Getting started

```bash
cp .env.example .env       # then fill in MONGODB_URI
npm install                # root (concurrently)
npm run install:all        # installs server + client deps
npm run dev                # runs API on :5000 and client on :5173
```

Optional demo data (fake phone numbers only):

```bash
npm run seed
```

### Environment

`.env` at the project root (read by the server only):

```
MONGODB_URI=
PORT=5000
CLIENT_URL=http://localhost:5173
```

The database name is forced to `monitor`. The client only knows `VITE_API_URL`
(`client/.env`, defaults to `http://localhost:5000/api`) — MongoDB credentials are never
exposed to the browser.

## Project structure

```
commun-monitor/
├── client/            React + Vite + Tailwind + Recharts (JSX only)
│   └── src/{components,pages,layouts,hooks,services,utils}
├── server/            Express + Mongoose (CommonJS JS only)
│   └── {controllers,models,routes,middleware,services,utils,config}
├── .env.example
└── README.md
```

## API

| Method | Endpoint | Purpose |
| --- | --- | --- |
| POST | `/api/chunks/preview` | Parse a file, return headers, preview rows, auto mapping, duplicate check |
| POST | `/api/chunks/import` | Import a file into a new chunk (`force=true` to override duplicate) |
| GET | `/api/chunks` | Paginated chunk list with per-status counts |
| GET/PUT/DELETE | `/api/chunks/:id` | Read / rename / delete a chunk (delete cascades to deliveries) |
| GET | `/api/broadcasts` | Aggregated broadcast list |
| GET | `/api/broadcasts/:name` | Broadcast detail + results breakdown |
| GET | `/api/deliveries` | Filtered, paginated delivery records |
| GET | `/api/deliveries/facets` | Distinct broadcasts / templates / categories |
| GET | `/api/reports` · POST · PUT · DELETE · POST `/:id/run` | Saved reports |
| POST | `/api/reports/preview` | Combined filtered report summary |
| GET | `/api/reports/export/csv` \| `/excel` | Backend-generated exports |
| GET | `/api/dashboard/stats` · `/chunk-performance` | Dashboard data |

Filter params supported everywhere: `chunkIds, broadcastNames, templateNames, statuses,
categories, fromDate, toDate, uploadedFrom, uploadedTo, phone, error, search, page, limit,
sortBy, sortDir`.

## Data behaviour

Imports are immutable historical snapshots. A later report containing the same phone number with
a different status creates a new record instead of overwriting the old one, so campaign history is
preserved. Duplicates are counted and flagged, never silently deleted. Every delivery record keeps
its raw source row in `originalRow` and references its source chunk via `chunkId`.
