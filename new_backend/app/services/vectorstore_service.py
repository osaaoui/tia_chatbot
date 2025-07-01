import logging
import os
from langchain_community.vectorstores import Chroma
from langchain_openai import OpenAIEmbeddings
from langchain.docstore.document import Document as LangchainDocument # For type hinting
from ..core.config import settings # Relative import from core

logger = logging.getLogger(__name__)
logging.basicConfig(level=settings.LOG_LEVEL)

from typing import Optional

# Initialize OpenAI Embeddings
# This will use the OPENAI_API_KEY from environment variables (via settings)
try:
    logger.info(f"Loaded OPENAI_API_KEY: {'SET' if settings.OPENAI_API_KEY else 'NOT SET'}")

    embeddings_model = OpenAIEmbeddings(
        model=settings.EMBEDDING_MODEL_NAME,
        openai_api_key=settings.OPENAI_API_KEY
    )
    logger.info(f"Successfully initialized OpenAIEmbeddings model: {settings.EMBEDDING_MODEL_NAME}")
except Exception as e:
    logger.error(f"Failed to initialize OpenAIEmbeddings: {e}. Ensure OPENAI_API_KEY is set.", exc_info=True)
    embeddings_model = None # Application might not function correctly without embeddings

def get_vectorstore(user_id: str, create_if_not_exists: bool = True) -> Optional[Chroma]:
    """
    Loads an existing ChromaDB vector store for a user or creates one if it doesn't exist.
    Data is persisted in user-specific directories.
    """
    if not embeddings_model:
        logger.error(f"Embeddings model not available for user {user_id}. Cannot get/create vector store.")
        return None

    user_persist_directory = settings.CHROMA_STORE_DIR / user_id

    if not user_persist_directory.exists():
        if create_if_not_exists:
            logger.info(f"No existing vector store found for user {user_id} at {user_persist_directory}. Creating new one.")
            user_persist_directory.mkdir(parents=True, exist_ok=True)
            # We can't just return an empty Chroma store without documents typically.
            # It's better to let it be created when documents are first added,
            # or initialize it empty if ChromaDB supports that well for persistence.
            # For now, we'll rely on from_documents or add_documents to create it.
            # A simple way to initialize an empty one that can be persisted:
            try:
                db = Chroma(
                    embedding_function=embeddings_model,
                    persist_directory=str(user_persist_directory)
                )
                # db.persist() # Ensure the directory structure is made if not already.
                logger.info(f"Created empty vector store for user {user_id} at {user_persist_directory}")
                return db
            except Exception as e:
                logger.error(f"Error creating empty vector store for user {user_id}: {e}", exc_info=True)
                return None
        else:
            logger.info(f"Vector store for user {user_id} does not exist and create_if_not_exists is False.")
            return None

    try:
        logger.info(f"Loading existing vector store for user {user_id} from {user_persist_directory}.")
        vectorstore = Chroma(
            persist_directory=str(user_persist_directory),
            embedding_function=embeddings_model
        )
        # Test if the collection is accessible (e.g. by trying a dummy get)
        # vectorstore.get(limit=1) # This might raise an error if collection doesn't exist or is empty
        logger.info(f"Successfully loaded vector store for user {user_id}.")
        return vectorstore
    except Exception as e:
        # This can happen if the directory exists but is corrupted or not a valid Chroma store
        logger.error(f"Error loading vector store for user {user_id} from {user_persist_directory}: {e}", exc_info=True)
        # Optionally, try to re-initialize or clean up
        return None


def add_documents_to_store(user_id: str, documents: list[LangchainDocument]) -> bool:
    """
    Adds a list of Langchain Document objects to the user's ChromaDB vector store.
    If the store doesn't exist, it will be created.
    """
    if not embeddings_model:
        logger.error(f"Embeddings model not available for user {user_id}. Cannot add documents.")
        return False
    if not documents:
        logger.warning(f"No documents provided to add for user {user_id}.")
        return True # Or False, depending on desired behavior for empty list

    user_persist_directory = str(settings.CHROMA_STORE_DIR / user_id)
    os.makedirs(user_persist_directory, exist_ok=True) # Ensure directory exists

    try:
        # Chroma.from_documents handles creation if store/collection doesn't exist,
        # or adds to existing if it does (though this behavior can vary with Chroma versions/config).
        # For more explicit control, one might load then add.
        # However, to ensure it appends or creates robustly:

        # Try to load existing store first
        vectorstore = get_vectorstore(user_id, create_if_not_exists=True) # It will create an empty one if not found
        if vectorstore:
            vectorstore.add_documents(documents=documents)
            logger.info(f"Added {len(documents)} documents to existing store for user {user_id}.")
        else: # Should not happen if get_vectorstore creates one, but as a fallback
            logger.info(f"No existing store, creating new store with documents for user {user_id}.")
            vectorstore = Chroma.from_documents(
                documents=documents,
                embedding=embeddings_model,
                persist_directory=user_persist_directory
            )

        vectorstore.persist() # Ensure changes are saved
        logger.info(f"Successfully added {len(documents)} documents and persisted store for user {user_id}.")
        return True
    except Exception as e:
        logger.error(f"Error adding documents to vector store for user {user_id}: {e}", exc_info=True)
        return False

