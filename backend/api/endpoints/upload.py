# backend/api/endpoints/upload.py
from fastapi import APIRouter, UploadFile, File, HTTPException
import os
import shutil

router = APIRouter()

UPLOAD_DIR = "uploaded_docs"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload/")
async def upload_file(file: UploadFile = File(...)):
    try:
        file_path = os.path.join(UPLOAD_DIR, file.filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        # Optionally: call your document_processor service here to parse/embed
        return {"filename": file.filename, "message": "Upload successful"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
