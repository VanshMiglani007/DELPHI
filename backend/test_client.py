import asyncio
import websockets
import json
import requests
import time

async def listen_agent(agent_name):
    uri = f"ws://localhost:8000/ws/{agent_name}"
    try:
        async with websockets.connect(uri) as websocket:
            print(f"Connected to {agent_name} stream")
            while True:
                message = await websocket.recv()
                data = json.loads(message)
                # Print nicely formatted
                text = data.get("content", {}).get("text", "")
                severity = data.get("content", {}).get("severity", "")
                msg_type = data.get("type", "")
                print(f"[{data.get('agent', agent_name).upper()}] {msg_type.upper()} ({severity}): {text}")
    except websockets.exceptions.ConnectionClosed:
        print(f"{agent_name} connection closed.")
    except Exception as e:
        pass # Ignore other errors for the simple test

async def trigger_analysis(url):
    print(f"\n--- Triggering analysis for {url} ---")
    response = requests.post("http://localhost:8000/api/analyze", json={"url": url})
    print("Response:", response.json())

async def main():
    # Connect to the three agent streams
    agents = ["sentinel", "stranger", "oracle"]
    tasks = [asyncio.create_task(listen_agent(agent)) for agent in agents]
    
    # Wait a second for connections to establish
    await asyncio.sleep(1)
    
    # Trigger analysis on a sample URL
    await trigger_analysis("http://example.com")
    
    # Let it run for a while
    await asyncio.sleep(15)
    print("\n--- Test Complete ---")
    
    # Cancel listener tasks
    for task in tasks:
        task.cancel()

if __name__ == "__main__":
    asyncio.run(main())
