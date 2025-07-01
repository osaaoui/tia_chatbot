import os
import shutil
import logging
from fastapi import APIRouter, UploadFile, File, HTTPException, Form, Depends, Body
from typing import List

from ...core.config import settings
from ...services import processing_service, vectorstore_service
from ...models.schemas import UploadResponse, DeleteRequest, DeleteResponse, FileDeleteStatus

router = APIRouter()
logger = logging.getLogger(__name__)
logging.basicConfig(level=settings.LOG_LEVEL)


@router.post("/upload/", response_model=UploadResponse)
async def upload_document_api(
    user_id: str = Form(...),
    file: UploadFile = File(...)
):
    """
    Handles uploading a single PDF document, processing it, and adding it to the vector store.
    """
    user_upload_dir = settings.UPLOADED_FILES_DIR / user_id
    user_upload_dir.mkdir(parents=True, exist_ok=True)

    file_path = user_upload_dir / file.filename

    # Save the uploaded file
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        logger.info(f"File '{file.filename}' uploaded to '{file_path}' for user '{user_id}'.")
    except Exception as e:
        logger.error(f"Error saving uploaded file '{file.filename}' for user '{user_id}': {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Could not save file: {str(e)}")
    finally:
        file.file.close()

    # Process the saved PDF file
    try:
        processed_docs = processing_service.process_uploaded_pdf(
            uploaded_file_path=str(file_path),
            original_filename=file.filename,
            user_id=user_id
        )
    except Exception as e:
        logger.error(f"Error processing file '{file.filename}' for user '{user_id}': {e}", exc_info=True)
        # Optionally remove the uploaded file if processing fails critically
        # file_path.unlink(missing_ok=True)
        raise HTTPException(status_code=500, detail=f"Failed to process document: {str(e)}")

    if not processed_docs:
        logger.warning(f"No processable content found in '{file.filename}' for user '{user_id}'.")
        # file_path.unlink(missing_ok=True) # Clean up if no content
        # Depending on strictness, could return 200 with message or an error like 422/500
        return UploadResponse(
            filename=file.filename,
            message="File uploaded but no processable content (text/tables) was extracted.",
            user_id=user_id,
            total_chunks_processed=0,
            table_chunks_extracted=0,
            text_sections_extracted=0
        )

    # Count chunk types for response
    table_chunks_count = sum(1 for doc in processed_docs if doc.metadata.get("content_type") == "table_chunk")
    text_sections_count = sum(1 for doc in processed_docs if doc.metadata.get("content_type") == "text_section")

    # Add processed documents to the vector store
    try:
        success_add = vectorstore_service.add_documents_to_store(
            user_id=user_id,
            documents=processed_docs
        )
        if not success_add:
            # This implies an issue with vector store itself or embedding service
            raise HTTPException(status_code=500, detail="Failed to add processed document chunks to the vector store.")
    except Exception as e: # Catch any other exception from add_documents_to_store
        logger.error(f"Failed to add chunks of '{file.filename}' to vector store for user '{user_id}': {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error adding document to vector store: {str(e)}")

    logger.info(f"Successfully processed and stored '{file.filename}' for user '{user_id}'.")
    return UploadResponse(
        filename=file.filename,
        message="File uploaded, processed, and indexed successfully.",
        user_id=user_id,
        total_chunks_processed=len(processed_docs),
        table_chunks_extracted=table_chunks_count,
        text_sections_extracted=text_sections_count
    )


@router.post("/delete/", response_model=DeleteResponse)
async def delete_documents_api(
    request: DeleteRequest = Body(...) # Use Pydantic model for request body
):
    """
    Deletes specified documents (and their embeddings) for a user.
    """
    user_id = request.user_id
    filenames_to_delete = request.filenames
    files_status: List[FileDeleteStatus] = []

    logger.info(f"Received request to delete {len(filenames_to_delete)} file(s) for user '{user_id}'.")

    if not filenames_to_delete:
        raise HTTPException(status_code=400, detail="No filenames provided for deletion.")

    # Attempt to delete from vector store first
    try:
        vs_delete_success = vectorstore_service.delete_documents_from_store(
            user_id=user_id,
            filenames=filenames_to_delete
        )
        # This function in vectorstore_service logs details per file if needed.
        # For simplicity, we assume it tries its best for all and returns a general status.
        # We'll mark status based on file system deletion primarily for this response.
    except Exception as e:
        logger.error(f"Error during vector store deletion for user '{user_id}', files {filenames_to_delete}: {e}", exc_info=True)
        # If this fails, we might not want to delete files, or report partial failure
        for fname in filenames_to_delete:
             files_status.append(FileDeleteStatus(filename=fname, status="error_deleting_embeddings", message=str(e)))
        return DeleteResponse(
            user_id=user_id,
            overall_message="An error occurred while trying to delete document embeddings.",
            files_status=files_status
        )

    # Then delete from file system
    user_upload_dir = settings.UPLOADED_FILES_DIR / user_id
    for filename in filenames_to_delete:
        file_path = user_upload_dir / filename
        if file_path.exists():
            try:
                file_path.unlink()
                logger.info(f"File '{filename}' deleted from filesystem for user '{user_id}'.")
                files_status.append(FileDeleteStatus(filename=filename, status="deleted_successfully", message="Deleted from storage and vector store."))
            except OSError as e:
                logger.error(f"Error deleting file '{filename}' from filesystem for user '{user_id}': {e}", exc_info=True)
                files_status.append(FileDeleteStatus(filename=filename, status="error_deleting_from_storage", message=f"Embeddings deleted, but file system deletion failed: {str(e)}"))
        else:
            logger.warning(f"File '{filename}' not found in filesystem for user '{user_id}' for deletion, but embeddings might have been removed.")
            files_status.append(FileDeleteStatus(filename=filename, status="not_found_in_storage", message="Embeddings removed (if existed), file not found in storage."))

    overall_message = f"Deletion process completed for {len(filenames_to_delete)} file(s)."
    # Check if all were successful
    if all(fs.status == "deleted_successfully" for fs in files_status):
        overall_message = f"All {len(filenames_to_delete)} file(s) and their embeddings deleted successfully."
    elif any("error" in fs.status for fs in files_status):
        overall_message = "Deletion process completed with some errors."

    return DeleteResponse(
        user_id=user_id,
        overall_message=overall_message,
        files_status=files_status
    )
