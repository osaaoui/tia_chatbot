import os
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables from .env file if it exists
# Useful for local development
#env_path = Path(".") / ".env"
#load_dotenv(dotenv_path=env_path)
# This should resolve to the .env file location
env_path = Path(__file__).resolve().parents[3] / ".env"
load_dotenv(dotenv_path=env_path)

print(f"Loading .env from: {env_path}")

load_dotenv(dotenv_path=env_path)
class Settings:
    # OpenAI API Key
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY") # Fallback for safety

    # Model Names
    EMBEDDING_MODEL_NAME: str = "text-embedding-3-large"
    QA_MODEL_NAME: str = "gpt-4o-mini-2024-07-18" # As per user's provided code

    # File Paths
    # Define base path for data directories relative to the project root (new_backend)
    # This assumes the app is run from the 'new_backend' directory or this path is adjusted.
    # For robustness, consider making these absolute paths or configurable at runtime.
    BASE_DIR = Path(__file__).resolve().parent.parent.parent # Resolves to 'new_backend'

    STAGED_FILES_DIR: Path = BASE_DIR / "staged_files" # For files awaiting processing
    UPLOADED_FILES_DIR: Path = BASE_DIR / "uploaded_files" # For successfully processed files
    CHROMA_STORE_DIR: Path = BASE_DIR / "chroma_store"

    # Ensure data directories exist
    STAGED_FILES_DIR.mkdir(parents=True, exist_ok=True)
    UPLOADED_FILES_DIR.mkdir(parents=True, exist_ok=True)
    CHROMA_STORE_DIR.mkdir(parents=True, exist_ok=True)

    # Text processing
    TABLE_EXTRACTION_ROWS_PER_CHUNK: int = 10 # For chunking large tables

    # Logging (basic example, can be expanded)
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO").upper()


settings = Settings()

# Example of how to use:
if __name__ == "__main__":
    print(f"OpenAI API Key: {'*' * 5 + settings.OPENAI_API_KEY[-5:] if settings.OPENAI_API_KEY else 'Not Set'}")
    print(f"Embedding Model: {settings.EMBEDDING_MODEL_NAME}")
    print(f"QA Model: {settings.QA_MODEL_NAME}")
    print(f"Staged Files Directory: {settings.STAGED_FILES_DIR}")
    print(f"Uploaded (Processed) Files Directory: {settings.UPLOADED_FILES_DIR}")
    print(f"Chroma Store Directory: {settings.CHROMA_STORE_DIR}")
    print(f"Log Level: {settings.LOG_LEVEL}")

    # Test if directories are accessible
    if not settings.STAGED_FILES_DIR.exists():
        print(f"Warning: Staged files directory does not exist: {settings.STAGED_FILES_DIR}")
    if not settings.UPLOADED_FILES_DIR.exists():
        print(f"Warning: Uploaded (processed) files directory does not exist: {settings.UPLOADED_FILES_DIR}")
    if not settings.CHROMA_STORE_DIR.exists():
        print(f"Warning: Chroma store directory does not exist: {settings.CHROMA_STORE_DIR}")
