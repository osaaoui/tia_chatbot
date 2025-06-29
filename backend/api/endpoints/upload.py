# backend/api/endpoints/upload.py
from fastapi import APIRouter, UploadFile, File, HTTPException, Form
import os
import shutil
from services.document_processor import process_document

router = APIRouter()

UPLOAD_DIR = "uploaded_docs"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload/")
async def upload_file(file: UploadFile = File(...), user_id: str = Form("default_user")): # Added user_id
    try:
        file_path = os.path.join(UPLOAD_DIR, file.filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Process the document after successful upload
        process_document(file_path, user_id, file.filename)

        return {"filename": file.filename, "message": "Upload successful and processing started."}
    except Exception as e:
        # It's good practice to remove the uploaded file if processing fails
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=500, detail=f"Error during upload or processing: {str(e)}")
