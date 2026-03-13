import asyncio
import os
import json
from groq import Groq

client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

async def stream_reasoning(prompt: str, websocket, agent: str):
    loop = asyncio.get_event_loop()

    def call_groq():
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=200
        )
        return response.choices[0].message.content

    full_text = await loop.run_in_executor(None, call_groq)

    words = full_text.split()
    for word in words:
        message = json.dumps({
            "agent": agent,
            "type": "reasoning",
            "content": {
                "text": word + " ",
                "severity": "LOW",
                "category": "reasoning",
                "value": 0
            }
        })
        await websocket.send_text(message)
        await asyncio.sleep(0.05)