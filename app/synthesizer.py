import os
import json
import re
import logging
from typing import List, Dict, Any, Tuple
import httpx

logger = logging.getLogger("omnidigest.synthesizer")

LLM_API_BASE = os.getenv("LLM_API_BASE", "http://llama-server-qwen:8080/v1")
LLM_MODEL = os.getenv("LLM_MODEL", "qwen2.5")

def repair_json_string(text: str) -> str:
    """
    Attempts heuristic repairs on common SLM JSON syntax mistakes:
    - Missing commas between array items / object keys
    - Trailing commas before closing braces/brackets
    - Unescaped newlines in JSON strings
    """
    cleaned = text.strip()
    
    # Strip markdown code blocks
    if "```json" in cleaned:
        cleaned = cleaned.split("```json", 1)[1].split("```", 1)[0]
    elif "```" in cleaned:
        cleaned = cleaned.split("```", 1)[1].split("```", 1)[0]
    cleaned = cleaned.strip()

    # Find outermost JSON object
    first_brace = cleaned.find('{')
    last_brace = cleaned.rfind('}')
    if first_brace != -1 and last_brace != -1 and last_brace > first_brace:
        cleaned = cleaned[first_brace:last_brace + 1]

    # 1. Insert missing comma between two string literals (e.g. "a" "b" or "val1" "key2": ...)
    cleaned = re.sub(r'(?<=[^\\]")\s+(?=")', r', ', cleaned)

    # 2. Fix missing commas between array bracket / object and next key
    cleaned = re.sub(r'(\])\s*(")', r'\1, \2', cleaned)
    cleaned = re.sub(r'(\})\s*(")', r'\1, \2', cleaned)

    # 3. Remove trailing commas before closing braces/brackets
    cleaned = re.sub(r',\s*(\]|\})', r'\1', cleaned)

    return cleaned

def extract_fields_fallback(raw_text: str) -> Dict[str, Any]:
    """
    Regex-based fallback field extractor when strict JSON parsing fails completely.
    Extracts 'highlights', 'markdown_report', and 'audio_script' safely.
    """
    result = {
        "highlights": [],
        "markdown_report": "",
        "audio_script": ""
    }

    # Extract Highlights
    highlights_match = re.search(r'"highlights"\s*:\s*\[([\s\S]*?)\]', raw_text)
    if highlights_match:
        items_block = highlights_match.group(1)
        # Extract quoted strings
        items = re.findall(r'"((?:\\.|[^"\\])*)"', items_block)
        if items:
            result["highlights"] = [it.replace('\\"', '"').replace('\\n', ' ').strip().lstrip("-*• ") for it in items if it.strip()]
    
    # If highlights empty, try finding bullet points
    if not result["highlights"]:
        bullet_matches = re.findall(r'(?:^|\n)\s*[-*•]\s*(.+)', raw_text)
        if bullet_matches:
            result["highlights"] = [b.strip() for b in bullet_matches[:4] if b.strip()]

    # Extract Markdown Report
    md_match = re.search(r'"markdown_report"\s*:\s*"([\s\S]*?)"(?=\s*,\s*"audio_script"|\s*,\s*"highlights"|\s*\})', raw_text)
    if md_match:
        raw_md = md_match.group(1)
        clean_md = raw_md.replace('\\n', '\n').replace('\\"', '"').replace('\\\\', '\\')
        result["markdown_report"] = clean_md.strip()
    else:
        # Check if markdown report is an object or array
        obj_md_match = re.search(r'"markdown_report"\s*:\s*(\{[\s\S]*?\})(?=\s*,\s*"audio_script"|\s*\})', raw_text)
        if obj_md_match:
            try:
                parsed_obj = json.loads(obj_md_match.group(1))
                lines = []
                for k, v in parsed_obj.items():
                    lines.append(f"### {k}")
                    if isinstance(v, list):
                        for item in v:
                            lines.append(f"- {item}")
                    else:
                        lines.append(str(v))
                    lines.append("")
                result["markdown_report"] = "\n".join(lines).strip()
            except Exception:
                pass

    # Extract Audio Script
    script_match = re.search(r'"audio_script"\s*:\s*"([\s\S]*?)"(?=\s*,\s*"markdown_report"|\s*,\s*"highlights"|\s*\})', raw_text)
    if not script_match:
        script_match = re.search(r'"audio_script"\s*:\s*"([\s\S]*?)"\s*\}?$', raw_text)
    if not script_match:
        script_match = re.search(r'"audio_script"\s*:\s*"([\s\S]*?)(?:\s*\}|\s*$)', raw_text)
    if script_match:
        raw_script = script_match.group(1).rstrip('"} \n\r')
        clean_script = raw_script.replace('\\n', ' ').replace('\\"', '"').replace('\\\\', '\\')
        result["audio_script"] = clean_script.strip()

    return result

def clean_synthesized_text(text: str) -> str:
    """
    Ensure the synthesized markdown report never contains raw JSON boilerplate or unmatched tokens.
    """
    if not text:
        return ""
    
    # If text is raw stringified JSON, strip outer braces and key declarations
    text = text.strip()
    if text.startswith("{") and '"markdown_report"' in text:
        fields = extract_fields_fallback(text)
        if fields["markdown_report"]:
            return fields["markdown_report"]
        
    return text

