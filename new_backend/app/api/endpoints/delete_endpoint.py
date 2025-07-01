from fastapi import APIRouter, HTTPException, Form
from pydantic import BaseModel
import os
from ...services import vectorstore_service # Use relative imports

router = APIRouter()

UPLOAD_DIR = "./uploaded_files/" # Must match the UPLOAD_DIR in upload_endpoint.py

class DeleteResponse(BaseModel):
    filename: str
    message: str
    user_id: str

@router.post("/", response_model=DeleteResponse)
async def delete_file_and_embeddings(
    user_id: str = Form(...),
    filename: str = Form(...)
):
    """
    Deletes a specified file from the filesystem and its corresponding
    embeddings from the vector store.
    """
    file_path = os.path.join(UPLOAD_DIR, user_id, filename) # Assumes user-specific subdirectories for uploads

    file_deleted_fs = False
    if os.path.exists(file_path):
        try:
            os.remove(file_path)
            file_deleted_fs = True
            print(f"File '{filename}' deleted from filesystem for user '{user_id}'.")
        except Exception as e:
            print(f"Error deleting file '{filename}' from filesystem for user '{user_id}': {e}")
            # Decide if this is a critical error or if we should proceed to delete embeddings
            # For now, let's raise, as inability to delete the file is problematic.
            raise HTTPException(status_code=500, detail=f"Error deleting file from storage: {e}")
    else:
        print(f"File '{filename}' not found in filesystem for user '{user_id}'. Proceeding to delete embeddings.")
        # This might be acceptable if embeddings can exist without a file, or a warning.

    # Delete document chunks from vector store
    print(f"Attempting to delete embeddings for '{filename}' for user '{user_id}'.")
    embeddings_deleted = vectorstore_service.delete_documents_by_filename(
        user_id=user_id,
        filename=filename
    )

    if not embeddings_deleted and not file_deleted_fs:
        # If file wasn't on FS and embeddings weren't found either
        raise HTTPException(status_code=404, detail=f"Document '{filename}' not found in storage or vector store for user '{user_id}'.")

    if not embeddings_deleted and file_deleted_fs:
        # File was deleted, but no embeddings found (or error deleting them)
        # This could be a partial success or an issue depending on strictness
        message = f"File '{filename}' deleted from filesystem, but no embeddings were found or an error occurred during their deletion."
        print(message)
        # Not raising an exception here as the primary file is gone. Client should be informed.
    elif embeddings_deleted and not file_deleted_fs:
        message = f"Embeddings for '{filename}' deleted, but the original file was not found on the filesystem."
        print(message)
    else: # Both successful
        message = f"File '{filename}' and its embeddings successfully deleted for user '{user_id}'."
        print(message)

    return DeleteResponse(
        filename=filename,
        message=message,
        user_id=user_id
    )
