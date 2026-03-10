from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import bots, admin

app = FastAPI(title="PersonaAI MVP Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(bots.router)
app.include_router(admin.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to PersonaAI API"}
