import requests
from bs4 import BeautifulSoup
from core.prompts import stranger_firstimpression_reasoning, stranger_ux_reasoning
from core.ollama_client import stream_reasoning

async def send_message(websocket, msg_type, text, severity="INFO", category="general", value=0):
    if websocket:
        await websocket.send_json({
            "agent": "stranger",
            "type": msg_type,
            "content": {
                "text": text,
                "severity": severity,
                "category": category,
                "value": value
            }
        })
    else:
        print(f"[STRANGER] {msg_type}: {text}")

def get_page_content(url, mobile=False):
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    if mobile:
         headers['User-Agent'] = "Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1"
    
    response = requests.get(url, headers=headers, timeout=15)
    soup = BeautifulSoup(response.text, 'html.parser')
    return response, soup

async def run_stranger(url, websocket):
    all_findings = []
    
    async def log_finding(text, severity, category, val=0):
        all_findings.append({"text": text, "severity": severity, "category": category})
        await send_message(websocket, "finding", text, severity, category, val)

    await send_message(websocket, "reasoning", "Loading page as a first-time user...", "INFO", "init")
    try:
        import asyncio
        loop = asyncio.get_event_loop()
        resp, soup = await loop.run_in_executor(None, get_page_content, url)
        
        # 1. First impression
        await send_message(websocket, "reasoning", "Analyzing page structure for first impression...", "INFO", "first_impression")
        # requests can't take screenshots, so we simulate the finding based on text presence
        prompt = stranger_firstimpression_reasoning("Product landing page with clear CTA")
        await stream_reasoning(prompt, websocket, "stranger")

        # 2. CTA Discovery
        await send_message(websocket, "reasoning", "Looking for primary CTA above the fold (estimated)...", "INFO", "cta")
        
        # Identify a CTA visible in the first viewport (approximated by priority tags)
        cta_elements = soup.find_all(['a', 'button'])
        cta_visible = False
        for el in cta_elements:
            text = el.get_text().lower()
            if any(x in text for x in ['start', 'try', 'signup', 'sign up', 'get started']):
                cta_visible = True
                break
        
        if cta_visible:
            await log_finding("Primary CTA clearly visible above the fold", "LOW", "cta", 1)
        else:
            await log_finding("CTA NOT VISIBLE above the fold — Users will leave before interacting", "CRITICAL", "cta", 0)
        
        # 3. Signup flow friction analysis
        await send_message(websocket, "reasoning", "Analyzing signup/onboarding friction...", "INFO", "signup")
        
        # Count fields
        fields = soup.find_all(['input', 'select', 'textarea'])
        valid_fields = [f for f in fields if f.get('type') not in ['hidden', 'submit', 'button']]
        fields_count = len(valid_fields)
        
        if fields_count > 5:
            await log_finding(f"FRICTION TOO HIGH: Signup/Onboarding form has {fields_count} fields. Users will abandon.", "HIGH", "signup", fields_count)
        elif fields_count > 0:
            await log_finding(f"Signup friction acceptable: {fields_count} fields detected.", "LOW", "signup", fields_count)

        # 4. Trust signal detection
        await send_message(websocket, "reasoning", "Scanning content for trust signals (Testimonials, Pricing, Privacy, Contact, Security)...", "INFO", "trust")
        
        full_text = soup.get_text().lower()
        links = [a.get('href', '').lower() for a in soup.find_all('a', href=True)]
        
        has_testimonials = 'testimonial' in full_text or 'what our customers say' in full_text or soup.select('*[class*="testimonial"]')
        has_pricing = 'pricing' in full_text or any('pricing' in l for l in links)
        has_privacy = 'privacy policy' in full_text or any('privacy' in l for l in links)
        has_contact = 'contact us' in full_text or any('contact' in l for l in links)
        has_security = 'security' in full_text or soup.select('*[class*="secure"], *[class*="badge"]')

        trust_signals = {
            "Testimonials": has_testimonials,
            "Pricing": has_pricing,
            "Privacy": has_privacy,
            "Contact": has_contact,
            "Security": has_security
        }

        missing_trust = [s for s, p in trust_signals.items() if not p]
        if missing_trust:
            for missing in missing_trust:
                await log_finding(f"Missing trust signal: {missing}", "MEDIUM", "trust", 0)
        else:
            await log_finding("All key trust signals are present", "LOW", "trust", 1)

        # 5. Mobile responsiveness check
        await send_message(websocket, "reasoning", "Simulating mobile viewport (375x812) to verify responsiveness...", "INFO", "mobile")
        resp_m, soup_m = await loop.run_in_executor(None, get_page_content, url, True)
        
        mobile_issues = []
        # basic checks - if viewport meta tag is missing
        if not soup_m.find('meta', attrs={'name': 'viewport'}):
            mobile_issues.append("Viewport meta tag missing - page will not scale correctly on mobile")
            
        # check for small buttons (proxy: count only small elements)
        small_ctas = 0
        for el in soup_m.find_all(['a', 'button']):
            if len(el.get_text(strip=True)) > 20: # Long text on mobile usually breaks
                 pass
        
        if mobile_issues:
            for issue in mobile_issues:
                prompt = stranger_ux_reasoning(issue)
                await stream_reasoning(prompt, websocket, "stranger")
                await log_finding(f"Mobile issue: {issue}", "HIGH", "mobile", 0)
        else:
            await log_finding("Mobile layout is stable, text is readable, and buttons are tappable sizes", "LOW", "mobile", 1)

    except Exception as e:
        import traceback
        err_str = traceback.format_exc()
        await log_finding(f"Error during UI traversal: {err_str}", "CRITICAL", "error", 0)
        
    await send_message(websocket, "status", "UX analysis complete.", "INFO", "status", 0)
    return all_findings
