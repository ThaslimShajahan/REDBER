from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv
load_dotenv()

# Set Firebase Project ID for the whole process
if "FIREBASE_PROJECT_ID" in os.environ:
    os.environ["GOOGLE_CLOUD_PROJECT"] = os.environ["FIREBASE_PROJECT_ID"]

from .routers import bots, admin, ws_call

app = FastAPI(title="PersonaAI MVP Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", 
        "http://localhost:3001", 
        "http://127.0.0.1:3000",
        "http://localhost:4000",
        "https://redber.in",
        "https://www.redber.in",
        "http://redber.in",
        "http://www.redber.in"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(bots.router)
app.include_router(admin.router)
app.include_router(ws_call.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to PersonaAI API"}
