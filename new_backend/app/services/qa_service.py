import logging
from langchain_openai import ChatOpenAI
from langchain.chains import RetrievalQA
from langchain_core.prompts import ChatPromptTemplate

from . import vectorstore_service # Relative import for sibling service
from ..core.config import settings # Relative import for config

logger = logging.getLogger(__name__)
logging.basicConfig(level=settings.LOG_LEVEL)
from typing import Optional, Tuple, List, Dict

# Initialize ChatOpenAI LLM
# This will use OPENAI_API_KEY from environment (via settings)
try:
    llm = ChatOpenAI(
        openai_api_key=settings.OPENAI_API_KEY,
        model_name=settings.QA_MODEL_NAME, # e.g., "gpt-4o-mini-2024-07-18"
        temperature=0.1 # Lower temperature for more factual, less creative answers from RAG
    )
    logger.info(f"Successfully initialized ChatOpenAI model: {settings.QA_MODEL_NAME}")
except Exception as e:
    logger.error(f"Failed to initialize ChatOpenAI: {e}. Ensure OPENAI_API_KEY is set.", exc_info=True)
    llm = None

# Define the prompt template from user's provided code
# Note: The user's prompt has specific instructions for Spanish if context is not found.
# This needs to be handled carefully, potentially by detecting question language or always using a neutral "not found".
# For simplicity here, the direct template is used. Language detection is out of scope for this step.
PROMPT_TEMPLATE_STR = """
You are a helpful assistant. Use the context below to answer the question accurately.

If a section title like "Introduction", "Methods", or "Conclusion" is relevant, consider it carefully.

Context:
{context}

Question:
{question}

If the answer is not in the context, say in the language of the user that you "couldn't find the answer in the documents."
if the language is spanish and the answer is not in the context, say this: "Lo siento,no tengo respuesta para tu consulta. ¿Podrías darme un poco más de detalle o decirlo de otra forma ?"
"""
# It's generally better to handle multi-language responses based on detected input language,
# or to have separate prompts if language is known. The above prompt tries to embed this logic.

prompt_template = ChatPromptTemplate.from_template(PROMPT_TEMPLATE_STR)

def get_answer(question: str, user_id: str) -> Tuple[Optional[str], List[Dict]]:
    """
    Answers a question based on documents in the user's vector store using RAG.

    Args:
        question: The user's question.
        user_id: The ID of the user.

    Returns:
        A tuple containing:
            - answer (str | None): The LLM-generated answer, or None if an error occurs.
            - sources (list[dict]): A list of source document metadata that contributed to the answer.
    """
    if not llm:
        logger.error(f"LLM not available for user {user_id}. Cannot generate answer.")
        return "LLM is not configured or available.", []

    logger.info(f"Received question from user '{user_id}': '{question}'")

    # 1. Get the retriever for the user
    # Using search_kwargs as defined in user's original get_qa_chain: {'k': 15}
    retriever = vectorstore_service.get_retriever(user_id, search_kwargs={'k': 15})
    if not retriever:
        logger.warning(f"Could not get retriever for user {user_id}. Answering without document context might be unreliable or not possible.")
        # Fallback: answer without context, or inform user context is unavailable.
        # For now, let the RetrievalQA chain handle it (it might get no docs).
        # If retriever is None, it means no vector store, so no context.
        # The prompt asks LLM to state if answer not in context.
        # To be absolutely sure no error, we can return a specific message:
        return "Could not access your documents to answer the question. Please ensure documents are processed.", []


    # 2. Create RetrievalQA chain
    try:
        qa_chain = RetrievalQA.from_chain_type(
            llm=llm,
            chain_type="stuff", # "stuff" is good for smaller contexts that fit in one prompt
            retriever=retriever,
            chain_type_kwargs={"prompt": prompt_template},
            return_source_documents=True # We need this to list sources
        )
        logger.debug(f"RetrievalQA chain created for user {user_id}.")
    except Exception as e:
        logger.error(f"Error creating RetrievalQA chain for user {user_id}: {e}", exc_info=True)
        return "Error setting up the question answering process.", []

    # 3. Invoke the chain to get the result
    try:
        result = qa_chain.invoke({"query": question}) # 'query' is the default input key for RetrievalQA
        answer = result.get("result")

        source_documents_data = []
        if result.get("source_documents"):
            for doc in result["source_documents"]:
                source_info = {
                    "filename": doc.metadata.get("original_source", doc.metadata.get("source", "Unknown")),
                    "page": doc.metadata.get("page", None), # PyPDFLoader adds 'page'
                    "content_type": doc.metadata.get("content_type", "text"),
                    "section_title": doc.metadata.get("section_title", None), # If from section splitting
                    "table_page": doc.metadata.get("table_page", None), # If from table extraction
                    "preview": doc.page_content[:200] + "..." # Short preview
                }
                # Filter out None values from metadata for cleaner output
                source_info = {k: v for k, v in source_info.items() if v is not None}
                source_documents_data.append(source_info)

        logger.info(f"Successfully generated answer for user '{user_id}'. Answer length: {len(answer) if answer else 0}, Sources found: {len(source_documents_data)}")
        return answer, source_documents_data

    except Exception as e:
        logger.error(f"Error invoking RetrievalQA chain for user {user_id} with question '{question}': {e}", exc_info=True)
        return "An error occurred while trying to find an answer.", []


