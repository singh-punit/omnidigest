<!-- Architecture index. Read on-demand, not auto-loaded. -->
## Core Architecture
- **Project**: OmniDigest
- **Tech Stack**: Python 3.12, FastAPI, Uvicorn, Edge Neural TTS, Qwen 2.5 (1.5B) [Local SLM]
- **Port Mapping**: `20253:8080` (Direct bypass) | Traefik routing: `20203`
## Key Paths & Components
- **Backend API**: `app/main.py` (FastAPI, Pipeline State Machine, Scheduler FSM, Disk Flusher)
- **Local SLM Synthesizer**: `app/synthesizer.py` (Resilient JSON repair, fallback extractor, sanitization)
- **Audio TTS**: `app/tts.py` (Edge Neural TTS `en-US-ChristopherNeural`)
- **RSS Crawler**: `app/crawler.py` (Multi-source async RSS ingest & round-robin deduplication)
- **Frontend App**: `app/static/app.js` (Unified Explicit State Architecture FSM, WebAudio waveform, Cmd+K spotlight, MediaSession)
- **Frontend Presentation**: `app/static/index.html`, `app/static/style.css` (Porcelain/Obsidian dual theme, Anti-Slop 120Hz)
- **Tests**: `tests/test_state_machines.py`
## State Machines (UESA Architecture)
- **AudioPlayerMachine**: `empty` -> `loading` -> `ready` <-> `playing` <-> `paused` -> `buffering` | `error`
- **PipelineMachine**: `idle` -> `crawling` -> `synthesizing` -> `generating_tts` -> `ready` | `error` (concurrency locked via `asyncio.Lock`)
- **OverlayMachine**: `none` <-> `cmd-k` | `live-wire` | `feeds` | `archive` | `qr` (strict mutual exclusivity)
- **TabsMachine**: `markdown` | `transcript` | `sources`
- **LiveWireMachine**: `idle` -> `loading` -> `populated` | `empty` | `error`
- **SchedulerMachine**: `initializing` -> `idle` <-> `running` -> `completed` | `error`
## Key Endpoints
- `GET /health`: Uptime Kuma health & full pipeline/scheduler state machine payload
- `GET /api/info`: System info & model metadata
- `GET /api/pipeline/status`: Real-time synthesis pipeline FSM monitor
- `GET /api/scheduler/status`: Scheduler execution target and status
- `POST /api/digest/generate`: Triggers pipeline (HTTP 409 guarded against concurrency)
- `POST /api/feeds/test`: Tests RSS feed connectivity (`ok: bool`, `status: str`)
