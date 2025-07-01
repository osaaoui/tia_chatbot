from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

# Import routers
from .api.endpoints import upload_endpoint, delete_endpoint, query_endpoint

app = FastAPI(
    title="Document Interaction API",
    description="API for uploading, processing, deleting, and querying documents.",
    version="1.0.0"
)

# CORS configuration
origins = [
    "http://localhost:5173",  # Assuming frontend runs on this port
    "http://localhost:3000",  # Another common frontend port
    # Add other origins if necessary
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/", tags=["Root"])
async def read_root():
    return {"message": "Welcome to the Document Interaction API!"}

# Include API routers
app.include_router(upload_endpoint.router, prefix="/api/v1/upload", tags=["Upload"])
app.include_router(delete_endpoint.router, prefix="/api/v1/delete", tags=["Delete"])
app.include_router(query_endpoint.router, prefix="/api/v1/query", tags=["Query"])

if __name__ == "__main__":
    # This is for development run only.
    # For production, use a process manager like Gunicorn or Uvicorn directly.
    uvicorn.run(app, host="0.0.0.0", port=8000)
