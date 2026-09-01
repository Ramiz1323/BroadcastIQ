# BroadcastIQ — Broadcast Delivery Intelligence Platform

<p align="center">
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React 18" />
  <img src="https://img.shields.io/badge/Vite-6-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite 6" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS 3" />
  <img src="https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js + Express" />
  <img src="https://img.shields.io/badge/MongoDB-Mongoose-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" />
  <img src="https://img.shields.io/badge/Recharts-Charts-FF6B6B?style=for-the-badge" alt="Recharts" />
  <img src="https://img.shields.io/badge/ExcelJS-Export-217346?style=for-the-badge" alt="ExcelJS" />
</p>

<p align="center">
  <strong>A full-stack broadcast reporting, delivery analytics, filtering, and export platform built around Commun delivery reports.</strong>
</p>

---

## 📑 Table of Contents

- [Overview](#-overview)
- [Core Capabilities](#-core-capabilities)
- [Data Ingestion & Normalization](#-data-ingestion--normalization)
- [System Architecture](#️-system-architecture)
- [Tech Stack](#️-tech-stack)
- [Security & Reliability](#-security--reliability)
- [Engineering Highlights](#-engineering-highlights)
- [Product Experience](#-product-experience)
- [Author](#-author)

---

## 🌟 Overview

Broadcast delivery exports from Commun arrive as raw CSV, XLS, or XLSX files with inconsistent column names, mixed date formats, malformed phone numbers, and no concept of version history. Comparing campaigns, isolating failed recipients, or re-running an analysis weeks later is either manual or simply impossible.

**BroadcastIQ** turns that raw data into a structured, searchable, historically preserved operational system. Reports are ingested, normalized, deduplicated, and stored as immutable snapshots. Every subsequent import expands the dataset rather than overwriting it — so historical campaign states remain intact and auditable while the analytics layer surfaces delivery trends, chunk-level performance, and recipient-level details on demand.

---

## ✨ Core Capabilities

### 📥 Intelligent Report Ingestion

BroadcastIQ treats file import as a first-class workflow, not an afterthought. The import pipeline supports **CSV, XLS, and XLSX** files, enforces a 25 MB per-file limit, and accepts up to ten files per request via drag-and-drop. Before any data is written, the system parses the file and presents a **column-mapping preview** — automatically proposing mappings across a comprehensive alias dictionary that handles dozens of real-world Commun header variations. Users can review or override the mapping before committing. A **SHA-256 file-hash check** runs at preview time to warn against re-importing the same file. Import progress, row-level counts, and any invalid record summaries are returned to the client on completion.

### 🧹 Data Normalization & Integrity

This is where BroadcastIQ does its most significant engineering work. Every row passes through a purpose-built normalization pipeline before touching the database:

- **Phone normalization** strips international prefixes, handles Indian `91`-prefix and `0`-prefix variants, preserves both the original and normalized forms, and validates E.164-range digit lengths.
- **Status normalization** maps dozens of raw string variants (`"delivery"`, `"seen"`, `"queued"`, `"undelivered"`, etc.) onto seven canonical statuses.
- **Date/time parsing** handles Excel serial numbers, `dd/mm/yyyy`, `dd-mm-yyyy`, 12-hour AM/PM, and ISO strings — all in a single defensive parser.
- **Row fingerprinting** generates a SHA-1 hash per record from chunk code, phone, broadcast, template, timestamp, and status. Duplicate rows within or across files are flagged and counted rather than silently discarded, and the original source row is preserved verbatim in `originalRow`.

**Imports behave as immutable historical snapshots.** A later report for the same campaign does not overwrite earlier delivery records — it appends. Campaign history is fully preserved, duplicates are surfaced transparently, and any point-in-time analysis remains reproducible.

### 📊 Campaign & Delivery Analytics

The dashboard aggregates delivery data through MongoDB pipelines and presents results through Recharts:

- **KPI stat cards** — total chunks, total recipients, and per-status delivery counts (Delivered, Read, Sent, Replied, Pending, Failed, Unknown).
- **Delivery status donut chart** — distribution across all normalized statuses for the selected time window.
- **Chunk performance bar chart** — side-by-side total, delivered, and failed counts per import batch.
- **Date presets** — Today, Yesterday, Last 7 Days, Last 30 Days, Custom Range — applied server-side.

Broadcast and chunk detail views provide per-broadcast results breakdowns and recipient-level delivery inspection with server-side pagination.

### 🔎 Advanced Filtering & Search

A multi-dimensional filter bar operates across chunks, broadcasts, templates, statuses, categories, delivery date ranges, upload date ranges, phone numbers, error strings, and free-text search. These filters are not cosmetic UI overlays — they are translated into **parameterized MongoDB queries** by a dedicated query builder, with regex sanitization, ObjectId validation, and safe field whitelisting. The same filter state powers the delivery table, aggregate summaries, and backend exports with identical logic.

### 📑 Reusable Reporting & Export

Saved reports store a named filter configuration — any combination of the multi-dimensional filter parameters — so recurring operational queries can be executed in one click. Each saved report tracks its last run time and result count. When executed, the filter is replayed against the live database. Reports can be exported as:

- **CSV** — streamed directly from the backend with proper RFC-4180 escaping.
- **Multi-sheet Excel** — delivered via ExcelJS with a **Filtered Results** sheet, a **Summary** sheet (per-status counts with percentage columns), and a **Chunks** sheet listing every import batch referenced by the filter.

---

## 🏗️ Data Ingestion & Normalization

**Raw File → Parse (csv-parse / XLSX) → Column Auto-Detection → Normalization Pipeline → Validation → Row Fingerprinting → Duplicate Flagging → Batch Insertion (500/batch) → Chunk Record Update → Analytics Ready**

Rows that fail phone validation are collected into an invalid-records array, returned to the caller, and never silently dropped. Batch insertion uses MongoDB `insertMany` with `ordered: false` for resilience. After insertion, detected broadcast and template names are back-propagated to any unresolved delivery records in the same chunk.

---

## 🏗️ System Architecture

| Layer | Responsibility | Technologies |
|---|---|---|
| **Presentation** | Dashboard, filtering, charts, tables, responsive workflows | React 18, Vite 6, Tailwind CSS 3, Recharts |
| **Client Services** | Backend communication and query construction | Axios |
| **API Layer** | Chunk, delivery, broadcast, report, and dashboard operations | Node.js, Express |
| **Processing Layer** | Parsing, normalization, duplicate detection, import/export | csv-parse, XLSX, ExcelJS |
| **Data Layer** | Persistent chunk, delivery, and report data with indexed querying | MongoDB, Mongoose |
| **Security / Middleware** | Request protection, rate limiting, compression, CORS, headers | Helmet, express-rate-limit, CORS, compression |

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | React 18 | Interactive dashboard UI |
| Build Tool | Vite 6 | Frontend build tooling and dev server |
| Styling | Tailwind CSS 3 | Responsive UI system and dark mode |
| Visualization | Recharts | Donut charts and bar charts |
| Icons | Lucide React | Consistent icon system |
| HTTP Client | Axios | Frontend API communication |
| Backend | Node.js + Express | Full-stack API layer |
| Database | MongoDB | Persistent reporting and campaign data |
| ODM | Mongoose | Schema modeling, indexing, querying |
| File Parsing | csv-parse + XLSX | CSV and Excel report ingestion |
| Export | ExcelJS | Structured multi-sheet Excel generation |
| Uploads | Multer | Multipart file ingestion with type and size guards |
| Security | Helmet + express-rate-limit | HTTP header hardening and request throttling |
| Compression | compression | Response payload compression |
| Logging | Morgan | HTTP request logging |

---

## 🔐 Security & Reliability

- **Helmet** sets production-safe HTTP security headers on every response.
- **Rate limiting** caps API requests at 300 per minute per IP using standard RFC headers.
- **CORS** is configured against an explicit allowlist — arbitrary origins are rejected at the middleware level.
- **Upload guards** enforce a 25 MB file size limit and file-type validation before any buffer reaches the parser.
- **Centralized error handling** provides consistent JSON error responses and prevents stack trace exposure.
- **Input normalization** strips unsafe characters from search and phone inputs before regex construction; query parameters are validated against an explicit allowlist before reaching MongoDB.
- **MongoDB access is backend-only** — no database credentials or direct queries are exposed to the browser.
- **Compound indexes** on `chunkId + status`, `broadcastName + status`, and `deliveryDateTime` keep filtered queries efficient as the delivery collection scales.

---

## 💡 Engineering Highlights

**SHA-256 file-hash duplicate detection.** Before any rows are written, the file buffer is hashed and checked against existing chunks. Re-importing the same file is blocked by default, with an explicit override flag available.

**Alias-driven column auto-detection.** The mapping system resolves over 30 common Commun column header variants — `"Sent to"`, `"msisdn"`, `"recipient"`, `"delivery date"`, `"timestamp"` and more — to internal field names without user intervention. Manual override is always available.

**Row-level fingerprinting with immutable history.** Each delivery record carries a SHA-1 fingerprint. Duplicate rows are flagged, not deleted, and the original source data is stored verbatim. Historical campaign snapshots are never overwritten by newer imports.

**Unified query builder for filtering and exports.** A single `buildDeliveryFilter` function translates all multi-dimensional filter parameters into a safe MongoDB query. The same function powers the paginated delivery table, aggregate summaries, CSV export, and Excel generation — no logic duplication, no filter drift between UI and export.

**Batch insertion at 500 rows per flush.** Import processing walks rows sequentially through the normalization pipeline and inserts in configurable batches, preventing memory exhaustion on large files while tracking progress incrementally.

**Backend-generated, filter-aware exports.** CSV and Excel exports are generated entirely server-side using the same filter logic as the UI. Excel exports include three sheets — results, status summary with percentages, and chunk metadata — using ExcelJS with frozen header rows, auto-filters, and formatted number columns.

**Saved report workflows.** Filter configurations can be persisted as named saved reports, re-executed against live data, and exported on demand. Last-run timestamp and result count are tracked per report.

---

## 🎨 Product Experience

BroadcastIQ is not just a data pipeline with a thin interface. The frontend is built with product-quality attention to interaction detail:

- **Light and dark mode** persisted across sessions via `localStorage` and a custom `useTheme` hook.
- **Responsive layout** with a collapsible sidebar overlay on mobile and a fixed sidebar on desktop.
- **Skeleton loading states** for stat cards, charts, and tables — no jarring blank flashes.
- **Empty states** with contextual calls to action on every data surface.
- **Toast notifications** for import feedback, export triggers, and error messaging.
- **Confirmation dialogs** before destructive operations such as chunk deletion.
- **Live database health indicator** in the sidebar, polled every 30 seconds.
- **Date preset toolbar** on the dashboard for instant time-window switching without manual date input.

---

## 👨‍💻 Author

Built by **Raza** — a full-stack developer focused on data-intensive web applications, clean backend architecture, and product-quality frontend engineering.

> *BroadcastIQ demonstrates end-to-end ownership of a real operational problem: from raw file ingestion through normalization, historical data modeling, multi-dimensional querying, and structured export — across a modern MERN stack.*
