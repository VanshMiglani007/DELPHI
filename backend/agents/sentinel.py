import asyncio
import time
import requests
from concurrent.futures import ThreadPoolExecutor
from urllib.parse import urljoin, urlparse
import ssl
import socket

async def send_message(websocket, msg_type, text, severity="INFO", category="general", value=0):
    if websocket:
        await websocket.send_json({
            "agent": "sentinel",
            "type": msg_type,
            "content": {
                "text": text,
                "severity": severity,
                "category": category,
                "value": value
            }
        })
    else:
        print(f"[SENTINEL] {msg_type}: {text}")

async def run_sentinel(url, websocket, crawler):
    await send_message(websocket, "reasoning", f"Starting Sentinel analysis for {url}", "INFO", "init")
    await asyncio.sleep(0.5)

    base_domain = urlparse(url).netloc
    discovered_endpoints = set([url])
    discovered_forms = []

    # 1. Autonomous crawling
    await send_message(websocket, "reasoning", "Finding endpoints and mapping attack surface...", "INFO", "crawling")
    try:
        page = await crawler.get_page()
        await page.goto(url, wait_until="networkidle")
        
        # Extract links
        hrefs = await page.evaluate('''() => {
            return Array.from(document.querySelectorAll('a')).map(a => a.href);
        }''')
        
        for href in hrefs:
            if href and href.startswith('http'):
                if urlparse(href).netloc == base_domain:
                    discovered_endpoints.add(href)
        
        # Extract forms
        forms = await page.evaluate('''() => {
            return Array.from(document.querySelectorAll('form')).map(form => {
                return {
                    action: form.action,
                    method: form.method || 'GET',
                    inputs: Array.from(form.querySelectorAll('input, textarea')).map(input => ({
                        name: input.name,
                        type: input.type
                    }))
                };
            });
        }''')
        discovered_forms = forms
        
        await send_message(websocket, "finding", f"Discovered {len(discovered_endpoints)} internal endpoints and {len(discovered_forms)} forms", "LOW", "crawling", len(discovered_endpoints))
        await page.close()
    except Exception as e:
        await send_message(websocket, "finding", f"Failed to crawl: {e}", "CRITICAL", "crawling", 0)

    # 2. Security headers
    await send_message(websocket, "reasoning", "Analyzing HTTP security headers...", "INFO", "headers")
    try:
        loop = asyncio.get_event_loop()
        resp = await loop.run_in_executor(None, lambda: requests.get(url, timeout=10))
        
        security_headers = {
            'X-Frame-Options': 'Vulnerable to clickjacking',
            'Content-Security-Policy': 'No CSP: vulnerable to XSS attacks',
            'Strict-Transport-Security': 'Missing HSTS: vulnerable to downgrade attacks',
            'X-Content-Type-Options': 'Missing MIME sniffing protection',
            'X-XSS-Protection': 'Browser XSS filter disabled',
            'Referrer-Policy': 'Potential referrer data leakage'
        }
        
        for header, risk in security_headers.items():
            if header not in resp.headers and header.lower() not in resp.headers:
                await send_message(websocket, "finding", f"Missing {header}: {risk}", "HIGH", "headers", 0)
    except Exception as e:
         await send_message(websocket, "finding", f"Failed to read headers: {e}", "CRITICAL", "headers", 0)

    # 3. Load testing
    await send_message(websocket, "reasoning", "Initiating progressive load test (10->500 users)...", "INFO", "load")
    stages = [10, 50, 100, 200, 500]
    
    def fetch_url(target):
        try:
            return requests.get(target, timeout=5).status_code
        except:
            return 500

    breaking_point = None
    with ThreadPoolExecutor(max_workers=100) as executor:
        for users in stages:
            await send_message(websocket, "metric", f"Testing at {users} concurrent users", "INFO", "load", users)
            loop = asyncio.get_event_loop()
            futures = [loop.run_in_executor(executor, fetch_url, url) for _ in range(users)]
            results = await asyncio.gather(*futures)
            
            errors = len([r for r in results if r >= 400])
            error_rate = errors / len(results) if results else 1
            
            if error_rate > 0.2:
                breaking_point = users
                await send_message(websocket, "finding", f"Collapses at {users} concurrent users (Error rate: {error_rate*100:.1f}%)", "CRITICAL", "load", users)
                break
            await asyncio.sleep(0.5)

    if not breaking_point:
         await send_message(websocket, "finding", "Survived 500 concurrent users with <20% error rate", "LOW", "load", 500)

    # 4. Input fuzzing
    await send_message(websocket, "reasoning", "Fuzzing discovered inputs with SQLi, XSS, and Path Traversal payloads...", "INFO", "fuzzing")
    payloads = {
        "SQLi": ["' OR 1=1--", "'; DROP TABLE--"],
        "XSS": ["<script>alert(1)</script>", "\"><script>prompt(1)</script>"],
        "Path Traversal": ["../../../etc/passwd", "..%2F..%2F..%2Fetc%2Fpasswd"]
    }
    
    if discovered_forms:
        for form in discovered_forms:
            action = form.get('action') or url
            method = str(form.get('method', 'GET')).upper()
            inputs = form.get('inputs', [])
            
            if not inputs:
                continue
                
            for attack_type, attack_payloads in payloads.items():
                for payload in attack_payloads:
                    data = {}
                    for inp in inputs:
                        if inp.get('name'):
                            data[inp['name']] = payload
                    try:
                        loop = asyncio.get_event_loop()
                        if method == 'POST':
                            fuzz_resp = await loop.run_in_executor(None, lambda: requests.post(action, data=data, timeout=5))
                        else:
                            fuzz_resp = await loop.run_in_executor(None, lambda: requests.get(action, params=data, timeout=5))
                        
                        resp_text = fuzz_resp.text.lower()
                        # Analyze basic reflections / errors
                        if attack_type == "SQLi" and any(err in resp_text for err in ["sql syntax", "database error", "mysql_fetch"]):
                            await send_message(websocket, "finding", f"SQL Injection vulnerability confirmed on form action: {action}", "CRITICAL", "fuzzing", 0)
                            break
                        elif attack_type == "XSS" and payload.lower() in resp_text:
                            await send_message(websocket, "finding", f"Reflected XSS vulnerability confirmed on form action: {action}", "HIGH", "fuzzing", 0)
                            break
                        elif attack_type == "Path Traversal" and "root:x:0:0" in resp_text:
                            await send_message(websocket, "finding", f"Path Traversal vulnerability confirmed on form action: {action}", "CRITICAL", "fuzzing", 0)
                            break
                        elif fuzz_resp.status_code >= 500:
                            await send_message(websocket, "finding", f"Unhandled server exception (500) parsing {attack_type} payload on {action}", "MEDIUM", "fuzzing", 0)
                            break
                    except Exception:
                        pass
    else:
        await send_message(websocket, "finding", "No forms discovered for fuzzing", "LOW", "fuzzing", 0)

    # 5. SSL
    await send_message(websocket, "reasoning", "Verifying SSL and certificates...", "INFO", "ssl")
    if url.startswith("https"):
        domain = urlparse(url).netloc
        try:
            def get_ssl_expiry():
                context = ssl.create_default_context()
                with socket.create_connection((domain, 443), timeout=5) as sock:
                    with context.wrap_socket(sock, server_hostname=domain) as ssock:
                        return ssock.getpeercert()
            
            cert = await loop.run_in_executor(None, get_ssl_expiry)
            not_after = cert.get('notAfter')
            await send_message(websocket, "finding", f"SSL is valid and active. Certificate expiry: {not_after}", "LOW", "ssl", 1)
        except Exception as e:
            await send_message(websocket, "finding", f"SSL Certificate issue: {e}", "HIGH", "ssl", 0)
    else:
        await send_message(websocket, "finding", "Target is not using HTTPS (No SSL)", "HIGH", "ssl", 0)

    await send_message(websocket, "judgment", "Technical analysis complete.", "INFO", "status", 0)
    return {"status": "done"}
