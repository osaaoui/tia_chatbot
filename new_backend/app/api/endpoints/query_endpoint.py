import logging
from fastapi import APIRouter, HTTPException, Body

from ...services import qa_service
from ...models.schemas import QueryRequest, QueryResponse, SourceDocument
from ...core.config import settings

router = APIRouter()
logger = logging.getLogger(__name__)
logging.basicConfig(level=settings.LOG_LEVEL)

@router.post("/", response_model=QueryResponse)
async def query_documents_api(
    request: QueryRequest = Body(...) # Use Pydantic model for request body
):
    """
    Receives a question and user ID, retrieves relevant document context,
    and generates an answer using the QA service (RAG).
    """
    user_id = request.user_id
    question = request.question

    logger.info(f"Received query from user '{user_id}': '{question}'")

    if not question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    try:
        answer_text, source_docs_metadata = qa_service.get_answer(
            question=question,
            user_id=user_id
            # top_k for retriever is handled within qa_service calling vectorstore_service,
            # which defaults to k=15. If QueryRequest.top_k needs to be passed,
            # qa_service.get_answer and vectorstore_service.get_retriever would need to accept it.
            # For now, using the default k=15 from the original streamlit code's retriever.
        )
    except Exception as e:
        logger.error(f"Unhandled error in QA service for user '{user_id}', question '{question}': {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred while processing your query: {str(e)}")

    if answer_text is None:
        # This case might occur if LLM or other critical part of qa_service fails initialization or execution
        logger.error(f"QA service returned no answer for user '{user_id}', question '{question}'.")
        raise HTTPException(status_code=500, detail="Failed to generate an answer. The QA service might be misconfigured or unavailable.")

    # Transform source_docs_metadata (list of dicts) to List[SourceDocument]
    # The qa_service.get_answer now returns a list of dicts that should match SourceDocument fields
    sources_for_response: list[SourceDocument] = []
    for src_meta in source_docs_metadata:
        try:
            # Ensure all required fields for SourceDocument are present or provide defaults
            # 'filename' is the only strictly required field in SourceDocument model as defined.
            # Optional fields will be None if not present in src_meta.
            sources_for_response.append(SourceDocument(**src_meta))
        except Exception as e: # Catch Pydantic validation errors or others
            logger.warning(f"Could not parse source document metadata for user '{user_id}': {src_meta}. Error: {e}", exc_info=True)
            # Optionally, append a placeholder or skip this source
            sources_for_response.append(SourceDocument(filename=src_meta.get("filename", "Error parsing source")))


    return QueryResponse(
        question=question,
        answer=answer_text,
        sources=sources_for_response,
        user_id=user_id
    )
