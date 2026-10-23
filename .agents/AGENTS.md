# Agent Rules (compact, LLM-facing). EN mirror: docs/AGENTS_EN.md; edit both.
## G0 Central Governance
- **NO LOCAL BUGS.md OR DECISIONS.md.** All bugs, ADRs, and app registrations MUST be tracked centrally using `../optiplex-homelab/dev-registry/registry_cli.py`.
Refs: arch .agents/KNOWLEDGE_GRAPH.md | archive .agents/AGENTS_ARCHIVE.md.

## R1 Budget
<=3.5KB (G7, audit-enforced). Tables/specs/changelogs -> KNOWLEDGE_GRAPH.md or AGENTS_ARCHIVE.md.

## R2 Port Mapping (CRITICAL)
`docker-compose.yml` MUST ONLY bind direct bypass port (`20253:8080`). NEVER map `20203:8080` directly in compose file.

## R3 Monitoring
Uptime Kuma Health Endpoint and Ntfy Push Alerts (`homelab-alerts` topic) MANDATORY.

## R4 Local SLM Resilient Parsing Engine
ALWAYS sanitize and repair SLM outputs with `repair_json_string`, `extract_fields_fallback`, and `clean_synthesized_text`. Use `safeUnpackDigestContent(rawText)` defensively on client.

## R5 UX Invariants
- Spotlight: <kbd>⌘K</kbd>/<kbd>Ctrl+K</kbd> or `#btn-cmd-k` opens spotlight search overlay.
- Audio: synchronize `navigator.mediaSession` with playback.
- Brand Return: clicking `#brand-home-link` resets view, clears inputs, scrolls to `top: 0`.
- Dual-Theme: Porcelain (Light) & Obsidian (Dark) toggled via `#btn-theme-toggle` / <kbd>T</kbd>.
- ESC: closes all modals and drawers.

## R6 Attribution & Cache Invalidation
Robot emojis (`🤖`) STRICTLY BANNED. MUST display `✦ Qwen 2.5 (1.5B) · Local` with animated emerald pulse dot (`.ai-pulse-dot`). All static assets (`app.js`, `style.css`) MUST have version query params. Sync directly to `/srv/omnidigest/` on `192.168.0.65` with restart.
