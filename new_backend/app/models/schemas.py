from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

# --- Upload Endpoint ---
class UploadResponse(BaseModel):
    filename: str
    message: str
    user_id: str
    total_chunks_processed: int
    table_chunks_extracted: int
    text_sections_extracted: int

# --- Delete Endpoint ---
class DeleteRequest(BaseModel):
    user_id: str = Field(..., description="The ID of the user whose document is to be deleted.")
    filenames: List[str] = Field(..., description="A list of filenames to be deleted.")

class FileDeleteStatus(BaseModel):
    filename: str
    status: str # e.g., "deleted_from_storage", "deleted_from_vectorstore", "not_found", "error"
    message: Optional[str] = None

class DeleteResponse(BaseModel):
    user_id: str
    overall_message: str
    files_status: List[FileDeleteStatus]

# --- Query Endpoint ---
class QueryRequest(BaseModel):
    user_id: str = Field(..., description="The ID of the user making the query.")
    question: str = Field(..., description="The question to ask the documents.")
    top_k: int = Field(default=5, gt=0, le=20, description="Number of relevant document chunks to retrieve for context.") # Default k from user code was 15, but making it configurable here.

class SourceDocument(BaseModel):
    filename: str
    page: Optional[int] = None
    content_type: Optional[str] = None # e.g., "text_section", "table_chunk"
    section_title: Optional[str] = None
    table_page: Optional[int] = None # Page number if it's a table from Camelot/OCR
    preview: Optional[str] = None # Short preview of the content
    # Can add other relevant metadata from Langchain Document.metadata if needed
    # metadata: Dict[str, Any] # For more generic metadata if required

class QueryResponse(BaseModel):
    question: str
    answer: str
    sources: List[SourceDocument]
    user_id: str

# --- General ---
class HealthCheck(BaseModel):
    status: str = "OK"
    message: str = "API is healthy"
