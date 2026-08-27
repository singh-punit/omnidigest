import os
import json
import time
import logging
import asyncio
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from contextlib import asynccontextmanager
from fastapi import FastAPI, BackgroundTasks, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, JSONResponse, FileResponse
from pydantic import BaseModel
import httpx
import anyio

from app.crawler import crawl_all_feeds, DEFAULT_FEEDS
from app.synthesizer import synthesize_digest, clean_synthesized_text, LLM_MODEL, LLM_API_BASE
from app.tts import generate_audio_podcast

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("omnidigest")

default_data_dir = "/app/data" if os.path.exists("/app") else os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data")
DATA_DIR = os.getenv("DATA_DIR", default_data_dir)
PODCAST_DIR = os.path.join(DATA_DIR, "podcasts")
DIGESTS_FILE = os.path.join(DATA_DIR, "digests.json")
FEEDS_FILE = os.path.join(DATA_DIR, "feeds.json")
NTFY_URL = os.getenv("NTFY_URL", "http://ntfy:80/homelab-alerts")
PUBLIC_BASE_URL = os.getenv("PUBLIC_BASE_URL", "http://192.168.0.65:8099")

# Autonomous Scheduling Configuration
SCHEDULE_HOUR = int(os.getenv("SCHEDULE_HOUR", "7"))
SCHEDULE_MINUTE = int(os.getenv("SCHEDULE_MINUTE", "0"))
AUTO_GENERATE_ON_STARTUP = os.getenv("AUTO_GENERATE_ON_STARTUP", "true").lower() == "true"

scheduler_state = {
    "running": True,
    "last_run_date": None,
    "next_scheduled_target": f"{SCHEDULE_HOUR:02d}:{SCHEDULE_MINUTE:02d}",
    "last_status": "Initializing",
    "scheduler_enabled": True
}

async def autonomous_scheduler_loop():
    """
    Autonomous background scheduler loop for OmniDigest.
    Guarantees that a fresh daily briefing is created every morning,
    and automatically synthesizes on startup if today's edition was missed.
    """
    logger.info(f"Autonomous scheduler loop active. Daily briefing target: {SCHEDULE_HOUR:02d}:{SCHEDULE_MINUTE:02d}")
    
    # Allow system & llama-server to stabilize after container start
    await asyncio.sleep(8)
    
    # Startup check: verify if a digest has been generated for today
    if AUTO_GENERATE_ON_STARTUP:
        today_str = datetime.now().strftime("%Y%m%d")
        history = load_digests()
        has_today = any(d.get("id", "").startswith(today_str) for d in history)
        if not has_today:
            logger.info("No briefing found for today. Executing autonomous morning synthesis...")
            scheduler_state["last_status"] = "Generating startup daily briefing..."
            try:
                await run_digest_pipeline(
                    custom_prompt="Autonomous Morning Intelligence Briefing across all feeds.",
                    send_ntfy=True
                )
                scheduler_state["last_run_date"] = today_str
                scheduler_state["last_status"] = f"Completed morning briefing for {today_str}"
            except Exception as e:
                logger.error(f"Startup daily briefing failed: {e}")
                scheduler_state["last_status"] = f"Startup briefing error: {e}"
        else:
            scheduler_state["last_run_date"] = today_str
            scheduler_state["last_status"] = f"Today's briefing already generated ({today_str})"

    while scheduler_state["running"]:
        now = datetime.now()
        today_str = now.strftime("%Y%m%d")
        
        # Check if it's scheduled daily trigger time
        if now.hour == SCHEDULE_HOUR and now.minute == SCHEDULE_MINUTE and scheduler_state["last_run_date"] != today_str:
            logger.info(f"Triggering scheduled daily morning briefing for {today_str}...")
            scheduler_state["last_status"] = f"Running scheduled daily briefing for {today_str}..."
            try:
                await run_digest_pipeline(
                    custom_prompt="Autonomous Morning Intelligence Briefing across all feeds.",
                    send_ntfy=True
                )
                scheduler_state["last_run_date"] = today_str
                scheduler_state["last_status"] = f"Completed scheduled briefing for {today_str}"
            except Exception as e:
                logger.error(f"Scheduled briefing generation failed: {e}")
                scheduler_state["last_status"] = f"Scheduled run error: {e}"
        
        target = now.replace(hour=SCHEDULE_HOUR, minute=SCHEDULE_MINUTE, second=0, microsecond=0)
        if now >= target:
            target += timedelta(days=1)
        sleep_seconds = (target - now).total_seconds()
        
        try:
            await asyncio.sleep(sleep_seconds)
        except asyncio.CancelledError:
            break

