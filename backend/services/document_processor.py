# backend/services/document_processor.py
import os
from langchain.document_loaders import PyPDFLoader, TextLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from .vectorstore import add_documents_to_vectorstore, embedding_function # Assuming add_documents_to_vectorstore will be created

# Supported loader types and their corresponding Langchain loaders
LOADER_MAPPING = {
    ".pdf": (PyPDFLoader, {}),
    ".txt": (TextLoader, {"encoding": "utf8"}),
    # Add more file types and their loaders here
    # ".docx": (UnstructuredWordDocumentLoader, {}),
    # ".csv": (CSVLoader, {"encoding": "utf8"}),
}

def load_single_document(file_path: str):
    """Loads a single document from a file path."""
    ext = "." + file_path.rsplit(".", 1)[-1].lower()
    if ext in LOADER_MAPPING:
        loader_class, loader_args = LOADER_MAPPING[ext]
        loader = loader_class(file_path, **loader_args)
        return loader.load()
    else:
        raise ValueError(f"Unsupported file extension: {ext}")

def process_document(file_path: str, user_id: str, filename: str):
    """
    Processes a document by loading, splitting, and adding it to the vector store.
    """
    try:
        docs = load_single_document(file_path)
        if not docs:
            print(f"No documents loaded from {file_path}")
            return

        # Add filename and user_id to metadata for each document/chunk
        for doc in docs:
            doc.metadata["source"] = filename
            doc.metadata["user_id"] = user_id

        text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
        splits = text_splitter.split_documents(docs)

        print(f"Splitting document {filename} into {len(splits)} chunks.")

        # Add to vector store
        add_documents_to_vectorstore(user_id, splits)
        print(f"Document {filename} processed and added to vector store for user {user_id}.")
        return True
    except Exception as e:
        print(f"Error processing document {filename} for user {user_id}: {e}")
        # Potentially re-raise or handle more gracefully
        raise
