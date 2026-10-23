# OmniDigest 🎙️
**Autonomous Homelab Intelligence & Neural Audio Briefing Engine**

OmniDigest autonomously crawls top tech, AI research (arXiv), cyber security, finance, and infrastructure feeds, synthesizes multi-source news into an executive briefing using local SLMs (`Qwen 2.5 1.5B`), generates broadcast-grade spoken audio podcasts using Edge Neural TTS, and delivers instant audio links straight to your phone via Ntfy.

---

## ⚡ Key Capabilities (v2.5.0)

- **⚡ High-Throughput `orjson` Engine**: Ultra-fast Rust-based JSON serialization with automatic fallback shim for sub-millisecond API responses and minimal RAM footprint.
- **🧹 Automated Audio Hygiene**: In-process garbage collector continuously purges orphaned `.mp3` podcasts when unpinned briefings are pruned, preventing disk volume bloat.
- **📱 Progressive Web App (PWA)**: Standalone native app installation on iOS, Android, and macOS with adaptive light/dark theme colors.
- **🎧 Lock Screen Hardware Audio Control**: Native `navigator.mediaSession` integration with custom artwork, playback metadata, track skipping, and scrubbing.
- **⌘ Spotlight Command Palette**: Instant <kbd>⌘K</kbd> / <kbd>Ctrl+K</kbd> shortcut search for zero-mouse command execution, quick topic filtering, and historical briefing jumps.
- **⏰ Autonomous In-App Scheduler**: Automatically crawls and synthesizes daily morning briefings at 07:00 AM (AEST), with automatic catch-up on container startup.
- **🎨 Editorial UX & Dual Theme**: Human-crafted editorial intelligence interface inspired by Substack, Linear, Stripe Press, and Apple Podcasts. Features **Porcelain Light** and **Obsidian Dark**.
- **🌐 Balanced Multi-Source Ingestion**: Interleaved round-robin ranking across 7 top feeds (*Hacker News, ArXiv AI, TechCrunch, CoinDesk Markets, Ars Technica, BleepingComputer, Wired*).
- **📱 Adaptive Bounds-Clamped Waveform Player**: Responsive audio visualizer that dynamically scales across desktop and mobile screens.
- **🧠 Local SLM Resilience**: Built-in JSON repair algorithms, token-limit recovery, and fallback parsers preventing raw JSON leakage.
- **🔔 Instant Phone Alerts**: Push notifications sent via Ntfy (`homelab-alerts`) with one-tap streaming links.

---

## 🚀 Quick Start

```bash
docker compose up -d --build
```

Access the dashboard via the homelab Sleepproxy at `http://192.168.0.65:20203` (or directly via bypass port `http://192.168.0.65:20253`).

---

## 📡 API Endpoints

- `GET /health` — Service health, version, and autonomous scheduler status.
- `GET /api/digest/latest` — Latest synthesized intelligence edition.
- `GET /api/digest/history` — Archived editions with star/pin protection.
- `POST /api/digest/generate` — On-demand synthesis with custom topic prompt, voice, and speed.
- `GET /api/news/live` — Real-time live RSS feed wire.
- `GET /api/scheduler/status` — Background scheduler health and next target time.

---

## 📄 Documentation

- [AGENTS.md](AGENTS.md) — Homelab deployment contract & architectural rules.
- [DECISIONS.md](DECISIONS.md) — Architecture & design decision records (ADRs).
