import sys
import asyncio

if sys.platform == 'win32':
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from core.crawler import DelphiCrawler
from core.ollama_client import stream_reasoning, get_completion
from core.prompts import generate_verdict, generate_fixes
from core.scorer import calculate_agent_score, calculate_delphi_score
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

    # Collect results from agents
    results = await asyncio.gather(t1, t2, t3, return_exceptions=True)
    
    # Extract findings from results
    sentinel_findings = results[0] if not isinstance(results[0], Exception) else []
    stranger_findings = results[1] if not isinstance(results[1], Exception) else []
    oracle_findings = results[2] if not isinstance(results[2], Exception) else []
    
    # Calculate scores
    sentinel_score = calculate_agent_score(sentinel_findings)
    stranger_score = calculate_agent_score(stranger_findings)
    oracle_score = calculate_agent_score(oracle_findings)
    
    all_findings = sentinel_findings + stranger_findings + oracle_findings
    top_finding_texts = [f['text'] for f in all_findings if f.get('severity') in ['CRITICAL', 'HIGH']]
    
    # Generate the text summary via LLM
    verdict_prompt = generate_verdict(sentinel_score, stranger_score, oracle_score, top_finding_texts)
    summary_text = await get_completion(verdict_prompt)
    
    # Generate fixes via LLM
    fixes_prompt = generate_fixes(all_findings)
    fixes_json_str = await get_completion(fixes_prompt)
    
    try:
        # Clean up possible markdown or whitespace
        clean_json = fixes_json_str.strip()
        if "```" in clean_json:
            clean_json = clean_json.split("```")[1]
            if clean_json.startswith("json"):
                clean_json = clean_json[4:]
        fixes = json.loads(clean_json)
    except Exception as e:
        print(f"Failed to parse fixes JSON: {e}")
        fixes = [] # Fallback
    
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
            "fixes": fixes
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
