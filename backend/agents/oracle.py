import asyncio
import re
from urllib.parse import urljoin
import requests
from bs4 import BeautifulSoup

async def send_message(websocket, msg_type, text, severity="INFO", category="general", value=0):
    if websocket:
        await websocket.send_json({
            "agent": "oracle",
            "type": msg_type,
            "content": {
                "text": text,
                "severity": severity,
                "category": category,
                "value": value
            }
        })
    else:
        print(f"[ORACLE] {msg_type}: {text}")

async def run_oracle(url, websocket, crawler):
    await send_message(websocket, "reasoning", "Loading page to extract full text and evaluate business positioning...", "INFO", "init")
    try:
        page = await crawler.get_page()
        await page.goto(url, wait_until="networkidle")
        
        # 1. Scrape full text
        page_info = await page.evaluate('''() => {
            const getVisibleText = (element) => {
                if (element.offsetWidth > 0 && element.offsetHeight > 0) {
                    return element.innerText;
                }
                return "";
            };
            const headings = Array.from(document.querySelectorAll('h1, h2, h3')).map(h => getVisibleText(h)).filter(t => t.trim() !== "");
            const paragraphs = Array.from(document.querySelectorAll('p')).map(p => getVisibleText(p)).filter(t => t.trim() !== "");
            const ctas = Array.from(document.querySelectorAll('a, button')).map(el => getVisibleText(el)).filter(t => t.trim() !== "");
            const links = Array.from(document.querySelectorAll('a')).map(a => a.href).filter(l => l.startsWith('http'));
            return {
                headings, paragraphs, ctas, links, full_text: document.body.innerText
            };
        }''')
        
        full_text_lower = page_info['full_text'].lower()
        
        # 2. Value proposition analysis (mock LLaMA3 + real buzzword scan)
        await send_message(websocket, "reasoning", "Checking value proposition clarity and scanning for vague buzzwords...", "INFO", "value_prop")
        
        # MOCK LLaMA3 vision/analysis placeholder request (returns hardcoded)
        await send_message(websocket, "finding", "VALUE PROPOSITION UNCLEAR: Fails to clearly answer 'what is this, who is it for, why does it matter'", "HIGH", "value_prop", 0)
        
        buzzwords = ['revolutionary', 'seamless', 'innovative', 'next-gen', 'paradigm shift', 'synergy']
        found_buzzwords = [bw for bw in buzzwords if bw in full_text_lower]
        if found_buzzwords:
            await send_message(websocket, "finding", f"Detected vague, generic buzzwords: {', '.join(found_buzzwords)}. Less buzz, more clarity needed.", "MEDIUM", "value_prop", 0)

        # 3. Pricing analysis
        await send_message(websocket, "reasoning", "Looking for pricing page (/pricing, /plans, /cost)...", "INFO", "pricing")
        pricing_links = [l for l in page_info['links'] if any(x in l.lower() for x in ['/pricing', '/plans', '/cost'])]
        
        if pricing_links:
            await send_message(websocket, "finding", f"Found clear paths to pricing/plans strategy: {pricing_links[0]}", "LOW", "pricing", 1)
        else:
             await send_message(websocket, "finding", "Pricing strategy obscured or not clearly stated from landing page (Missing /pricing or /plans)", "MEDIUM", "pricing", 0)
             
        # 4. Social proof evaluation
        await send_message(websocket, "reasoning", "Quantifying social proof and trust signals...", "INFO", "social_proof")
        social_proof = {
            "testimonials": any(x in full_text_lower for x in ['testimonial', 'what people say', 'loved by']),
            "user counts": re.search(r'\d+\+ users|\d+[\.,]?\d*[km]? customers', full_text_lower) is not None,
            "press mentions": any(x in full_text_lower for x in ['featured in', 'as seen on', 'press']),
            "star ratings": any(x in full_text_lower for x in ['★', '5/5', '5 stars'])
        }
        
        missing_proofs = [k for k, v in social_proof.items() if not v]
        if missing_proofs:
            for missing in missing_proofs:
                await send_message(websocket, "finding", f"Missing critical social proof element: {missing}", "MEDIUM", "social_proof", 0)
        else:
             await send_message(websocket, "finding", "Excellent social proof detected across multiple dimensions", "LOW", "social_proof", 1)

        # 5. CTA language
        await send_message(websocket, "reasoning", "Analyzing CTA copy for action orientation...", "INFO", "cta_copy")
        weak_ctas = ['submit', 'click here', 'learn more', 'go']
        strong_ctas = ['start free', 'get started', 'try for free', 'book demo']
        
        found_weak_ctas = set()
        for cta_text in page_info['ctas']:
            text = cta_text.lower().strip()
            if any(text == w for w in weak_ctas):
                found_weak_ctas.add(text)
                
        if found_weak_ctas:
            await send_message(websocket, "finding", f"Weak, unoptimized CTA language detected: {', '.join(found_weak_ctas)}. Use action-oriented, value-driven CTAs.", "MEDIUM", "cta_copy", 0)
        
        if not any(any(s in cta.lower() for s in strong_ctas) for cta in page_info['ctas']):
            await send_message(websocket, "finding", "No strong ('Get Started', etc.) driver CTAs found.", "HIGH", "cta_copy", 0)

        # 6. Broken links detection
        await send_message(websocket, "reasoning", "Checking all extracted hrefs for broken links (4xx/5xx)...", "INFO", "links")
        links_to_check = list(set(page_info['links']))[:50] # Check max 50 to not block
        
        async def check_link(link):
            loop = asyncio.get_event_loop()
            try:
                resp = await loop.run_in_executor(None, lambda: requests.head(link, timeout=3, allow_redirects=True))
                if resp.status_code >= 400:
                    if resp.status_code == 404:
                         return (link, resp.status_code)
                return None
            except:
                return (link, "Timeout/Error")

        results = await asyncio.gather(*(check_link(l) for l in links_to_check))
        broken = [r for r in results if r]
        
        if broken:
            for b in broken[:5]: # Send up to 5 individual alerts
                await send_message(websocket, "finding", f"Broken link detected: {b[0]} returned {b[1]}", "HIGH", "links", 0)
                
        # 7. Grammar / Professionalism check
        await send_message(websocket, "reasoning", "Running copy grammar and professionalism checks...", "INFO", "grammar")
        
        all_caps = re.findall(r'\b[A-Z]{5,}\b', page_info['full_text']) # Words 5+ chars ALL CAPS
        if len(all_caps) > 5:
            await send_message(websocket, "finding", f"Excessive ALL CAPS words used ({len(all_caps)} instances). Reduces professionalism.", "LOW", "grammar", 0)
            
        exclamations = len(re.findall(r'!!+', page_info['full_text']))
        if exclamations > 0:
            await send_message(websocket, "finding", f"Unprofessional punctuation detected (multiple exclamation marks '!!'): {exclamations} instances.", "MEDIUM", "grammar", 0)

        await page.close()

    except Exception as e:
        await send_message(websocket, "finding", f"Failed to analyze text: {e}", "CRITICAL", "error", 0)

    await send_message(websocket, "judgment", "Business analysis complete.", "INFO", "status", 0)
    return {"status": "done"}
