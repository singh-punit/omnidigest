# Agent Rules — OmniDigest

## 🎯 Architecture & Central Repository Relationship

OmniDigest is a standalone autonomous intelligence crawler, local SLM synthesizer, and neural audio briefing engine deployed as part of the **AAMP Solutions Homelab ecosystem**.

- **Central Homelab Orchestrator**: [`singh-punit/optiplex-homelab`](https://github.com/singh-punit/optiplex-homelab)
- **Central Deployment Contract**: [`HUB_DEPLOYMENT_GUIDE.md`](https://github.com/singh-punit/optiplex-homelab/blob/master/HUB_DEPLOYMENT_GUIDE.md)
- **Live Host**: OptiPlex Server (`192.168.0.65` / Tailscale `100.69.50.66`)
- **Container Path on Hub**: `/srv/omnidigest`
- **Container Name**: `omnidigest`
- **Port Mapping**: Public `8100` $\rightarrow$ Container `8080`
- **Docker Network**: `punit_proxy-net`
- **Resource Constraints**: `mem_limit: 512m`, `cpus: 1.0`
- **Runtime Stack**: Python 3.12, FastAPI, Uvicorn, Edge Neural TTS, Qwen 2.5 (1.5B) via llama-server (`http://llama-server-qwen:8080/v1`)
- **Timezone**: `TZ=Australia/Sydney` (ensures accurate daily morning briefing triggers)

---

## 🚀 Deployment Workflow

To deploy changes to OmniDigest on the live OptiPlex server:

```bash
# Sync application files to hub
rsync -av --exclude="data" --exclude="__pycache__" ./ punit@192.168.0.65:/srv/omnidigest/

# Build and start container
ssh punit@192.168.0.65 "cd /srv/omnidigest && docker compose up -d --build"
```

---

## ⏰ Autonomous Background Scheduler

OmniDigest runs an internal async lifespan background worker (`autonomous_scheduler_loop` in `app/main.py`):

1. **Startup Catch-Up**: On container startup, it inspects `digests.json`. If no briefing has been generated for today's local date (`YYYYMMDD`), it immediately triggers an autonomous morning briefing.
2. **Scheduled Morning Trigger**: Daily at `SCHEDULE_HOUR:SCHEDULE_MINUTE` (default: `07:00 AM`), it automatically crawls all 7 sources, synthesizes the briefing via Qwen 2.5, renders the audio via Edge TTS, stores the edition, and dispatches an Ntfy notification.
3. **Status Endpoint**: `GET /api/scheduler/status` exposes real-time scheduler state and next run target.

---

## 📊 Monitoring & Alerts (Mandatory)

- **Uptime Kuma Health Endpoint**: `http://192.168.0.65:8100/health` (includes status, version, model, and scheduler state)
- **Ntfy Push Alerts**: Linked to `http://ntfy:80` topic `homelab-alerts` with ASCII-sanitized headers.
- **Status Check**:
  ```bash
  curl -s http://192.168.0.65:8100/health
  ```

---

## 📁 Storage Paths on OptiPlex & Local Resolution

- **Data & History Directory**: `/srv/omnidigest/data` (container: `/app/data`, fallback to `./data` in local dev)
- **Podcasts Audio Storage**: `/srv/omnidigest/data/podcasts` (container: `/app/data/podcasts`)
- **Dynamic Path Resolution**: `default_data_dir = "/app/data" if os.path.exists("/app") else os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data")` ensures zero breakage across local testing and Docker runtime.

---

## 🧠 Local SLM Resilient Parsing Engine (`app/synthesizer.py`)

Small language models (e.g. Qwen 2.5 1.5B) occasionally produce malformed JSON syntax. To prevent raw JSON leaking into the UI:

- **`repair_json_string(text)`**:
  - Automatically fixes missing commas between adjacent string literals using lookbehind regex `(?<=[^\\]")\s+(?=")`.
  - Fixes missing commas between array brackets `]` or object braces `}` and subsequent keys.
  - Strips markdown fences (````json ... ````) and trailing commas before `}` and `]`.
- **`extract_fields_fallback(raw_text)`**:
  - Secondary regex-based field extractor that recovers `highlights`, `markdown_report`, and `audio_script` if `json.loads` fails completely or token output was truncated.
- **`clean_synthesized_text(text)`**:
  - Sanitizes markdown outputs so stringified JSON envelopes never leak to the UI.
- **Client-Side Safe Unpacking**: `safeUnpackDigestContent(rawText)` in `app.js` defensively unpacks any historical or cached digests.
- **Token Limit**: Configured to `max_tokens: 1400` to prevent mid-string truncation.

---

## 📡 API Endpoints & Capabilities

| Endpoint | Method | Description |
|---|---|---|
| `/health` | `GET` | Health check returning status, service name, version (`2.2.0`), LLM endpoint, and scheduler state. |
| `/api/info` | `GET` | Service capabilities, model name, and TTS engine metadata. |
| `/api/scheduler/status` | `GET` | Returns scheduler running status, last run date, and next trigger time. |
| `/api/news/live` | `GET` | **On-demand live crawler**. Fetches real-time RSS articles across all feeds immediately with `max_items` query param. |
| `/api/digest/latest` | `GET` | Returns latest generated briefing edition. |
| `/api/digest/history` | `GET` | Returns archived briefings array (newest first). |
| `/api/digest/generate` | `POST` | Triggers on-demand synthesis with `custom_prompt`, `voice`, `send_ntfy`, `category_filter`, and `speed_rate` (`-15%`, `+0%`, `+10%`, `+20%`). |
| `/api/digest/{id}/pin` | `POST` | Toggles star/pin status on a briefing. Pinned items are protected from automatic history pruning. |
| `/api/digest/{id}` | `DELETE` | Permanently deletes a briefing edition from history. |
| `/api/feeds` | `GET` | Returns active RSS feed list. |
| `/api/feeds` | `POST` | Updates and persists active RSS feeds. |
| `/api/feeds/test` | `POST` | Validates an RSS feed URL on the fly, returning feed title and entry count. |

---

## 🎨 UI Guidelines & Universal UX Contract

- **Clickable Brand Logo Home Return (MANDATORY)**: Clicking `#brand-home-link` resets the view to the latest briefing, clears search/focus inputs, and smoothly scrolls to `top: 0`.
- **Editorial Dual-Theme System (MANDATORY)**:
  - Default: **Porcelain (Light Mode)** — Crisp editorial off-white (`#f8fafc`), deep slate typography (`#0f172a`), subtle slate borders (`#e2e8f0`), and soft shadows.
  - Secondary: **Obsidian (Dark Mode)** — Deep charcoal/slate (`#090d16`), silver text (`#f8fafc`), and sky blue accents.
  - Header Sun/Moon icon toggle button (`#btn-theme-toggle`, shortcut <kbd>T</kbd>) with persistent `localStorage` saving.
- **Local AI Attribution, Living Status Dot & Robot Icon Ban (MANDATORY)**:
  - Display `✦ Qwen 2.5 (1.5B) · Local` with clean spark standard across header and synthesized digests.
  - Robot emojis/icons (`🤖`) are strictly banned across all titles, badges, and documentation.
  - All AI attribution badges must include an animated pulsing emerald status indicator (`.ai-pulse-dot`) and glassmorphic pill background.
- **Static Asset Cache-Busting & Zero-Stale Invariant (MANDATORY)**:
  - All static asset references (`app.js`, `style.css`) in HTML must include version query parameters (`?v=...`), and backend servers must send `Cache-Control: no-cache, no-store, must-revalidate, max-age=0`.
  - Code changes to containerized apps must be synced directly to `/srv/omnidigest/` on `192.168.0.65` with container restart in addition to git commits.
- **ESC Key Handling (MANDATORY)**: Pressing the ESC key must close all modal overlays and side drawers.
- **On-Demand Intelligence Studio Bar**:
  - Custom topic prompt input with instant trigger (<kbd>Enter</kbd> or Go button).
  - Quick Focus preset chips (*🔥 All Intel*, *✦ AI & LLMs*, *💻 Dev & Infra*, *📈 Markets*, *🛡️ Security*, *🚀 ArXiv Research*).
  - Collapsible speech settings for Neural Voice (`Christopher`, `Guy`, `Jenny`, `Sonia`) and Speed Rate (`-15%`, `+0%`, `+10%`, `+20%`).
  - Real-time multi-stage generation progress bar (*1/3 Fetching Feeds* $\rightarrow$ *2/3 SLM Synthesizing* $\rightarrow$ *3/3 Neural Audio Rendering* $\rightarrow$ *Completed*).
- **Recent Briefings Carousel Strip**:
  - Horizontal scrolling carousel of past briefings with high-contrast chevrons (`#btn-strip-scroll-left`, `#btn-strip-scroll-right`).
  - Mini thumbnail artwork, badge indicators (⭐ pinned / edition rank, source count), and animated equalizer bars on the currently playing edition.
- **Interactive Audio Player & Waveform**:
  - High-contrast adaptive waveform visualizer (`#waveform-canvas`) with dynamic bar count scaling and strict boundary clamping on mobile devices.
  - Transport controls: Previous edition (<kbd>P</kbd>), Play/Pause (<kbd>Space</kbd>), Next edition (<kbd>N</kbd>).
  - Speed toggle chip (`0.8x`, `1.0x`, `1.25x`, `1.5x`, `2.0x`).
  - Volume slider and mute toggle (<kbd>M</kbd>).
  - Action ribbon: Copy Markdown Memo, Download MP3, Pin/Star, Phone Streaming QR code modal, and Reset.
- **Content Tabs**:
  - **Strategic Memo Tab**: Editorial markdown rendering with generous 1.75 line-height, bullet points, callout quotes, and copy button.
  - **Broadcast Script Tab**: Teleprompter layout with word count and duration estimate.
  - **Source Feed Wire Tab**: Catalog of contributing source stories with direct external links.
- **Live News Stream Modal**: Real-time RSS story browser with category filtering (*All*, *Tech*, *AI & ML*, *Markets*, *Security*), keyword search, and 1-click *"Synthesize from Wire"* button.
- **Slide-Over Briefing Archive Drawer**: Paginated (10 per page), searchable archive list with star/pin and delete actions.
