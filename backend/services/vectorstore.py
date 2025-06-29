from langchain.vectorstores import Chroma
from chromadb.config import Settings
from chromadb.utils.embedding_functions import DefaultEmbeddingFunction
from langchain_community.embeddings import HuggingFaceEmbeddings
import os
import shutil

embedding_function = HuggingFaceEmbeddings(model_name="BAAI/bge-small-en-v1.5")

def get_vectorstore(user_id: str):
    persist_dir = f"./chroma_db/{user_id}"
    os.makedirs(persist_dir, exist_ok=True)
    return Chroma(
        collection_name="softia_docs",
        embedding_function=embedding_function,
        persist_directory=persist_dir,
        client_settings=Settings(anonymized_telemetry=False)
    )

def delete_document_from_vectorstore(user_id: str, filename: str):
    db = get_vectorstore(user_id)
    collection = db._collection
    ids_to_delete = [doc["id"] for doc in collection.get()["metadatas"] if doc.get("source") == filename]
    if ids_to_delete:
        collection.delete(ids=ids_to_delete)