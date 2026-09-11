# Bug Tracker & Verification Checklist — OmniDigest

This document is the **single source of truth** for all known issues, fixes, and verification steps in OmniDigest.

---

## Active & Resolved Issues

| ID | Severity | Component | Problem | Remediation | Verification | Status |
|---|---|---|---|---|---|---|
| BUG-OD-001 | Low | TTS | Edge-TTS network timeout on slow feeds | Added timeout handler and fallback text brief | Unit test `app/tts.py` | Resolved |
| BUG-OD-002 | High | Synthesizer | Qwen 2.5 SLM malformed JSON (missing commas, trailing commas) caused json.loads failure, dumping raw JSON strings into executive memo | Added regex-based JSON repair heuristic (`repair_json_string`), fallback field extractors (`extract_fields_fallback`), increased max_tokens to 1400, and client-side safe unpacking | Unit test `scratch/test_json.py` across corrupted/truncated samples | Resolved |
| BUG-OD-003 | Medium | Frontend / API | No on-demand news browsing or topic focus; UI lacked visual polish and interactive player controls | Built On-Demand Intelligence Studio, Live News Wire endpoint (`/api/news/live`), animated waveform visualizer, and editorial styling | Browser testing, API verification | Resolved |
| BUG-OD-004 | Medium | Storage / Audio | Unbounded storage accumulation of `.mp3` files in `/app/data/podcasts` when unpinned history was pruned | Implemented background garbage collector in `disk_flusher_loop` to purge unreferenced audio files every 10m | Automated unit test & filesystem validation | Resolved |
| BUG-OD-005 | Low | Serialization | Standard `json` performance bottleneck during large history serialization | Migrated to Rust-powered `orjson` with automatic graceful fallback shim for portable cross-environment execution | Python syntax compilation & serialization test | Resolved |
