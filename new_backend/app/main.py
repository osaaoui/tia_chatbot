import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from .core.config import settings # For log level and CORS origins
from .api.endpoints import documents_endpoint, query_endpoint
from .models.schemas import HealthCheck # For health check response model

# Configure logging   log 2
logging.basicConfig(level=settings.LOG_LEVEL.upper())
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Document Interaction API (Refactored)",
    description="API for uploading, processing, deleting, and querying documents, refactored from Streamlit logic.",
    version="2.0.0",
    # docs_url="/docs", # Enable Swagger UI
    # redoc_url="/redoc" # Enable ReDoc
)

# CORS configuration
# Origins should be more specific in a production environment
# Example: settings.ALLOWED_ORIGINS if defined in config.py
allowed_origins = [
    "http://localhost:5173",  # Default React frontend (Vite)
    "http://localhost:3000",  # Common React frontend (CRA)
    "http://localhost:8080"
    # Add other frontend origins if necessary
]
if settings.OPENAI_API_KEY == "your_openai_api_key_here": # A simple check
    logger.warning("OPENAI_API_KEY is not set or using default placeholder. API functionality will be limited.")


app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"], # Allows all methods
    allow_headers=["*"], # Allows all headers
)

logger.info("Mounted query endpoint")

# Include API routers
app.include_router(documents_endpoint.router, prefix="/api/v2/documents", tags=["Documents"])
app.include_router(query_endpoint.router, prefix="/api/v2/query", tags=["Query"])

@app.get("/", tags=["Root"])
async def read_root():
    return {"message": "Welcome to the Refactored Document Interaction API! Visit /docs for API documentation."}

@app.get("/health", response_model=HealthCheck, tags=["Health Check"])
async def health_check():
    # This can be expanded to check database connections, etc.
    return HealthCheck(status="OK", message="API is healthy and running.")

for route in app.routes:
    print(route.path, route.methods)

if __name__ == "__main__":
    # This is for development run only using Uvicorn.
    # For production, use a process manager like Gunicorn with Uvicorn workers.
    # Example: gunicorn new_backend.app.main:app -w 4 -k uvicorn.workers.UvicornWorker -b 0.0.0.0:8000
    logger.info(f"Starting Uvicorn development server on http://0.0.0.0:8000")
    logger.info(f"Uploaded files will be stored in: {settings.UPLOADED_FILES_DIR}")
    logger.info(f"ChromaDB vector stores will be persisted in: {settings.CHROMA_STORE_DIR}")
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level=settings.LOG_LEVEL.lower())
