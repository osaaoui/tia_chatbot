from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from ...services import vectorstore_service, llm_service # Use relative imports

router = APIRouter()

class QueryRequest(BaseModel):
    user_id: str
    question: str
    top_k: int = 4 # Number of relevant chunks to retrieve

class QueryResponse(BaseModel):
    question: str
    answer: str
    sources: list[dict] # e.g., [{"filename": "doc1.pdf"}, {"filename": "doc2.txt"}]
    user_id: str

@router.post("/", response_model=QueryResponse)
async def query_documents_with_rag(request: QueryRequest):
    """
    Receives a question, retrieves relevant document chunks,
    and generates an answer using an LLM (RAG approach).
    """
    print(f"Received query: '{request.question}' for user '{request.user_id}'. Retrieving {request.top_k} chunks.")

    # 1. Retrieve relevant document chunks from vector store
    context_documents = vectorstore_service.similarity_search(
        user_id=request.user_id,
        query=request.question,
        k=request.top_k
    )

    if not context_documents:
        # It's possible no relevant documents are found.
        # llm_service.get_rag_response should handle this (e.g., by saying no context found or trying to answer without)
        print(f"No relevant documents found in vector store for query: '{request.question}', user '{request.user_id}'.")
        # Proceeding to LLM, which should handle the no-context case.

    # 2. Generate response using LLM with retrieved context
    print(f"Sending query and {len(context_documents)} context chunks to LLM for user '{request.user_id}'.")
    answer, sources = llm_service.get_rag_response(
        question=request.question,
        context_documents=context_documents,
        user_id=request.user_id
    )

    if not answer: # Or if answer indicates an error from LLM service
        raise HTTPException(status_code=500, detail="Failed to generate an answer using the LLM.")

    return QueryResponse(
        question=request.question,
        answer=answer,
        sources=sources,
        user_id=request.user_id
    )
