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

app = FastAPI()

from fastapi.middleware.cors import CORSMiddleware

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

    # Capture connections immediately
    ws_sentinel = manager.active_connections.get("sentinel")
    ws_stranger = manager.active_connections.get("stranger")
    ws_oracle = manager.active_connections.get("oracle")

    # Run agents asynchronously with direct references
    asyncio.create_task(run_all_agents(url, ws_sentinel, ws_stranger, ws_oracle))
    return {"status": "Analysis started"}

async def run_all_agents(url: str, ws_sentinel, ws_stranger, ws_oracle):
    # Direct references captured at the time of the POST request
    
    print(f"Sentinel WS: {ws_sentinel}")
    print(f"Stranger WS: {ws_stranger}")
    print(f"Oracle WS: {ws_oracle}")

    if not ws_sentinel or not ws_stranger or not ws_oracle:
        print("ERROR: One or more WebSocket connections missing!")
        return

    t1 = asyncio.create_task(run_sentinel(url, ws_sentinel))
    t2 = asyncio.create_task(run_stranger(url, ws_stranger))
    t3 = asyncio.create_task(run_oracle(url, ws_oracle))

    await asyncio.gather(t1, t2, t3, return_exceptions=True)
    
    # Collect results from agents
    # For now, we simulate scores based on task completion
    sentinel_score = 85
    stranger_score = 70
    oracle_score = 92

    # Generate the text summary
    summary_text = generate_verdict(sentinel_score, stranger_score, oracle_score, [])
    
    final_message = {
        "agent": "system",
        "type": "judgment",
        "content": {
            "sentence": summary_text,
            "overallScore": calculate_delphi_score(sentinel_score, stranger_score, oracle_score),
            "survivalProbability": calculate_delphi_score(sentinel_score, stranger_score, oracle_score) - 10,
            "scores": {
                "sentinel": sentinel_score,
                "stranger": stranger_score,
                "oracle": oracle_score
            },
            "fixes": generate_fixes([]) # Empty list as fallback
        }
    }
    
    await manager.broadcast(final_message)

@app.websocket("/ws/sentinel")
async def websocket_sentinel(websocket: WebSocket):
    await websocket_endpoint(websocket, "sentinel")

@app.websocket("/ws/stranger")
async def websocket_stranger(websocket: WebSocket):
    await websocket_endpoint(websocket, "stranger")

@app.websocket("/ws/oracle")
async def websocket_oracle(websocket: WebSocket):
    await websocket_endpoint(websocket, "oracle")

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