@asynccontextmanager
async def lifespan(app: FastAPI):
    global shared_client, _digests_dirty, _feeds_dirty
    # Cap anyio threads to 2
    anyio.to_thread.current_default_thread_limiter().total_tokens = 2
    shared_client = httpx.AsyncClient(timeout=10.0, limits=httpx.Limits(max_keepalive_connections=20))
    
    # Pre-warm caches
    load_digests()
    load_feeds()
    
    scheduler_task = asyncio.create_task(autonomous_scheduler_loop())
    flusher_task = asyncio.create_task(disk_flusher_loop())
    yield
    scheduler_state["running"] = False
    scheduler_task.cancel()
    flusher_task.cancel()
    
    if _digests_dirty:
        with open(DIGESTS_FILE, "w") as f:
            f.write(json.dumps(_digests_cache, separators=(',', ':')))
    if _feeds_dirty:
        with open(FEEDS_FILE, "w") as f:
            f.write(json.dumps(_feeds_cache, separators=(',', ':')))
            
    if shared_client:
        await shared_client.aclose()

app = FastAPI(
    title="OmniDigest",
    description="Autonomous Homelab Intelligence & Audio Briefing Engine",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs(PODCAST_DIR, exist_ok=True)
os.makedirs(DATA_DIR, exist_ok=True)

# Static directory resolution
STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")

# Mount static and podcasts directories
app.mount("/podcasts", StaticFiles(directory=PODCAST_DIR), name="podcasts")
if os.path.exists(STATIC_DIR):
    app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

class GenerateRequest(BaseModel):
    custom_prompt: Optional[str] = ""
    voice: Optional[str] = "en-US-ChristopherNeural"
    send_ntfy: Optional[bool] = True
    category_filter: Optional[str] = None
    speed_rate: Optional[str] = "+0%"

shared_client: Optional[httpx.AsyncClient] = None
_digests_cache = None
_feeds_cache = None
_digests_dirty = False
_feeds_dirty = False

async def disk_flusher_loop():
    global _digests_dirty, _feeds_dirty
    while scheduler_state["running"]:
        await asyncio.sleep(30)
        if _digests_dirty:
            data = json.dumps(_digests_cache, separators=(',', ':'))
            await anyio.Path(DIGESTS_FILE).write_text(data)
            _digests_dirty = False
        if _feeds_dirty:
            data = json.dumps(_feeds_cache, separators=(',', ':'))
            await anyio.Path(FEEDS_FILE).write_text(data)
            _feeds_dirty = False

def load_digests() -> List[Dict[str, Any]]:
    global _digests_cache
    if _digests_cache is None:
        if os.path.exists(DIGESTS_FILE):
            try:
                with open(DIGESTS_FILE, "r") as f:
                    _digests_cache = json.load(f)
                    for item in _digests_cache:
                        if isinstance(item, dict) and "markdown_report" in item:
                            item["markdown_report"] = clean_synthesized_text(str(item["markdown_report"]))
            except Exception:
                _digests_cache = []
        else:
            _digests_cache = []
    return _digests_cache

def save_digests(digests: List[Dict[str, Any]]):
    global _digests_cache, _digests_dirty
    _digests_cache = digests
    _digests_dirty = True

def load_feeds() -> List[Dict[str, Any]]:
    global _feeds_cache
    if _feeds_cache is None:
        if os.path.exists(FEEDS_FILE):
            try:
                with open(FEEDS_FILE, "r") as f:
                    _feeds_cache = json.load(f)
            except Exception:
                _feeds_cache = DEFAULT_FEEDS
        else:
            _feeds_cache = DEFAULT_FEEDS
    return _feeds_cache

async def send_ntfy_alert(title: str, message: str, audio_url: str):
    if not NTFY_URL:
        return
    try:
        # Sanitize ASCII headers to prevent HTTP header encoding errors
        ascii_title = title.encode("ascii", "ignore").decode("ascii").strip()
        headers = {
            "Title": ascii_title or "OmniDigest Executive Briefing",
            "Priority": "default",
            "Tags": "newspaper,headphones,sparkles",
            "Click": f"{PUBLIC_BASE_URL}",
            "Actions": f"view, Listen to Audio Brief, {audio_url}"
        }
        if shared_client:
            await shared_client.post(NTFY_URL, content=message.encode("utf-8"), headers=headers)
            logger.info("Dispatched Ntfy audio briefing push alert")
    except Exception as e:
        logger.error(f"Failed to send Ntfy notification: {e}")

async def run_digest_pipeline(custom_prompt: str = "", voice: str = "en-US-ChristopherNeural", send_ntfy: bool = True, category_filter: Optional[str] = None, speed_rate: str = "+0%"):
    timestamp_id = datetime.now().strftime("%Y%m%d_%H%M%S")
    display_date = datetime.now().strftime("%A, %B %d, %Y - %I:%M %p")
    logger.info(f"Starting OmniDigest generation [{timestamp_id}] with prompt '{custom_prompt}'...")

    feeds = load_feeds()
    articles = await crawl_all_feeds(feeds, max_items_per_feed=4, client=shared_client)
    
    # Optional category filtering
    if category_filter and category_filter.lower() != "all":
        filtered = [a for a in articles if a.get("category", "").lower() == category_filter.lower()]
        if filtered:
            articles = filtered
            
    logger.info(f"Crawled {len(articles)} articles across {len(feeds)} sources")

    markdown_report, audio_script, highlights = await synthesize_digest(articles, custom_prompt, client=shared_client)
    
    # Generate MP3
    audio_filename = f"digest_{timestamp_id}.mp3"
    audio_url = f"{PUBLIC_BASE_URL}/podcasts/{audio_filename}"
    try:
        await generate_audio_podcast(audio_script, audio_filename, voice=voice, rate=speed_rate)
    except Exception as e:
        logger.error(f"TTS synthesis failed: {e}")
        audio_url = ""

    digest_entry = {
        "id": timestamp_id,
        "date": display_date,
        "model_used": "Qwen 2.5 (1.5B) [Local SLM]",
        "articles_count": len(articles),
        "highlights": highlights,
        "markdown_report": markdown_report,
        "audio_script": audio_script,
        "audio_url": audio_url,
        "audio_file": audio_filename,
        "sources": [{"title": a["title"], "source": a["source"], "link": a["link"], "category": a.get("category", "tech")} for a in articles[:8]],
        "created_at": time.time(),
        "pinned": False
    }

    history = load_digests()
    history.insert(0, digest_entry)
    
    # Prune past 40 items while keeping ALL pinned/starred briefings
    pinned = [item for item in history if item.get("pinned", False)]
    unpinned = [item for item in history if not item.get("pinned", False)]
    history = pinned + unpinned[:30]
    # Sort history so newest is always first
    history.sort(key=lambda x: x.get("id", ""), reverse=True)
    save_digests(history)

    if send_ntfy and audio_url:
        short_msg = " • " + "\n • ".join(highlights[:3]) if highlights else "Your morning executive briefing is ready."
        await send_ntfy_alert(f"🎙️ OmniDigest Audio Briefing — {display_date}", short_msg, audio_url)

    return digest_entry

@app.get("/", response_class=HTMLResponse)
async def serve_index():
    index_path = os.path.join(STATIC_DIR, "index.html")
    if os.path.exists(index_path):
        return await anyio.Path(index_path).read_text()
    return "<h1>OmniDigest API Running</h1>"

@app.get("/health")
async def health():
    return {
        "status": "ok",
        "service": "omnidigest",
        "version": "2.2.0",
        "llm_model": "Qwen 2.5 (1.5B)",
        "llm_endpoint": LLM_API_BASE,
        "scheduler": scheduler_state
    }

@app.get("/api/info")
async def get_info():
    return {
        "service": "OmniDigest",
        "version": "2.2.0",
        "llm_model": "Qwen 2.5 (1.5B)",
        "llm_type": "Local SLM",
        "llm_endpoint": LLM_API_BASE,
        "tts_engine": "Edge Neural TTS (Christopher Studio Voice)",
        "scheduler": scheduler_state
    }

@app.get("/api/scheduler/status")
async def get_scheduler_status():
    return {
        "status": "success",
        "scheduler": scheduler_state,
        "current_time": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }

@app.get("/api/news/live")
async def get_live_news(max_items: int = Query(default=4, le=10)):
    """
    On-demand live news crawler endpoint.
    Retrieves fresh articles across all configured RSS feeds immediately.
    """
    feeds = load_feeds()
    articles = await crawl_all_feeds(feeds, max_items_per_feed=max_items, client=shared_client)
    return {
        "status": "success",
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "total_articles": len(articles),
        "total_feeds": len(feeds),
        "articles": articles
    }

@app.get("/api/digest/latest")
async def get_latest_digest():
    digests = load_digests()
    if not digests:
        return JSONResponse(status_code=404, content={"message": "No digests generated yet."})
    return digests[0]

@app.get("/api/digest/history")
async def get_digest_history():
    return load_digests()

@app.post("/api/digest/generate")
async def trigger_generate(req: GenerateRequest, background_tasks: BackgroundTasks):
    digest = await run_digest_pipeline(
        custom_prompt=req.custom_prompt or "",
        voice=req.voice or "en-US-ChristopherNeural",
        send_ntfy=req.send_ntfy,
        category_filter=req.category_filter,
        speed_rate=req.speed_rate or "+0%"
    )
    return {"status": "success", "digest": digest}

@app.post("/api/digest/{digest_id}/pin")
async def toggle_pin_digest(digest_id: str):
    history = load_digests()
    for item in history:
        if item.get("id") == digest_id:
            item["pinned"] = not item.get("pinned", False)
            save_digests(history)
            return {"status": "success", "pinned": item["pinned"]}
    raise HTTPException(status_code=404, detail="Digest not found")

@app.post("/api/feeds/test")
async def test_feed(payload: Dict[str, str]):
    url = payload.get("url")
    if not url:
        raise HTTPException(status_code=400, detail="Missing feed URL")
    try:
        import feedparser
        headers = {"User-Agent": "Mozilla/5.0 (compatible; OmniDigest-Homelab/2.0)"}
        if shared_client:
            resp = await shared_client.get(url, headers=headers, follow_redirects=True)
            if resp.status_code != 200:
                return {"status": "error", "message": f"Server status {resp.status_code}"}
            parsed = feedparser.parse(resp.text)
            if parsed.bozo and not parsed.entries:
                return {"status": "error", "message": "Failed to parse feed. Invalid format."}
            return {
                "status": "success",
                "title": parsed.feed.get("title", "Unknown Feed"),
                "entries_count": len(parsed.entries)
            }
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.delete("/api/digest/{digest_id}")
async def delete_digest(digest_id: str):
    """Permanently delete a digest from history."""
    history = load_digests()
    new_history = [item for item in history if item.get("id") != digest_id]
    if len(new_history) == len(history):
        raise HTTPException(status_code=404, detail="Digest not found")
    save_digests(new_history)
    return {"status": "success", "message": f"Digest {digest_id} deleted"}

@app.get("/api/feeds")
async def get_feeds():
    return load_feeds()

@app.post("/api/feeds")
async def update_feeds(feeds: List[Dict[str, Any]]):
    global _feeds_cache, _feeds_dirty
    _feeds_cache = feeds
    _feeds_dirty = True
    return {"status": "success", "feeds": feeds}
