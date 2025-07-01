from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import HuggingFaceEmbeddings
from chromadb.config import Settings
import os
import shutil

# Configuration
CHROMA_DB_DIR = "./chroma_data" # Directory to persist ChromaDB data
COLLECTION_NAME_PREFIX = "docs_collection_" # Prefix for user-specific collections
EMBEDDING_MODEL_NAME = "BAAI/bge-small-en-v1.5"

# Initialize embedding function
# This can be time-consuming, so it's done once when the module is loaded.
try:
    embedding_function = HuggingFaceEmbeddings(
        model_name=EMBEDDING_MODEL_NAME,
        model_kwargs={'device': 'cpu'}, # Explicitly use CPU if GPU is not guaranteed or needed
        encode_kwargs={'normalize_embeddings': True}
    )
except Exception as e:
    print(f"Error initializing HuggingFaceEmbeddings: {e}")
    # Fallback or raise error, depending on desired behavior
    embedding_function = None

def get_vectorstore_for_user(user_id: str) -> Chroma | None:
    """
    Retrieves or creates a ChromaDB vector store for a specific user.
    Each user will have their own collection to ensure data isolation.
    """
    if not embedding_function:
        print("Embedding function not initialized. Cannot get vector store.")
        return None

    collection_name = f"{COLLECTION_NAME_PREFIX}{user_id}"
    persist_directory = os.path.join(CHROMA_DB_DIR, user_id)
    os.makedirs(persist_directory, exist_ok=True)

    try:
        vectorstore = Chroma(
            collection_name=collection_name,
            embedding_function=embedding_function,
            persist_directory=persist_directory,
            client_settings=Settings(
                anonymized_telemetry=False,
                is_persistent=True, # Ensure data is persisted
                # chroma_db_impl="duckdb+parquet", # Default, good for persistence
            )
        )
        return vectorstore
    except Exception as e:
        print(f"Error creating or loading vector store for user {user_id}: {e}")
        return None

def add_documents(user_id: str, documents: list) -> bool:
    """
    Adds document chunks to the specified user's vector store.
    'documents' is a list of Langchain Document objects.
    """
    if not documents:
        print(f"No documents provided to add for user {user_id}.")
        return False

    vectorstore = get_vectorstore_for_user(user_id)
    if not vectorstore:
        return False

    try:
        vectorstore.add_documents(documents=documents)
        # vectorstore.persist() # Ensure persistence after adding. Chroma client settings might handle this.
        print(f"Successfully added {len(documents)} chunks to user {user_id}'s collection.")
        return True
    except Exception as e:
        print(f"Error adding documents for user {user_id}: {e}")
        return False

def delete_documents_by_filename(user_id: str, filename: str) -> bool:
    """
    Deletes all document chunks associated with a specific filename from the user's vector store.
    This relies on the 'source' metadata field matching the filename.
    """
    vectorstore = get_vectorstore_for_user(user_id)
    if not vectorstore:
        return False

    try:
        # Chroma's API for deletion usually requires IDs. We need to get IDs based on metadata.
        # This can be inefficient for large collections if not directly supported.
        # Langchain's Chroma wrapper might offer a more direct way or one may need to use Chroma client directly.

        # Fetch all documents and filter by metadata (less efficient for very large DBs)
        # A more direct way with Chroma client: collection.delete(where={"source": filename})
        collection = vectorstore._collection # Access underlying Chroma collection
        results = collection.get(where={"source": filename}, include=[]) # Only need IDs
        ids_to_delete = results.get("ids", [])

        if not ids_to_delete:
            print(f"No documents found with filename '{filename}' for user {user_id} to delete.")
            return False

        collection.delete(ids=ids_to_delete)
        # vectorstore.persist() # Ensure persistence
        print(f"Successfully deleted documents with filename '{filename}' for user {user_id}.")
        return True
    except Exception as e:
        print(f"Error deleting documents for user {user_id} with filename '{filename}': {e}")
        return False

def similarity_search(user_id: str, query: str, k: int = 4) -> list:
    """
    Performs a similarity search in the user's vector store.
    Returns 'k' most similar document chunks.
    """
    vectorstore = get_vectorstore_for_user(user_id)
    if not vectorstore:
        return []

    try:
        results = vectorstore.similarity_search(query, k=k)
        print(f"Found {len(results)} similar documents for query by user {user_id}.")
        return results
    except Exception as e:
        print(f"Error during similarity search for user {user_id}: {e}")
        return []

def delete_user_collection(user_id: str) -> bool:
    """
    Deletes an entire collection for a user.
    Useful for GDPR or user data removal.
    Also removes the persisted directory.
    """
    try:
        # This is more of a Chroma client operation
        # For Langchain's wrapper, if it doesn't expose delete_collection,
        # one might need to get the client and call it.
        # Alternatively, just deleting the persist_directory might be enough
        # if the collection is not managed by a central Chroma server.

        # For a standalone Chroma setup as used here, deleting the directory is key.
        persist_directory = os.path.join(CHROMA_DB_DIR, user_id)
        if os.path.exists(persist_directory):
            shutil.rmtree(persist_directory)
            print(f"Successfully deleted persisted data for user {user_id} at {persist_directory}.")
            # Additionally, if using a Chroma client instance, you'd call:
            # client = chromadb.PersistentClient(path=CHROMA_DB_DIR_BASE_PATH_FOR_CLIENT_INIT)
            # client.delete_collection(name=f"{COLLECTION_NAME_PREFIX}{user_id}")
            return True
        else:
            print(f"No persisted data found for user {user_id} at {persist_directory}.")
            return False # Or True if non-existence is also success
    except Exception as e:
        print(f"Error deleting collection or data for user {user_id}: {e}")
        return False
