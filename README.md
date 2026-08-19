# OmniDigest 🎙️
**Autonomous Homelab Intelligence & Neural Audio Briefing Engine**

OmniDigest autonomously crawls top tech, AI research (arXiv), cyber security, finance, and infrastructure feeds, synthesizes multi-source news into an executive briefing using local SLMs (`Qwen 2.5 1.5B`), generates broadcast-grade spoken audio podcasts using Edge Neural TTS, and delivers instant audio links straight to your phone via Ntfy.

---

## ⚡ Key Capabilities (v2.2.0)

- **⏰ Autonomous In-App Scheduler**: Automatically crawls and synthesizes daily morning briefings at 07:00 AM (AEST), with automatic catch-up on container startup.
- **🎨 Editorial UX & Porcelain Theme**: Human-crafted editorial intelligence interface inspired by Substack, Linear, Stripe Press, and Apple Podcasts. Features a clean dual-theme system (**Porcelain Light Mode** default & **Obsidian Dark Mode**).
- **🌐 Balanced Multi-Source Ingestion**: Interleaved round-robin ranking across 7 top feeds (*Hacker News, ArXiv AI, TechCrunch, CoinDesk Markets, Ars Technica, BleepingComputer, Wired*).
- **📱 Adaptive Bounds-Clamped Waveform Player**: Responsive audio scrubber that dynamically scales across desktop, tablet, and mobile screens without overflow.
- **🧠 Local SLM Resilience**: Built-in JSON repair algorithms, token-limit recovery, and fallback parsers preventing raw JSON leakage.
- **🔔 Instant Phone Alerts**: Push notifications sent via Ntfy (`homelab-alerts`) with one-tap streaming links.

---

## 🚀 Quick Start

```bash
docker compose up -d --build
```

Access the dashboard at `http://192.168.0.65:8099` (or `http://localhost:8080`).

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