if __name__ == '__main__':
    # This test requires:
    # 1. OPENAI_API_KEY in environment or .env file.
    # 2. A ChromaDB store for 'test_qa_user' with some documents already processed and added.
    #    (This could be done by running vectorstore_service.py tests or uploading via API first)

    if not settings.OPENAI_API_KEY or settings.OPENAI_API_KEY == "your_openai_api_key_here":
        print("Skipping qa_service tests: OPENAI_API_KEY not set.")
    elif not llm:
        print("Skipping qa_service tests: LLM failed to initialize.")
    else:
        print("Running qa_service tests...")
        test_user_id_qa = "test_qa_user"

        # Pre-requisite: Ensure vectorstore_service can create/load a store for this user
        # and it has some data. For an isolated test, we might mock the retriever
        # or ensure `vectorstore_service.py` main block was run to populate data for a test user.

        # Let's first add some dummy data using vectorstore_service directly for this test
        from ..core.config import settings as vs_settings # to avoid name clash
        from .vectorstore_service import add_documents_to_store, get_vectorstore, delete_documents_from_store
        from langchain.docstore.document import Document as LangchainDocument
        import shutil

        # Clean up and set up dummy store for qa_service test
        user_chroma_dir_qa = vs_settings.CHROMA_STORE_DIR / test_user_id_qa
        if user_chroma_dir_qa.exists():
            shutil.rmtree(user_chroma_dir_qa)

        vs_qa = get_vectorstore(test_user_id_qa) # Create if not exists
        if vs_qa:
            docs_for_qa = [
                LangchainDocument(page_content="The company policy states that all employees must attend safety training annually.", metadata={"original_source": "policy.pdf", "page": 1}),
                LangchainDocument(page_content="Financial reports are due by the 5th of each month.", metadata={"original_source": "finance_guide.pdf", "page": 10, "section_title": "Reporting Deadlines"}),
                LangchainDocument(page_content="For IT support, please contact helpdesk@example.com.", metadata={"original_source": "it_faq.pdf", "page": 2})
            ]
            add_success = add_documents_to_store(test_user_id_qa, docs_for_qa)
            if not add_success:
                print("Failed to add dummy documents for QA test. Aborting QA test.")
            else:
                print(f"Dummy documents added for user '{test_user_id_qa}'.")

                # Test 1: Question with expected answer from context
                question1 = "What is the company policy on safety training?"
                print(f"\nTesting Q1: {question1}")
                answer1, sources1 = get_answer(question1, test_user_id_qa)
                print(f"Answer 1: {answer1}")
                print(f"Sources 1: {sources1}")
                assert answer1 and "safety training" in answer1.lower(), "Q1 failed or answer incorrect."
                assert len(sources1) > 0 and sources1[0]['filename'] == "policy.pdf", "Q1 sources incorrect."

                # Test 2: Question where answer might not be in context
                question2 = "What is the CEO's name?"
                print(f"\nTesting Q2: {question2}")
                answer2, sources2 = get_answer(question2, test_user_id_qa)
                print(f"Answer 2: {answer2}") # Should indicate not found
                print(f"Sources 2: {sources2}") # Should be empty or reflect search attempts
                # Check if it says "couldn't find" or similar, as per prompt
                assert "couldn't find" in answer2.lower() or "no tengo respuesta" in answer2.lower(), "Q2 'not found' response failed."

                # Test 3: Question in Spanish (to test the prompt's Spanish "not found" clause)
                question3_es = "¿Cuál es el nombre del CEO?" # Same as Q2, but in Spanish
                print(f"\nTesting Q3 (Spanish 'not found'): {question3_es}")
                answer3_es, sources3_es = get_answer(question3_es, test_user_id_qa)
                print(f"Answer 3 (Spanish): {answer3_es}")
                print(f"Sources 3 (Spanish): {sources3_es}")
                assert "lo siento" in answer3_es.lower() or "no tengo respuesta" in answer3_es.lower() or "couldn't find" in answer3_es.lower(), "Q3 Spanish 'not found' response failed."

        else:
            print(f"Could not initialize vector store for qa_service test user '{test_user_id_qa}'. Skipping QA tests.")

        # Clean up test user data after QA tests
        if user_chroma_dir_qa.exists():
            shutil.rmtree(user_chroma_dir_qa)
        print(f"Cleaned up test data for user {test_user_id_qa} after QA tests.")
        print("qa_service tests completed.")
