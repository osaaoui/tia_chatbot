from langchain_community.document_loaders import PyPDFLoader, TextLoader, UnstructuredWordDocumentLoader, CSVLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.docstore.document import Document as LangchainDocument
import os

# Supported loader types and their corresponding Langchain loaders and arguments
LOADER_MAPPING = {
    ".pdf": (PyPDFLoader, {}),
    ".txt": (TextLoader, {"encoding": "utf8"}),
    ".md": (TextLoader, {"encoding": "utf8"}),
    ".docx": (UnstructuredWordDocumentLoader, {}),
    ".doc": (UnstructuredWordDocumentLoader, {}),
    # ".csv": (CSVLoader, {"encoding": "utf8"}), # CSVs might need specific column handling
    # Add more file types and their loaders here if needed
}

DEFAULT_CHUNK_SIZE = 1000
DEFAULT_CHUNK_OVERLAP = 200

def load_and_split_document(file_path: str, filename: str, user_id: str,
                            chunk_size: int = DEFAULT_CHUNK_SIZE,
                            chunk_overlap: int = DEFAULT_CHUNK_OVERLAP) -> list[LangchainDocument] | None:
    """
    Loads a document from a file path, splits it into chunks, and adds metadata.
    Returns a list of Langchain Document objects (chunks), or None if loading fails.
    """
    try:
        file_ext = "." + file_path.rsplit(".", 1)[-1].lower()
        if file_ext not in LOADER_MAPPING:
            print(f"Unsupported file extension: {file_ext} for file {filename}")
            return None

        loader_class, loader_args = LOADER_MAPPING[file_ext]
        loader = loader_class(file_path, **loader_args)
        raw_documents = loader.load()

        if not raw_documents:
            print(f"No documents loaded from {filename}")
            return None

        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap
        )

        split_documents = text_splitter.split_documents(raw_documents)

        # Add common metadata to all chunks
        for doc_chunk in split_documents:
            doc_chunk.metadata["source"] = filename  # Original filename
            doc_chunk.metadata["user_id"] = user_id
            # doc_chunk.metadata["file_path"] = file_path # Optionally store full path if needed

        print(f"Successfully loaded and split '{filename}' into {len(split_documents)} chunks for user {user_id}.")
        return split_documents

    except Exception as e:
        print(f"Error loading or splitting document {filename} for user {user_id}: {e}")
        return None

# Example usage (for testing this module independently)
if __name__ == '__main__':
    # Create dummy files for testing
    if not os.path.exists("dummy_docs"):
        os.makedirs("dummy_docs")

    with open("dummy_docs/sample.txt", "w") as f:
        f.write("This is a test document. It has multiple sentences. " * 50)
        f.write("The purpose is to test the document processing service. " * 50)

    # Test .txt
    chunks_txt = load_and_split_document("./dummy_docs/sample.txt", "sample.txt", "test_user")
    if chunks_txt:
        print(f"Text document: Found {len(chunks_txt)} chunks. First chunk metadata: {chunks_txt[0].metadata}")

    # To test PDF, you'd need a sample.pdf file in dummy_docs
    # e.g. chunks_pdf = load_and_split_document("./dummy_docs/sample.pdf", "sample.pdf", "test_user")
    # if chunks_pdf:
    #     print(f"PDF document: Found {len(chunks_pdf)} chunks. First chunk metadata: {chunks_pdf[0].metadata}")

    # Clean up dummy files
    # shutil.rmtree("dummy_docs") # If you want to clean up
    pass
