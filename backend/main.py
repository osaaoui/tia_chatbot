from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.endpoints import chat, upload, delete

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Adjust this to your frontend's URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat.router, prefix="/chat", tags=["chat"])
app.include_router(upload.router, prefix="/upload", tags=["upload"])
app.include_router(delete.router, prefix="/delete", tags=["delete"])