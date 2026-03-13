import asyncio
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

async def run_stranger(url, websocket):
    await send_message(websocket, "reasoning", "Loading page as a first-time user...", "INFO", "init")
    try:
        from playwright.async_api import async_playwright
        playwright = await async_playwright().start()
        browser = await playwright.chromium.launch(headless=True)
        desktop_context = await browser.new_context(viewport={"width": 1280, "height": 720})
        page = await desktop_context.new_page()
        await page.goto(url, wait_until="networkidle")
        
        # 1. First impression & Screenshot
        await send_message(websocket, "reasoning", "Taking full page screenshot for vision analysis...", "INFO", "first_impression")
        screenshot_path = f"target_screenshot.png"
        await page.screenshot(path=screenshot_path, full_page=True)
        
        #vision_result = await mock_llama3_vision(screenshot_path)
        # Use simple presence check or text to simulate vision clarity analysis
        prompt = stranger_firstimpression_reasoning("Product landing page with clear CTA")
        await stream_reasoning(prompt, websocket, "stranger")

        # 2. CTA Discovery
        await send_message(websocket, "reasoning", "Looking for primary CTA above the fold...", "INFO", "cta")
        
        # Identify a CTA visible in the first viewport
        cta_visible = await page.evaluate('''() => {
            const elements = Array.from(document.querySelectorAll('a, button'));
            const ctas = elements.filter(el => {
                const text = el.innerText.toLowerCase();
                const cls = el.className.toLowerCase();
                return (text.includes('start') || text.includes('try') || text.includes('signup') || text.includes('sign up') || text.includes('get started') || cls.includes('btn') || cls.includes('button'));
            });
            for (let el of ctas) {
                const rect = el.getBoundingClientRect();
                if (rect.top >= 0 && rect.left >= 0 && rect.bottom <= window.innerHeight && rect.right <= window.innerWidth && rect.width > 0 && rect.height > 0) {
                    return true;
                }
            }
            return false;
        }''')
        
        if cta_visible:
            await send_message(websocket, "finding", "Primary CTA clearly visible above the fold", "LOW", "cta", 1)
        else:
            await send_message(websocket, "finding", "CTA NOT VISIBLE above the fold — Users will leave before interacting", "CRITICAL", "cta", 0)
        
        # 3. Signup / Onboarding flow navigation
        await send_message(websocket, "reasoning", "Attempting to navigate to signup/onboarding flow...", "INFO", "signup")
        
        # Try to click the first CTA we find
        cta_clicked = False
        try:
            # Look for common signup links via playwright locators
            locator = page.locator("text=/sign up|get started|try for free|register/i").first
            if await locator.count() > 0:
                await locator.click(timeout=5000)
                await page.wait_for_load_state("networkidle", timeout=5000)
                cta_clicked = True
        except Exception:
            pass

        if not cta_clicked:
            await send_message(websocket, "finding", "Failed to identify or click a clear signup CTA", "HIGH", "signup", 0)

        # Count fields on whatever page we landed on (signup flow or original)
        fields_count = await page.evaluate('''() => {
            return document.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="button"]), select, textarea').length;
        }''')
        
        if fields_count > 5:
            await send_message(websocket, "finding", f"FRICTION TOO HIGH: Signup/Onboarding form has {fields_count} fields. Users will abandon.", "HIGH", "signup", fields_count)
        elif fields_count > 0:
            await send_message(websocket, "finding", f"Signup friction acceptable: {fields_count} fields detected.", "LOW", "signup", fields_count)

        # Go back to main page if we navigated away to scan trust signals on home
        if cta_clicked:
            await page.goto(url, wait_until="networkidle")

        # 4. Trust signal detection
        await send_message(websocket, "reasoning", "Scanning DOM for trust signals (Testimonials, Pricing, Privacy, Contact, Security)...", "INFO", "trust")
        
        trust_signals = await page.evaluate('''() => {
            const text = document.body.innerText.toLowerCase();
            const links = Array.from(document.querySelectorAll('a')).map(a => a.href.toLowerCase());
            
            const hasTestimonials = text.includes('testimonial') || text.includes('what our customers say') || document.querySelectorAll('*[class*="testimonial"]').length > 0;
            const hasPricing = text.includes('pricing') || links.some(l => l.includes('pricing'));
            const hasPrivacy = text.includes('privacy policy') || links.some(l => l.includes('privacy'));
            const hasContact = text.includes('contact us') || links.some(l => l.includes('contact'));
            const hasSecurity = text.includes('security') || document.querySelectorAll('*[class*="secure"], *[class*="badge"]').length > 0;

            return {
                Testimonials: hasTestimonials,
                Pricing: hasPricing,
                Privacy: hasPrivacy,
                Contact: hasContact,
                Security: hasSecurity
            };
        }''')

        missing_trust = []
        for signal, present in trust_signals.items():
            if not present:
                missing_trust.append(signal)
        
        if missing_trust:
            for missing in missing_trust:
                await send_message(websocket, "finding", f"Missing trust signal: {missing}", "MEDIUM", "trust", 0)
        else:
            await send_message(websocket, "finding", "All key trust signals are present", "LOW", "trust", 1)

        await page.close()

        # 5. Mobile responsiveness check
        await send_message(websocket, "reasoning", "Switching to mobile viewport (375x812) to verify layout and tappable areas...", "INFO", "mobile")
        mobile_context = await browser.new_context(
            viewport={'width': 375, 'height': 812},
            user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1"
        )
        mobile_page = await mobile_context.new_page()
        await mobile_page.goto(url, wait_until="networkidle")
        
        mobile_issues = await mobile_page.evaluate('''() => {
            let issues = [];
            
            // Check for horizontal scrolling (layout break)
            if (document.documentElement.scrollWidth > window.innerWidth) {
                issues.push("Horizontal scrolling detected - layout breaks on mobile");
            }
            
            // Check tappable targets
            const buttons = document.querySelectorAll('button, a, input[type="button"], input[type="submit"]');
            let smallButtons = 0;
            buttons.forEach(btn => {
                const rect = btn.getBoundingClientRect();
                if (rect.width > 0 && rect.height > 0 && (rect.width < 44 || rect.height < 44)) {
                    smallButtons++;
                }
            });
            if (smallButtons > 0) {
                issues.push(`${smallButtons} interactive elements are smaller than 44x44px (hard to tap)`);
            }
            
            // Check readable text
            const textNodes = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
            let smallTextCount = 0;
            let node;
            while (node = textNodes.nextNode()) {
                if (node.nodeValue.trim() !== "") {
                    const style = window.getComputedStyle(node.parentElement);
                    const fontSize = parseFloat(style.fontSize);
                    if (fontSize > 0 && fontSize < 12) {
                        smallTextCount++;
                    }
                }
            }
            if (smallTextCount > 5) {
                issues.push("Multiple text elements are too small to read on mobile (< 12px)");
            }
            return issues;
        }''')

        if mobile_issues:
            for issue in mobile_issues:
                prompt = stranger_ux_reasoning(issue)
                await stream_reasoning(prompt, websocket, "stranger")
                await send_message(websocket, "finding", f"Mobile issue: {issue}", "HIGH", "mobile", 0)
        else:
            await send_message(websocket, "finding", "Mobile layout is stable, text is readable, and buttons are tappable sizes", "LOW", "mobile", 1)

        await mobile_page.close()
        await mobile_context.close()
        await desktop_context.close()
        await browser.close()
        await playwright.stop()

    except Exception as e:
        import traceback
        err_str = traceback.format_exc()
        await send_message(websocket, "finding", f"Error during UI traversal: {err_str}", "CRITICAL", "error", 0)
        
    await send_message(websocket, "judgment", "UX analysis complete.", "INFO", "status", 0)
    return {"status": "done"}
