from fastapi import APIRouter, Form
from services.vectorstore import delete_document_from_vectorstore

router = APIRouter()

@router.post("/")
async def delete_document(user_id: str = Form(...), filename: str = Form(...)):
    delete_document_from_vectorstore(user_id, filename)
    return {"status": "deleted"}