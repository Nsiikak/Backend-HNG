from fastapi import FastAPI, Response
from fastapi.staticfiles import StaticFiles
import requests
from datetime import datetime, timezone
import os
from dotenv import load_dotenv
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder
import json

# Load environment variables
load_dotenv()

app = FastAPI(title="Backend Wizards Stage 0 API")

# Serve static files (for favicon)
app.mount("/static", StaticFiles(directory="static"), name="static")

# Root endpoint
@app.get("/")
def root():
    return {"message": "Welcome to Backend Wizards Stage 0 API!"}

# Profile endpoint
@app.get("/me")
def get_profile(response: Response):
    response.headers["Content-Type"] = "application/json"
    user.email = os.getenv("MY_EMAIL")
    user.name = os.getenv("MY_NAME")
    user.stack = os.getenv("MY_STACK")

    # Current UTC timestamp
    timestamp = datetime.now(timezone.utc).isoformat()

    # Fetch cat fact
    cat_fact_url = "https://catfact.ninja/fact"
    try:
        cat_response = requests.get(cat_fact_url, timeout=5)
        cat_response.raise_for_status()
        cat_fact = cat_response.json().get("fact", "No cat fact available.")
    except Exception:
        cat_fact = "Could not fetch cat fact at this time."

    data = {
        "status": "success",
        "user": {
            "email": email,
            "name": name,
            "stack": stack
        },
        "timestamp": timestamp,
        "fact": cat_fact
    }
    # Pretty-print JSON
    pretty_json = json.dumps(jsonable_encoder(data), indent=2)
    return JSONResponse(content=json.loads(pretty_json))

# Optional favicon route (browser-friendly)
@app.get("/favicon.ico")
def favicon():
    return {"message": "No favicon provided"}  
