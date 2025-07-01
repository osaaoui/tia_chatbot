import os
import tempfile
import logging
from langchain_community.document_loaders import PyPDFLoader
from langchain.docstore.document import Document as LangchainDocument

from ..core.config import settings # Relative import from core
from ..core.utils import split_by_sections, extract_tables_from_pdf # Relative import from utils

logger = logging.getLogger(__name__)
logging.basicConfig(level=settings.LOG_LEVEL)

def process_uploaded_pdf(
    uploaded_file_path: str, # Path to the already saved uploaded file
    original_filename: str,
    user_id: str # For logging or future user-specific processing rules
) -> list[LangchainDocument]:
    """
    Processes a single uploaded PDF file:
    1. Loads PDF content using PyPDFLoader.
    2. Splits text content by sections using custom logic.
    3. Extracts tables using Camelot with OCR fallback.
    4. Combines all processed parts into a list of Langchain Document objects.

    Args:
        uploaded_file_path: The path to the PDF file saved on the server.
        original_filename: The original name of the uploaded file (for metadata).
        user_id: Identifier for the user who uploaded the file.

    Returns:
        A list of Langchain Document objects, ready for embedding and storage.
        Returns an empty list if processing fails or no content is extracted.
    """
    processed_documents: list[LangchainDocument] = []

    logger.info(f"Starting processing for PDF: '{original_filename}' for user '{user_id}' from path: {uploaded_file_path}")

    try:
        # 1. Load PDF text content
        logger.debug(f"Loading PDF content from: {uploaded_file_path}")
        loader = PyPDFLoader(uploaded_file_path)
        raw_docs_from_pdf = loader.load()
        logger.info(f"Loaded {len(raw_docs_from_pdf)} raw pages/documents from '{original_filename}'.")

        # 2. Process text content (split by sections)
        for raw_doc in raw_docs_from_pdf:
            page_content = raw_doc.page_content
            source_metadata = { # Base metadata from PyPDFLoader
                **raw_doc.metadata, # Includes 'source' (path) and 'page'
                "original_source": original_filename, # Add original filename
                "user_id": user_id,
                "content_type": "text_section"
            }

            sections = split_by_sections(page_content)
            if sections:
                for section_title, section_text in sections:
                    # Create a new document for each section
                    section_doc = LangchainDocument(
                        page_content=f"# {section_title}\n\n{section_text}", # Add title to content
                        metadata={
                            **source_metadata,
                            "section_title": section_title,
                        }
                    )
                    processed_documents.append(section_doc)
                logger.debug(f"Split page {source_metadata.get('page', 'N/A')} into {len(sections)} sections.")
            else:
                # If no sections detected, add the whole page content as one document
                logger.debug(f"No sections found on page {source_metadata.get('page', 'N/A')}, adding as whole.")
                plain_text_doc = LangchainDocument(
                    page_content=page_content,
                    metadata=source_metadata
                )
                processed_documents.append(plain_text_doc)

        logger.info(f"Processed text content from '{original_filename}', generated {len(processed_documents)} text documents.")

        # 3. Extract and process tables
        # extract_tables_from_pdf expects a file path.
        logger.info(f"Starting table extraction for '{original_filename}'.")
        table_chunks_data = extract_tables_from_pdf(uploaded_file_path, original_filename)

        for table_data in table_chunks_data:
            # table_data is a dict with "content" and "metadata"
            # "metadata" from extract_tables_from_pdf already includes "original_source"
            table_doc = LangchainDocument(
                page_content=table_data["content"],
                metadata={
                    **table_data["metadata"], # Contains original_source, table_page, etc.
                    "user_id": user_id,
                    "content_type": "table_chunk"
                }
            )
            processed_documents.append(table_doc)
        logger.info(f"Extracted {len(table_chunks_data)} table chunks from '{original_filename}'.")

    except Exception as e:
        logger.error(f"Error during processing of '{original_filename}' for user '{user_id}': {e}", exc_info=True)
        # Depending on desired behavior, could raise exception or return partially processed docs.
        # For now, return what has been processed so far, or an empty list if major failure.
        return processed_documents # Or [] if preferred to signify complete failure

    logger.info(f"Successfully processed '{original_filename}'. Total documents/chunks created: {len(processed_documents)}.")
    return processed_documents


from pathlib import Path # Added for __main__ block

if __name__ == '__main__':
    # This part requires a sample PDF and environment setup for dependent libraries (OpenAI key for config, etc.)
    # For direct testing, you'd set up a .env file or ensure OPENAI_API_KEY is in your environment.
    # And ensure poppler, tesseract, ghostscript are installed for table extraction.

    print("Testing processing_service...")

    # Create a dummy PDF file for testing (simplified)
    # In a real test, you would use an actual PDF file.
    # For this example, we'll mock the file path and assume it exists.

    current_dir = Path(__file__).parent
    dummy_pdf_filename = "dummy_test_pdf.pdf"
    # You would need to place a real PDF named 'dummy_test_pdf.pdf' in the same directory
    # as this script (or provide a full path) for the test to run.
    # For instance, copy a small PDF into `new_backend/app/services/` for the test.

    dummy_pdf_path_for_test = str(current_dir / dummy_pdf_filename)

    if not os.path.exists(dummy_pdf_path_for_test):
        print(f"Test PDF '{dummy_pdf_filename}' not found at '{dummy_pdf_path_for_test}'. Skipping process_uploaded_pdf test.")
    elif not settings.OPENAI_API_KEY or settings.OPENAI_API_KEY == "your_openai_api_key_here":
         print("OPENAI_API_KEY not set. Skipping process_uploaded_pdf test as config might be incomplete for utils.")
    else:
        print(f"Attempting to process test PDF: {dummy_pdf_path_for_test}")
        test_user_id = "test_proc_user"

        # Create dummy uploaded file directory for the test user if it doesn't exist
        # (though process_uploaded_pdf doesn't write, it reads from here)
        # test_upload_dir = settings.UPLOADED_FILES_DIR / test_user_id
        # test_upload_dir.mkdir(parents=True, exist_ok=True)
        # dummy_target_path = test_upload_dir / dummy_pdf_filename
        # import shutil
        # shutil.copy(dummy_pdf_path_for_test, dummy_target_path) # copy to a simulated uploaded location

        # For this test, we pass the local path directly
        processed_docs = process_uploaded_pdf(dummy_pdf_path_for_test, dummy_pdf_filename, test_user_id)

        if processed_docs:
            print(f"\nSuccessfully processed '{dummy_pdf_filename}', generated {len(processed_docs)} chunks.")
            for i, doc in enumerate(processed_docs[:3]): # Print first 3 chunks
                print(f"\nChunk {i+1}:")
                print(f"  Content Preview: {doc.page_content[:150]}...")
                print(f"  Metadata: {doc.metadata}")
        else:
            print(f"\nProcessing '{dummy_pdf_filename}' resulted in no documents or an error occurred.")

        # Clean up dummy target path if created
        # if os.path.exists(dummy_target_path):
        #     os.remove(dummy_target_path)
        # if test_upload_dir.exists() and not os.listdir(test_upload_dir): # remove if empty
        #     os.rmdir(test_upload_dir)

    print("\nprocessing_service test block finished.")
