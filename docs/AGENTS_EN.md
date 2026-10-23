<!-- TOKEN BUDGET: 6KB max (~1500 tokens). Archive reference material to AGENTS_ARCHIVE.md -->
> **Reference**: Architecture in KNOWLEDGE_GRAPH.md. Full archive in AGENTS_ARCHIVE.md.

## Anti-Bloat Protocol (Mandatory)
- This file MUST stay under **6KB** (~1500 tokens). Run `audit-agent-tokens.py` to check.
- **Allowed here**: Behavioral rules, mandatory constraints, deployment guards.
- **NOT allowed**: Port tables, architecture specs, release logs, UI laws, historical notes.
- **Over budget?** Archive to `AGENTS_ARCHIVE.md`, or create topic-specific files in `.agents/`.

## Mandatory Rules & Deployment Guards

- **Port Mapping (CRITICAL)**: `docker-compose.yml` MUST ONLY bind to the direct bypass port (`20253:8080`). NEVER map `20203:8080` directly in the compose file.
- **Monitoring**: Uptime Kuma Health Endpoint and Ntfy Push Alerts (`homelab-alerts` topic) are MANDATORY.
- **Local SLM Resilient Parsing Engine**: ALWAYS sanitize and repair SLM outputs using `repair_json_string`, `extract_fields_fallback`, and `clean_synthesized_text` to prevent raw JSON leaking into the UI. Use `safeUnpackDigestContent(rawText)` defensively on the client.
- **Spotlight Command Palette (MANDATORY)**: Pressing <kbd>⌘K</kbd> / <kbd>Ctrl+K</kbd> or clicking `#btn-cmd-k` MUST open a spotlight search overlay.
- **Hardware & Lock Screen Audio Control (MANDATORY)**: MUST synchronize `navigator.mediaSession` with playback.
- **Clickable Brand Logo Home Return (MANDATORY)**: Clicking `#brand-home-link` resets the view, clears inputs, and smoothly scrolls to `top: 0`.
- **Editorial Dual-Theme System (MANDATORY)**: Porcelain (Light Mode) and Obsidian (Dark Mode) MUST be supported and toggled via `#btn-theme-toggle` / <kbd>T</kbd>.
- **Local AI Attribution, Living Status Dot & Robot Icon Ban (MANDATORY)**:
  - Robot emojis/icons (`🤖`) are STRICTLY BANNED.
  - MUST display `✦ Qwen 2.5 (1.5B) · Local` with clean spark standard.
  - AI attribution badges MUST include an animated pulsing emerald status indicator (`.ai-pulse-dot`).
- **Static Asset Cache-Busting & Zero-Stale Invariant (MANDATORY)**: All static asset references (`app.js`, `style.css`) MUST include version query parameters. Code changes MUST be synced directly to `/srv/omnidigest/` on `192.168.0.65` with container restart.
- **ESC Key Handling (MANDATORY)**: Pressing ESC MUST close all modal overlays and side drawers.
