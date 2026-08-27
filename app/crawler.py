import asyncio
import logging
import re
from typing import List, Dict, Any
import feedparser
import httpx

logger = logging.getLogger("omnidigest.crawler")

DEFAULT_FEEDS = [
    {"name": "Hacker News (Top)", "url": "https://news.ycombinator.com/rss", "category": "tech"},
    {"name": "ArXiv AI Research", "url": "https://export.arxiv.org/rss/cs.AI", "category": "ai"},
    {"name": "TechCrunch", "url": "https://techcrunch.com/feed/", "category": "tech"},
    {"name": "CoinDesk Markets", "url": "https://www.coindesk.com/arc/outboundfeeds/rss/", "category": "finance"},
    {"name": "Ars Technica", "url": "https://feeds.arstechnica.com/arstechnica/index", "category": "tech"},
    {"name": "BleepingComputer", "url": "https://www.bleepingcomputer.com/feed/", "category": "security"},
    {"name": "Wired Top Stories", "url": "https://www.wired.com/feed/rss", "category": "tech"}
]

def clean_html(raw_html: str) -> str:
    if not raw_html:
        return ""
    clean = re.sub(r'<[^>]+>', ' ', raw_html)
    clean = re.sub(r'\s+', ' ', clean).strip()
    return clean

async def fetch_feed(client: httpx.AsyncClient, feed_meta: Dict[str, Any], max_items: int = 3, headers: dict = None) -> List[Dict[str, Any]]:
    results = []
    try:
        resp = await client.get(feed_meta["url"], timeout=12.0, follow_redirects=True, headers=headers)
        if resp.status_code != 200:
            logger.warning(f"Failed to fetch {feed_meta['url']}: status {resp.status_code}")
            return results
        
        parsed = feedparser.parse(resp.text)
        for entry in parsed.entries[:max_items]:
            title = entry.get("title", "Untitled").strip()
            link = entry.get("link", "").strip()
            
            # Skip empty or low-value titles
            if not title or title.lower() in ["untitled", "none"] or len(title) < 8:
                continue

            # Extract richest description available
            raw_summary = entry.get("summary") or entry.get("description") or ""
            content_list = entry.get("content", [])
            if content_list and isinstance(content_list, list) and len(content_list) > 0:
                raw_summary = content_list[0].get("value", raw_summary)
            
            snippet = clean_html(raw_summary)
            if not snippet or len(snippet) < 30:
                snippet = f"Story published in {feed_meta['name']} covering {title}."

            results.append({
                "source": feed_meta["name"],
                "category": feed_meta.get("category", "tech"),
                "title": title,
                "link": link,
                "snippet": snippet[:600]
            })
    except Exception as e:
        logger.error(f"Error crawling feed {feed_meta['name']}: {e}")
    return results

async def crawl_all_feeds(feeds: List[Dict[str, Any]] = None, max_items_per_feed: int = 3, client: httpx.AsyncClient = None) -> List[Dict[str, Any]]:
    if not feeds:
        feeds = DEFAULT_FEEDS
    
    headers = {"User-Agent": "Mozilla/5.0 (compatible; OmniDigest-Homelab/2.0; +http://192.168.0.65)"}
    if client:
        tasks = [fetch_feed(client, f, max_items_per_feed, headers=headers) for f in feeds]
        nested_results = await asyncio.gather(*tasks, return_exceptions=True)
    else:
        async with httpx.AsyncClient(headers=headers) as local_client:
            tasks = [fetch_feed(local_client, f, max_items_per_feed) for f in feeds]
            nested_results = await asyncio.gather(*tasks, return_exceptions=True)
    
    feed_buckets = []
    for res in nested_results:
        if isinstance(res, list) and res:
            feed_buckets.append(res)

    # Interleaved round-robin ranking across all feeds to balance AI, Tech, Security, Markets
    all_articles = []
    seen_titles = set()
    max_depth = max((len(b) for b in feed_buckets), default=0)

    for depth in range(max_depth):
        for bucket in feed_buckets:
            if depth < len(bucket):
                item = bucket[depth]
                normalized_title = re.sub(r'[^a-zA-Z0-9]', '', item['title'].lower())
                if normalized_title not in seen_titles:
                    seen_titles.add(normalized_title)
                    all_articles.append(item)
            
    return all_articles
