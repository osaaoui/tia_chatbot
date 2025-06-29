from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.llm import get_rag_response

router = APIRouter()

class ChatRequest(BaseModel):
    question: str
    user_id: str

@router.post("/")
async def chat(request: ChatRequest):
    try:
        answer, sources = get_rag_response(request.question, request.user_id)
        return {"answer": answer, "sources": sources}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))