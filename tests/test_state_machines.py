import os
import pytest
from fastapi.testclient import TestClient

from app.main import app, pipeline_state, scheduler_state, set_pipeline_state, pipeline_lock
from app.synthesizer import repair_json_string, extract_fields_fallback, clean_synthesized_text

client = TestClient(app)

def test_pipeline_state_machine_initial():
    assert pipeline_state["status"] == "idle"
    assert pipeline_state["is_busy"] is False
    assert pipeline_state["progress_percent"] == 0

def test_pipeline_state_transitions():
    set_pipeline_state("crawling", "Crawling feeds", 18, task_id="task_123")
    assert pipeline_state["status"] == "crawling"
    assert pipeline_state["is_busy"] is True
    assert pipeline_state["progress_percent"] == 18
    assert pipeline_state["current_task_id"] == "task_123"
    assert pipeline_state["started_at"] is not None

    set_pipeline_state("synthesizing", "Synthesizing briefing", 48, task_id="task_123")
    assert pipeline_state["status"] == "synthesizing"
    assert pipeline_state["is_busy"] is True
    assert pipeline_state["progress_percent"] == 48

    set_pipeline_state("generating_tts", "Generating TTS", 82, task_id="task_123")
    assert pipeline_state["status"] == "generating_tts"
    assert pipeline_state["is_busy"] is True

    set_pipeline_state("completed", "Completed", 100, task_id="task_123")
    assert pipeline_state["status"] == "completed"
    assert pipeline_state["is_busy"] is False
    assert pipeline_state["completed_at"] is not None

    # Reset back to idle for subsequent tests
    set_pipeline_state("idle", "System idle", 0)
    assert pipeline_state["status"] == "idle"
    assert pipeline_state["is_busy"] is False

def test_health_endpoint_exposes_fsm():
    resp = client.get("/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"
    assert "pipeline" in data
    assert "scheduler" in data
    assert data["pipeline"]["status"] in ("idle", "crawling", "synthesizing", "generating_tts", "completed", "error")

def test_api_info_exposes_fsm():
    resp = client.get("/api/info")
    assert resp.status_code == 200
    data = resp.json()
    assert "pipeline" in data
    assert "scheduler" in data

def test_api_pipeline_status():
    resp = client.get("/api/pipeline/status")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "success"
    assert "pipeline" in data
    assert "scheduler" in data

def test_pipeline_concurrency_lock():
    import asyncio
    # Manually acquire the pipeline lock
    async def lock_test():
        await pipeline_lock.acquire()
        try:
            resp = client.post("/api/digest/generate", json={"custom_prompt": "test"})
            assert resp.status_code == 409
            data = resp.json()
            assert "already actively in progress" in data["detail"]
        finally:
            pipeline_lock.release()

    asyncio.run(lock_test())

def test_feed_test_response_compatibility():
    # Testing an empty url should return 400
    resp = client.post("/api/feeds/test", json={"url": ""})
    assert resp.status_code == 400

    # Testing an invalid domain returns error with ok=False
    resp = client.post("/api/feeds/test", json={"url": "http://invalid-non-existent-domain.internal/rss"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["ok"] is False
    assert data["status"] == "error"

def test_synthesizer_repair_json():
    # Test trailing comma repair
    broken_json = '{"highlights": ["bullet 1", "bullet 2",], "markdown_report": "report", "audio_script": "script",}'
    repaired = repair_json_string(broken_json)
    assert ",]" not in repaired
    assert ",}" not in repaired

    # Test raw stringified JSON extraction via clean_synthesized_text
    raw_json = '{\n  "highlights": ["h1"],\n  "markdown_report": "## Clean Headline\\nStrategic takeaway",\n  "audio_script": "script"\n}'
    cleaned = clean_synthesized_text(raw_json)
    assert "Clean Headline" in cleaned
    assert not cleaned.startswith("{")

def test_frontend_fsm_static_invariants():
    app_js_path = os.path.join(os.path.dirname(__file__), "..", "app", "static", "app.js")
    with open(app_js_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Invariants for FSM definitions
    assert "FSM_STATES" in content
    assert "AudioPlayerMachine" in content
    assert "PipelineMachine" in content
    assert "OverlayMachine" in content
    assert "TabsMachine" in content
    assert "LiveWireMachine" in content
    assert "ThemeMachine" in content
    assert "window.OmniDigest" in content
    assert "OmniDispatcher" in content

    # DOM reflection attributes
    assert "data-player-state" in content
    assert "data-pipeline-state" in content
    assert "data-active-overlay" in content
    assert "data-active-tab" in content
    assert "data-live-wire-state" in content
    assert "data-theme" in content

    # Anti-slop branding requirement
    assert "✦ Qwen 2.5 (1.5B) · Local" in content
    assert "ai-pulse-dot" in content
