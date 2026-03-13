import sys
import asyncio

if sys.platform == 'win32':
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from core.crawler import DelphiCrawler
from core.scorer import calculate_delphi_score
from core.prompts import generate_verdict, generate_fixes
from agents.sentinel import run_sentinel
from agents.stranger import run_stranger
from agents.oracle import run_oracle

app = FastAPI(title="DELPHI Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[str, WebSocket] = {}

    async def connect(self, agent: str, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[agent] = websocket

    def disconnect(self, agent: str):
        if agent in self.active_connections:
            del self.active_connections[agent]

    async def broadcast(self, message: dict):
        for ws in self.active_connections.values():
            try:
                await ws.send_json(message)
            except:
                pass

manager = ConnectionManager()

class AnalyzePayload(BaseModel):
    url: str

@app.on_event("startup")
async def startup_event():
    # To prevent immediate failure if playwright isn't installed yet,
    # avoid full initialization here. The crawler will auto-initialize 
    # when get_page() is called for the first time.
    pass

@app.on_event("shutdown")
async def shutdown_event():
    pass

@app.post("/api/analyze")
async def start_analysis(payload: AnalyzePayload):
    url = payload.url
    if not url:
        return {"error": "No URL provided"}

    # Run agents asynchronously
    asyncio.create_task(run_all_agents(url))
    return {"status": "Analysis started"}

async def run_all_agents(url: str):
    # Wait briefly for UI to establish websockets if needed
    await asyncio.sleep(1)
    
    ws_sentinel = manager.active_connections.get("sentinel")
    ws_stranger = manager.active_connections.get("stranger")
    ws_oracle = manager.active_connections.get("oracle")

    t1 = asyncio.create_task(run_sentinel(url, ws_sentinel))
    t2 = asyncio.create_task(run_stranger(url, ws_stranger))
    t3 = asyncio.create_task(run_oracle(url, ws_oracle))

    await asyncio.gather(t1, t2, t3)
    
    # Generate final verdict using the new prompt logic
    verdict = generate_verdict(60, 50, 75, [])
    final_message = {
        "agent": "system",
        "type": "judgment",
        "content": {
            "text": verdict,
            "severity": "INFO",
            "category": "final",
            "value": calculate_delphi_score(60, 50, 75)
        }
    }
    
    await manager.broadcast(final_message)

@app.websocket("/ws/{agent_name}")
async def websocket_endpoint(websocket: WebSocket, agent_name: str):
    await manager.connect(agent_name, websocket)
    try:
        while True:
            # Keep connection alive
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(agent_name)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False, loop="asyncio")
