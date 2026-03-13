import asyncio
import websockets
import json
import requests

async def listen_agent(agent_name, url):
    uri = f"ws://127.0.0.1:8000/ws/{agent_name}"
    try:
        async with websockets.connect(uri) as websocket:
            print(f"[TEST CLIENT] Connected to {agent_name.upper()} stream")
            
            # Send URL as requested, though backend currently triggers via API
            await websocket.send(json.dumps({"url": url}))
            
            while True:
                message = await websocket.recv()
                try:
                    data = json.loads(message)
                except json.JSONDecodeError:
                    print(f"[{agent_name.upper()}] RAW: {message}")
                    continue
                    
                msg_type = data.get("type", "UNKNOWN").upper()
                content = data.get("content", {})
                severity = content.get("severity", "INFO")
                text = content.get("text", "")
                
                print(f"[{data.get('agent', agent_name).upper()}] [{msg_type}] [{severity}]: {text}")
    except websockets.exceptions.ConnectionClosed:
        print(f"[TEST CLIENT] {agent_name} connection closed.")
    except Exception as e:
        print(f"[TEST CLIENT] Error in {agent_name}: {e}")

async def main():
    target_url = "http://zepto.com"
    agents = ["sentinel", "stranger", "oracle"]
    
    print(f"--- Starting parallel agent testing on {target_url} ---")
    
    # 1. Start listening to websockets
    tasks = [asyncio.create_task(listen_agent(agent, target_url)) for agent in agents]
    
    # Wait briefly for connections to establish
    await asyncio.sleep(1)
    
    # 2. Trigger analysis via the REST API
    try:
        requests.post("http://127.0.0.1:8000/api/analyze", json={"url": target_url})
        print(f"[TEST CLIENT] Triggered analysis via API for {target_url}")
    except Exception as e:
        print(f"[TEST CLIENT] Failed to trigger API: {e}")
        
    # Let the analysis run
    await asyncio.sleep(15)
    
    print("--- Test Complete ---")
    for task in tasks:
        task.cancel()

if __name__ == "__main__":
    asyncio.run(main())
