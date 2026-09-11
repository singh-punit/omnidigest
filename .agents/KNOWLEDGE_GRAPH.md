# OmniDigest Knowledge Graph

## Architecture
- **Central Hub**: OptiPlex Server (192.168.0.65) `/srv/omnidigest`
- **Container**: `omnidigest`, port mapped `8100` -> `8080`.
- **Runtime**: Python 3.12, FastAPI, Uvicorn, Edge Neural TTS, Qwen 2.5 (1.5B).
- **Core Components**:
  - `app/main.py`: FastAPI application, endpoints, autonomous background scheduler.
  - `app/crawler.py`: RSS feed parsing and aggregation.
  - `app/synthesizer.py`: SLM synthesis, prompt handling, robust JSON repair mechanism for Qwen outputs.
  - `app/tts.py`: Edge Neural TTS engine wrapper for generating audio briefings.
  - `app/static/`: Frontend SPA (`index.html`, `app.js`, `style.css`), featuring Dual-Theme (Porcelain/Obsidian), Interactive Audio Player, On-Demand Intelligence Studio.

## Data & Storage
- **App Data Directory**: `/app/data` (fallback `./data`). Contains `digests.json` and `active_feeds.json`.
- **Podcasts Audio**: `/app/data/podcasts`.

## Key Behaviors & Upgrades (v2.5.0)
- **Background Scheduler**: Lifespan background worker synthesizes morning briefing daily.
- **SLM Fallback Parsing**: `repair_json_string` and `extract_fields_fallback` handle malformed LLM responses to prevent UI leakage.
- **High-Performance JSON Engine**: Rust-based `orjson` with automatic graceful fallback shim to standard `json` for zero-overhead serialization across environments.
- **Storage Hygiene & Audio Pruning**: Background `disk_flusher_loop` periodically purges orphaned `.mp3` files in `/app/data/podcasts` matching removed unpinned digests, capping container disk growth.
- **Progressive Web App (PWA)**: Standalone `manifest.json` and theme-color meta tags enable zero-wrapper native home-screen installation on iOS, Android, and macOS.
- **MediaSession API**: Integrates with system lock screens, watch, and hardware media keys (Play, Pause, Next, Previous, Seek).
- **Command Palette (Cmd+K / Ctrl+K)**: Spotlight overlay for zero-mouse command execution, quick topic filtering, and historical briefing jumps.
- **UI Strictness**: Dual-theme mandatory (Porcelain / Obsidian), robot emoji strictly banned, strict cache-busting (?v=2.5.0).