async def synthesize_digest(articles: List[Dict[str, Any]], custom_prompt: str = "", client: httpx.AsyncClient = None) -> Tuple[str, str, List[str]]:
    """
    Synthesizes rich executive memo, broadcast audio podcast script, and analytical key highlights.
    Returns:
      (markdown_report, spoken_audio_script, key_highlights)
    """
    if not articles:
        return (
            "No fresh news articles found across configured feeds.",
            "Good day. No new headlines were detected across your feeds today.",
            ["Feeds scanned with zero new updates."]
        )

    # Format top 8 balanced informative articles across sectors
    context_lines = []
    for idx, a in enumerate(articles[:8], 1):
        context_lines.append(
            f"[{idx}] Source: {a['source']} | Category: {a.get('category', 'tech')} | Title: {a['title']}\n"
            f"Context: {a['snippet'][:300]}\n"
        )
    context_text = "\n".join(context_lines)

    system_prompt = (
        "You are OmniDigest, an autonomous executive intelligence analyst and news synthesizer.\n"
        "Analyze the provided top stories across AI, engineering, cyber security, and tech markets.\n"
        "Synthesize a cohesive, high-impact executive intelligence briefing covering the major developments.\n"
        "You must respond ONLY with a single valid JSON object. Do not include markdown code block backticks.\n"
        "Ensure all JSON strings are properly escaped, and array items MUST be separated by commas.\n\n"
        "JSON Schema:\n"
        "{\n"
        '  "highlights": ["3 sharp analytical bullets explaining WHY these developments matter. Be concrete."],\n'
        '  "markdown_report": "Comprehensive executive memo in Markdown format with ## Headings, bullet points, and strategic takeaways.",\n'
        '  "audio_script": "Engaging spoken 1-2 minute radio monologue for Text-to-Speech (start with: Good morning. Welcome to your OmniDigest executive briefing.)"\n'
        "}"
    )

    user_message = f"Here are today's top stories across key industry feeds:\n\n{context_text}"
    if custom_prompt:
        user_message += f"\n\nExecutive Focus Request: {custom_prompt}"

    try:
        payload = {
            "model": LLM_MODEL,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message}
            ],
            "temperature": 0.2,
            "max_tokens": 1400
        }
        
        if client:
            resp = await client.post(f"{LLM_API_BASE}/chat/completions", json=payload, timeout=90.0)
        else:
            async with httpx.AsyncClient(timeout=90.0) as local_client:
                resp = await local_client.post(f"{LLM_API_BASE}/chat/completions", json=payload)
            
            if resp.status_code == 200:
                data = resp.json()
                raw_content = data["choices"][0]["message"]["content"]
                
                # Attempt standard repair
                repaired = repair_json_string(raw_content)
                parsed = None

                # Step 1: Direct JSON parsing
                try:
                    parsed = json.loads(repaired)
                except Exception as json_err:
                    logger.warning(f"Direct JSON parse failed ({json_err}), attempting regex field extraction.")
                    # Step 2: Fallback field extraction
                    parsed = extract_fields_fallback(raw_content)

                if parsed:
                    # 1. Highlights
                    raw_highlights = parsed.get("highlights", [])
                    highlights = []
                    if isinstance(raw_highlights, list):
                        for h in raw_highlights:
                            h_str = str(h).strip().lstrip("-*• ")
                            if h_str:
                                highlights.append(h_str)
                    elif isinstance(raw_highlights, str):
                        highlights = [h.strip().lstrip("-*• ") for h in raw_highlights.split("\n") if h.strip()]

                    # 2. Markdown Report
                    raw_md = parsed.get("markdown_report", "")
                    if isinstance(raw_md, dict):
                        lines = []
                        for k, v in raw_md.items():
                            lines.append(f"### {k}\n")
                            if isinstance(v, list):
                                for item in v:
                                    lines.append(f"- {item}")
                            else:
                                lines.append(str(v))
                            lines.append("")
                        markdown_report = "\n".join(lines)
                    elif isinstance(raw_md, list):
                        markdown_report = "\n".join([f"- {item}" for item in raw_md])
                    else:
                        markdown_report = str(raw_md)

                    # Clean any residual JSON tokens
                    markdown_report = clean_synthesized_text(markdown_report)

                    # 3. Audio Script
                    audio_script = str(parsed.get("audio_script", "")).strip()

                    # Fallbacks if any field was empty
                    if not highlights:
                        highlights = [f"{a['source']}: {a['title']}" for a in articles[:3]]
                    if not audio_script:
                        audio_script = f"Good morning. Welcome to your OmniDigest executive briefing. Today's top coverage includes {articles[0]['title'] if articles else 'key tech updates'}. That concludes your briefing."
                    if not markdown_report or markdown_report.startswith("{"):
                        markdown_report = f"## ⚡ Executive Intelligence Briefing\n\n" + "\n\n".join([f"### {a['title']}\n**Source**: {a['source']} · [Link]({a['link']})\n\n{a['snippet'][:250]}" for a in articles[:4]])

                    logger.info("Successfully synthesized executive briefing via local SLM")
                    return (markdown_report, audio_script, highlights)

            else:
                logger.warning(f"LLM request status {resp.status_code}: {resp.text}")
    except Exception as e:
        logger.error(f"Failed to query local LLM at {LLM_API_BASE}: {e}")

    # Fallback analytical synthesizer
    logger.info("Generating structured fallback briefing")
    fallback_md = "## ⚡ OmniDigest Strategic Intelligence Briefing\n\n"
    fallback_script = "Good morning. Welcome to your OmniDigest executive briefing. Here are today's top stories and strategic analysis. "
    highlights = []

    for a in articles[:4]:
        snippet_core = a['snippet'][:220] if a['snippet'] else a['title']
        fallback_md += f"### 🔹 {a['title']}\n"
        fallback_md += f"**Source**: {a['source']} · [Read Source Article]({a['link']})\n\n"
        fallback_md += f"{snippet_core}\n\n"
        
        fallback_script += f"In news from {a['source']}, {a['title']}. {snippet_core}. "
        highlights.append(f"{a['source']}: {snippet_core[:90]}...")

    fallback_script += "That concludes your OmniDigest update. Have a productive day."
    return (fallback_md, fallback_script, highlights)