def delete_documents_from_store(user_id: str, filenames: list[str]) -> bool:
    """
    Deletes documents from the user's ChromaDB where the 'source' metadata field matches any of the given filenames.
    """
    if not filenames:
        logger.info(f"No filenames provided for deletion for user {user_id}.")
        return True

    vectorstore = get_vectorstore(user_id, create_if_not_exists=False)
    if not vectorstore:
        logger.warning(f"Vector store not found for user {user_id}. Cannot delete documents.")
        return False # Or True if no store means documents are "deleted"

    try:
        # To delete by metadata, we typically need the document IDs.
        # We fetch documents that match the source metadata and then delete by their IDs.
        ids_to_delete_all_files = []
        for filename_to_delete in filenames:
            # Chroma's get method can filter by metadata using `where` clause
            # Example: where={"source": filename_to_delete}
            # This is more efficient than fetching all and filtering in Python.
            retrieved_docs = vectorstore.get(
                where={"source": filename_to_delete},
                include=[] # We only need IDs for deletion
            )
            ids_for_current_file = retrieved_docs.get("ids", [])
            if ids_for_current_file:
                logger.info(f"Found {len(ids_for_current_file)} embedding(s) for file '{filename_to_delete}' for user {user_id}.")
                ids_to_delete_all_files.extend(ids_for_current_file)
            else:
                logger.info(f"No embeddings found for file '{filename_to_delete}' for user {user_id}.")

        if not ids_to_delete_all_files:
            logger.info(f"No embeddings found matching any of the provided filenames for user {user_id}. Nothing to delete.")
            return True # Successfully "deleted" nothing

        vectorstore.delete(ids=ids_to_delete_all_files)
        vectorstore.persist() # Persist changes after deletion
        logger.info(f"Successfully deleted {len(ids_to_delete_all_files)} embeddings for user {user_id} corresponding to {len(filenames)} file(s).")
        return True
    except Exception as e:
        logger.error(f"Error deleting documents from vector store for user {user_id}: {e}", exc_info=True)
        return False

def get_retriever(user_id: str, search_type: str = "similarity", search_kwargs: Optional[dict] = None):
    """
    Returns a retriever object from the user's vector store.
    Default search_kwargs if not provided: {'k': 15} (as in user's code)
    """
    if search_kwargs is None:
        search_kwargs = {'k': 15}

    vectorstore = get_vectorstore(user_id, create_if_not_exists=False)
    if not vectorstore:
        logger.warning(f"Vector store not found for user {user_id}. Cannot create retriever.")
        return None

    try:
        retriever = vectorstore.as_retriever(search_type=search_type, search_kwargs=search_kwargs)
        logger.info(f"Successfully created retriever for user {user_id} with search_kwargs: {search_kwargs}")
        return retriever
    except Exception as e:
        logger.error(f"Error creating retriever for user {user_id}: {e}", exc_info=True)
        return None

if __name__ == '__main__':
    # Basic tests for vectorstore_service (requires OPENAI_API_KEY)
    # Ensure your .env file or environment has OPENAI_API_KEY set
    if not settings.OPENAI_API_KEY or settings.OPENAI_API_KEY == "your_openai_api_key_here":
        print("Skipping vectorstore_service tests: OPENAI_API_KEY not set.")
    elif not embeddings_model:
        print("Skipping vectorstore_service tests: Embeddings model failed to initialize.")
    else:
        print("Running vectorstore_service tests...")
        test_user = "test_user_vs"

        # Cleanup previous test data if any
        import shutil
        user_chroma_dir = settings.CHROMA_STORE_DIR / test_user
        if user_chroma_dir.exists():
            shutil.rmtree(user_chroma_dir)

        # Test get/create
        vs = get_vectorstore(test_user)
        assert vs is not None, "Failed to get/create vector store."
        print(f"Vector store for {test_user} obtained/created.")

        # Test add documents
        docs_to_add = [
            LangchainDocument(page_content="This is document 1 about apples.", metadata={"source": "doc1.txt"}),
            LangchainDocument(page_content="Document 2 discusses bananas.", metadata={"source": "doc2.txt"}),
            LangchainDocument(page_content="Another part of document 1 about red apples.", metadata={"source": "doc1.txt"}),
        ]
        added = add_documents_to_store(test_user, docs_to_add)
        assert added, "Failed to add documents."
        print(f"Added {len(docs_to_add)} documents.")

        # Test retriever and similarity search
        retriever = get_retriever(test_user)
        assert retriever is not None, "Failed to get retriever."
        results = retriever.invoke("Tell me about apples")
        assert len(results) > 0, "Similarity search returned no results."
        print(f"Retrieved {len(results)} documents for 'apples' query. First hit: {results[0].page_content}")
        assert "apple" in results[0].page_content.lower()

        # Test delete documents
        deleted = delete_documents_from_store(test_user, ["doc1.txt"])
        assert deleted, "Failed to delete documents for doc1.txt."
        print("Deleted documents for doc1.txt.")

        # Verify deletion
        retriever_after_delete = get_retriever(test_user)
        results_after_delete = retriever_after_delete.invoke("Tell me about apples")

        # Check if any remaining results are from doc1.txt
        found_doc1_after_delete = any(doc.metadata.get("source") == "doc1.txt" for doc in results_after_delete)
        assert not found_doc1_after_delete, "doc1.txt found after deletion."
        print("Verified doc1.txt is no longer retrieved for 'apples' query.")

        # Test deleting a non-existent document
        deleted_non_existent = delete_documents_from_store(test_user, ["non_existent.txt"])
        assert deleted_non_existent, "Deleting non-existent document should be 'successful' (no error)."
        print("Attempted to delete non-existent document, processed successfully.")

        # Clean up test user data
        if user_chroma_dir.exists():
            shutil.rmtree(user_chroma_dir)
        print(f"Cleaned up test data for user {test_user}.")
        print("vectorstore_service tests completed.")
