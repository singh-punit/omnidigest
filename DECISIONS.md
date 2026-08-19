# Architecture & Design Decisions Record (ADR) — OmniDigest

This document records the architectural, algorithmic, and design decisions made for OmniDigest.

---

## 🏛️ ADR 001: Built-in Async Background Scheduler vs. External Cron Container

* **Date**: August 2026
* **Status**: Accepted
* **Context**:
  OmniDigest previously required manual web visits or external API invocations to generate daily briefings. If no user opened the web interface, no morning podcast briefing was generated. An external cron container would add extra resource overhead and dependency coupling.
* **Decision**:
  Implement an in-process, asynchronous lifespan background scheduler loop (`autonomous_scheduler_loop` in `app/main.py`).
  1. **Startup Check**: On FastAPI startup, the scheduler inspects `digests.json`. If today's briefing (`YYYYMMDD`) does not exist, it triggers an autonomous morning briefing.
  2. **Daily Recurring Target**: Runs continuously, checking every 40 seconds. When local time reaches `SCHEDULE_HOUR:SCHEDULE_MINUTE` (07:00 AM AEST / `TZ=Australia/Sydney`), it synthesizes the day's briefing and dispatches push alerts.
* **Consequences**:
  Zero additional container overhead, robust self-healing on container restart, and instant briefing availability.

---

## 🎨 ADR 002: Editorial "Human-Crafted" UX & Dual-Theme System (Porcelain / Obsidian)

* **Date**: August 2026
* **Status**: Accepted
* **Context**:
  Generic AI product designs often rely on tacky neon glows, sci-fi particle animations, and cluttered multi-theme pickers. Users looking for executive news consumption prefer the clean, functional typography and breathing room seen in top editorial products like Linear, Substack, Stripe Press, and Apple Podcasts.
* **Decision**:
  1. **Dual Theme Only**: Remove 5-theme selector. Standardize on **Porcelain (Light Mode - Default)** and **Obsidian (Dark Mode)** with a 1-click Sun/Moon toggle button.
  2. **Porcelain Aesthetic**: Warm paper-white (`#f8fafc` / `#ffffff`), deep slate headings (`#0f172a`), readable paragraph typography (`#334155`), subtle borders (`#e2e8f0`), and soft elevation shadows.
  3. **Typography**: Adopt `Plus Jakarta Sans` for body/headings with 1.75 line-height and `JetBrains Mono` for metadata, timestamps, and badges.
  4. **Performance**: Remove heavy canvas background loops in favor of clean, GPU-accelerated CSS rendering.
* **Consequences**:
  Faster load times, superior readability, and a world-class professional editorial feel.

---

## 🌐 ADR 003: Interleaved Round-Robin Story Ranking & Source Expansion

* **Date**: August 2026
* **Status**: Accepted
* **Context**:
  The crawler previously appended RSS feeds sequentially and took only the first 6 items for the LLM context. As a result, the top feed (Hacker News) crowded out AI research from ArXiv, tech markets from CoinDesk, and cyber security news.
* **Decision**:
  1. **Source Expansion**: Expanded active feeds to 7 sources across AI research (*ArXiv AI*), technology (*Hacker News, TechCrunch, Ars Technica, Wired*), financial markets (*CoinDesk*), and enterprise security (*BleepingComputer*).
  2. **Round-Robin Interleaving**: Take item #1 from each source, then item #2, then item #3, with title deduplication.
  3. **Context Expansion**: Feed top 8-10 balanced articles to Qwen 2.5 (1.5B) with instructions to produce a cross-industry synthesis.
* **Consequences**:
  Every daily briefing now provides balanced, multi-domain intelligence without single-source bias.

---

## 📱 ADR 004: Adaptive Bounds-Clamped Waveform Player for Mobile

* **Date**: August 2026
* **Status**: Accepted
* **Context**:
  Fixed-bar waveform canvases overflow or clip on narrow mobile screens (<380px), degrading the audio scrubber experience.
* **Decision**:
  1. Dynamically calculate bar counts on canvas resize: `totalBars = Math.max(18, Math.min(60, Math.floor(w / minSlot)))`.
  2. Clamp bar widths and gap coordinates so the final bar never exceeds container width (`x + barW <= w`).
  3. Add `overflow: hidden`, `min-width: 0`, and adaptive theme contrast for unplayed waveform bars.
* **Consequences**:
  Flawless scrub and playback interactions across all desktop, tablet, and smartphone viewports.

---

## 🔔 ADR 005: ASCII Header Sanitization for Ntfy Push Notifications

* **Date**: August 2026
* **Status**: Accepted
* **Context**:
  Ntfy alerts containing non-ASCII unicode characters (e.g. emojis in HTTP header `Title`) triggered `ascii codec can't encode characters` exceptions in HTTP/1.1 client libraries.
* **Decision**:
  1. Strip non-ASCII characters from the HTTP `Title` header (`title.encode('ascii', 'ignore').decode('ascii')`).
  2. Move visual emoji representations into the Ntfy `Tags` header (`Tags: "newspaper,headphones,sparkles"`).
* **Consequences**:
  100% reliable Ntfy alert dispatching across all platforms and proxies.
