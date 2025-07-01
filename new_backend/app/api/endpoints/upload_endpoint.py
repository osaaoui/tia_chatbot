from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from pydantic import BaseModel
import os
import shutil
from ...services import document_processor_service, vectorstore_service # Use relative imports for app structure

router = APIRouter()

UPLOAD_DIR = "./uploaded_files/" # Ensure this directory exists (created in step 1)
os.makedirs(UPLOAD_DIR, exist_ok=True)

class UploadResponse(BaseModel):
    filename: str
    message: str
    user_id: str
    chunks_added: int | None = None

@router.post("/", response_model=UploadResponse)
async def upload_and_process_file(
    user_id: str = Form(...),
    file: UploadFile = File(...)
):
    """
    Handles file upload, saves the file, processes it into chunks,
    and adds those chunks to the user-specific vector store.
    """
    file_location = os.path.join(UPLOAD_DIR, user_id)
    os.makedirs(file_location, exist_ok=True) # Create user-specific upload directory

    file_path = os.path.join(file_location, file.filename)

    try:
        with open(file_path, "wb+") as file_object:
            shutil.copyfileobj(file.file, file_object)
        print(f"File '{file.filename}' uploaded successfully to '{file_path}' for user '{user_id}'.")
    except Exception as e:
        print(f"Error saving uploaded file '{file.filename}': {e}")
        raise HTTPException(status_code=500, detail=f"Could not save file: {e}")
    finally:
        file.file.close() # Ensure the file stream is closed

    # Process the document
    print(f"Starting processing for '{file.filename}' for user '{user_id}'.")
    document_chunks = document_processor_service.load_and_split_document(
        file_path=file_path,
        filename=file.filename, # Pass the original filename for metadata
        user_id=user_id
    )

    if not document_chunks:
        # Optionally, delete the uploaded file if processing fails early
        # os.remove(file_path)
        print(f"Processing failed for '{file.filename}', no chunks produced.")
        raise HTTPException(status_code=500, detail=f"Failed to process document '{file.filename}'. No chunks were created.")

    # Add chunks to vector store
    print(f"Adding {len(document_chunks)} chunks of '{file.filename}' to vector store for user '{user_id}'.")
    success_add = vectorstore_service.add_documents(user_id=user_id, documents=document_chunks)

    if not success_add:
        # Optionally, delete the uploaded file if adding to vector store fails
        # os.remove(file_path)
        print(f"Failed to add document chunks of '{file.filename}' to vector store for user '{user_id}'.")
        raise HTTPException(status_code=500, detail=f"Could not add document chunks for '{file.filename}' to vector store.")

    return UploadResponse(
        filename=file.filename,
        message="File uploaded and processed successfully.",
        user_id=user_id,
        chunks_added=len(document_chunks)
    )
