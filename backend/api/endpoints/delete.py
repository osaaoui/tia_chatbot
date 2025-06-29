from fastapi import APIRouter, Form, HTTPException
from services.vectorstore import delete_document_from_vectorstore
import os

router = APIRouter()
UPLOAD_DIR = "uploaded_docs" # Make sure this matches the upload endpoint

@router.post("/")
async def delete_document(user_id: str = Form(...), filename: str = Form(...)):
    try:
        # Delete from vector store
        delete_document_from_vectorstore(user_id, filename)

        # Delete the actual file
        file_path = os.path.join(UPLOAD_DIR, filename)
        if os.path.exists(file_path):
            os.remove(file_path)
            status_message = f"Document '{filename}' and its vector embeddings deleted successfully."
        else:
            status_message = f"Vector embeddings for '{filename}' deleted. File not found in upload directory."
            # Optionally, you might want to log this as a warning or inconsistency.

        return {"status": "success", "message": status_message}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting document: {str(e)}")