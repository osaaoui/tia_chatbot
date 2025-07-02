import os
import shutil
import logging
from fastapi import APIRouter, UploadFile, File, HTTPException, Form, Depends, Body
from typing import List, Optional

from ...core.config import settings
from ...services import processing_service, vectorstore_service
from ...models.schemas import StagedUploadResponse, DeleteRequest, DeleteResponse, FileDeleteStatus, ProcessRequest, ProcessResponse, FileProcessStatus

router = APIRouter()
logger = logging.getLogger(__name__)
logging.basicConfig(level=settings.LOG_LEVEL)


@router.post("/upload/", response_model=StagedUploadResponse) # Changed response model
async def stage_upload_api( # Renamed function for clarity
    user_id: str = Form(...),
    file: UploadFile = File(...)
):
    """
    Handles uploading a single PDF document and staging it for later processing.
    File is saved to a user-specific directory in STAGED_FILES_DIR.
    """
    user_staging_dir = settings.STAGED_FILES_DIR / user_id
    user_staging_dir.mkdir(parents=True, exist_ok=True)

    # Sanitize filename (optional, but good practice)
    # filename = secure_filename(file.filename) # Example, if using a utility
    filename = file.filename # Assuming filename is generally safe for now
    staged_file_path = user_staging_dir / filename

    # Save the uploaded file to staging area
    try:
        with open(staged_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        logger.info(f"File '{filename}' staged to '{staged_file_path}' for user '{user_id}'.")
    except Exception as e:
        logger.error(f"Error staging uploaded file '{filename}' for user '{user_id}': {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Could not stage file: {str(e)}")
    finally:
        file.file.close()

    return StagedUploadResponse(
        filename=filename,
        message="File successfully staged for processing.",
        user_id=user_id,
        staged_path=str(staged_file_path) # Return the path for reference if needed
    )

@router.post("/process/", response_model=ProcessResponse)
async def process_staged_documents_api(
    request: ProcessRequest = Body(...)
):
    """
    Processes a list of specified staged files for a user.
    Moves files from staging to processed directory upon success.
    """
    user_id = request.user_id
    filenames_to_process = request.filenames
    files_status: List[FileProcessStatus] = []

    logger.info(f"Received request to process {len(filenames_to_process)} file(s) for user '{user_id}'.")

    if not filenames_to_process:
        raise HTTPException(status_code=400, detail="No filenames provided for processing.")

    user_staging_dir = settings.STAGED_FILES_DIR / user_id
    user_processed_dir = settings.UPLOADED_FILES_DIR / user_id # For successfully processed files
    user_processed_dir.mkdir(parents=True, exist_ok=True)

    for filename in filenames_to_process:
        staged_file_path = user_staging_dir / filename
        processed_file_path = user_processed_dir / filename

        current_file_status = FileProcessStatus(filename=filename, status="pending")

        if not staged_file_path.exists():
            logger.warning(f"File '{filename}' not found in staging for user '{user_id}'.")
            current_file_status.status = "file_not_found_in_staging"
            current_file_status.message = "File was not found in the staging area."
            files_status.append(current_file_status)
            continue

        try:
            logger.info(f"Processing '{filename}' for user '{user_id}' from '{staged_file_path}'.")
            processed_docs = processing_service.process_uploaded_pdf(
                uploaded_file_path=str(staged_file_path),
                original_filename=filename,
                user_id=user_id
            )

            if not processed_docs:
                logger.warning(f"No processable content in '{filename}' for user '{user_id}'.")
                current_file_status.status = "processing_no_content"
                current_file_status.message = "No processable text or table content was extracted."
                # Optionally delete from staging if no content: staged_file_path.unlink(missing_ok=True)
                files_status.append(current_file_status)
                continue

            current_file_status.table_chunks_extracted = sum(1 for doc in processed_docs if doc.metadata.get("content_type") == "table_chunk")
            current_file_status.text_sections_extracted = sum(1 for doc in processed_docs if doc.metadata.get("content_type") == "text_section")
            current_file_status.total_chunks_processed = len(processed_docs)

            logger.info(f"Adding {len(processed_docs)} chunks of '{filename}' to vector store for user '{user_id}'.")
            success_add = vectorstore_service.add_documents_to_store(
                user_id=user_id,
                documents=processed_docs
            )

            if not success_add:
                raise Exception("Failed to add processed document chunks to the vector store.")

            # Move file from staging to processed after successful processing and vector store addition
            shutil.move(str(staged_file_path), str(processed_file_path))
            logger.info(f"Moved '{filename}' from staging to processed directory for user '{user_id}'.")

            current_file_status.status = "processed_successfully"
            current_file_status.message = "File processed and indexed successfully."

        except Exception as e:
            logger.error(f"Error during processing or storage of '{filename}' for user '{user_id}': {e}", exc_info=True)
            current_file_status.status = "processing_error"
            current_file_status.message = str(e)

        files_status.append(current_file_status)

    overall_message = f"Processing attempt completed for {len(filenames_to_process)} file(s)."
    return ProcessResponse(
        user_id=user_id,
        overall_message=overall_message,
        files_status=files_status
    )


@router.post("/delete/", response_model=DeleteResponse)
async def delete_documents_api( # Assuming this still deletes from PROCESSED files
from datetime import datetime # Import datetime
from ...models.schemas import StagedUploadResponse, DeleteRequest, DeleteResponse, FileDeleteStatus, ProcessRequest, ProcessResponse, FileProcessStatus, UserDocumentInfo # Added UserDocumentInfo

router = APIRouter()
logger = logging.getLogger(__name__)
logging.basicConfig(level=settings.LOG_LEVEL)


@router.post("/upload/", response_model=StagedUploadResponse)
async def stage_upload_api(
    user_id: str = Form(...),
    file: UploadFile = File(...)
):
    """
    Handles uploading a single PDF document and staging it for later processing.
    File is saved to a user-specific directory in STAGED_FILES_DIR.
    """
    user_staging_dir = settings.STAGED_FILES_DIR / user_id
    user_staging_dir.mkdir(parents=True, exist_ok=True)

    # Sanitize filename (optional, but good practice)
    # filename = secure_filename(file.filename) # Example, if using a utility
    filename = file.filename # Assuming filename is generally safe for now
    staged_file_path = user_staging_dir / filename

    # Save the uploaded file to staging area
    try:
        with open(staged_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        logger.info(f"File '{filename}' staged to '{staged_file_path}' for user '{user_id}'.")
    except Exception as e:
        logger.error(f"Error staging uploaded file '{filename}' for user '{user_id}': {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Could not stage file: {str(e)}")
    finally:
        file.file.close()

    return StagedUploadResponse(
        filename=filename,
        message="File successfully staged for processing.",
        user_id=user_id,
        staged_path=str(staged_file_path)
    )

@router.post("/process/", response_model=ProcessResponse)
async def process_staged_documents_api(
    request: ProcessRequest = Body(...)
):
    """
    Processes a list of specified staged files for a user.
    Moves files from staging to processed directory upon success.
    """
    user_id = request.user_id
    filenames_to_process = request.filenames
    files_status: List[FileProcessStatus] = []

    logger.info(f"Received request to process {len(filenames_to_process)} file(s) for user '{user_id}'.")

    if not filenames_to_process:
        raise HTTPException(status_code=400, detail="No filenames provided for processing.")

    user_staging_dir = settings.STAGED_FILES_DIR / user_id
    user_processed_dir = settings.UPLOADED_FILES_DIR / user_id
    user_processed_dir.mkdir(parents=True, exist_ok=True)

    for filename in filenames_to_process:
        staged_file_path = user_staging_dir / filename
        processed_file_path = user_processed_dir / filename

        current_file_status = FileProcessStatus(filename=filename, status="pending")

        if not staged_file_path.exists():
            logger.warning(f"File '{filename}' not found in staging for user '{user_id}'.")
            current_file_status.status = "file_not_found_in_staging"
            current_file_status.message = "File was not found in the staging area."
            files_status.append(current_file_status)
            continue

        try:
            logger.info(f"Processing '{filename}' for user '{user_id}' from '{staged_file_path}'.")
            processed_docs = processing_service.process_uploaded_pdf(
                uploaded_file_path=str(staged_file_path),
                original_filename=filename,
                user_id=user_id
            )

            if not processed_docs:
                logger.warning(f"No processable content in '{filename}' for user '{user_id}'.")
                current_file_status.status = "processing_no_content"
                current_file_status.message = "No processable text or table content was extracted."

                files_status.append(current_file_status)
                continue

            current_file_status.table_chunks_extracted = sum(1 for doc in processed_docs if doc.metadata.get("content_type") == "table_chunk")
            current_file_status.text_sections_extracted = sum(1 for doc in processed_docs if doc.metadata.get("content_type") == "text_section")
            current_file_status.total_chunks_processed = len(processed_docs)

            logger.info(f"Adding {len(processed_docs)} chunks of '{filename}' to vector store for user '{user_id}'.")
            success_add = vectorstore_service.add_documents_to_store(
                user_id=user_id,
                documents=processed_docs
            )

            if not success_add:
                raise Exception("Failed to add processed document chunks to the vector store.")


            shutil.move(str(staged_file_path), str(processed_file_path))
            logger.info(f"Moved '{filename}' from staging to processed directory for user '{user_id}'.")

            current_file_status.status = "processed_successfully"
            current_file_status.message = "File processed and indexed successfully."

        except Exception as e:
            logger.error(f"Error during processing or storage of '{filename}' for user '{user_id}': {e}", exc_info=True)
            current_file_status.status = "processing_error"
            current_file_status.message = str(e)

        files_status.append(current_file_status)

    overall_message = f"Processing attempt completed for {len(filenames_to_process)} file(s)."
    return ProcessResponse(
        user_id=user_id,
        overall_message=overall_message,
        files_status=files_status
    )


@router.post("/delete/", response_model=DeleteResponse)
async def delete_documents_api(
    request: DeleteRequest = Body(...)
):
    """
    Deletes specified documents (and their embeddings) for a user from the processed files directory.
    """
    user_id = request.user_id
    filenames_to_delete = request.filenames
    files_status: List[FileDeleteStatus] = []

    logger.info(f"Received request to delete {len(filenames_to_delete)} processed file(s) for user '{user_id}'.")

    if not filenames_to_delete:
        raise HTTPException(status_code=400, detail="No filenames provided for deletion.")

    # Attempt to delete from vector store first
    try:
        vs_delete_success = vectorstore_service.delete_documents_from_store(
            user_id=user_id,
            filenames=filenames_to_delete
        )
        # This function in vectorstore_service logs details per file if needed.
    except Exception as e:
        logger.error(f"Error during vector store deletion for user '{user_id}', files {filenames_to_delete}: {e}", exc_info=True)
        for fname in filenames_to_delete:
             files_status.append(FileDeleteStatus(filename=fname, status="error_deleting_embeddings", message=str(e)))
        return DeleteResponse(
            user_id=user_id,
            overall_message="An error occurred while trying to delete document embeddings. Corresponding files on disk were not deleted.",
            files_status=files_status
        )

    # Then delete from file system (UPLOADED_FILES_DIR for processed files)
    user_processed_dir = settings.UPLOADED_FILES_DIR / user_id
    for filename in filenames_to_delete:
        file_path = user_processed_dir / filename
        if file_path.exists():
            try:
                file_path.unlink()
                logger.info(f"File '{filename}' deleted from processed files directory for user '{user_id}'.")
                # Update status based on whether embeddings were also handled successfully by vs_delete_success
                # For simplicity, assuming vs_delete_success implies all requested filenames were handled if no exception.
                # A more granular check might involve checking return from delete_documents_from_store if it provided per-file status.
                status_msg = "deleted_successfully"
                message = "Deleted from storage and vector store."
                if not vs_delete_success: # This flag might not be perfectly accurate if some files in list failed in VS but others succeeded
                    status_msg = "deleted_from_storage_vs_issue"
                    message = "Deleted from storage, but there was an issue removing all embeddings."

                files_status.append(FileDeleteStatus(filename=filename, status=status_msg, message=message))
            except OSError as e:
                logger.error(f"Error deleting file '{filename}' from processed files directory for user '{user_id}': {e}", exc_info=True)
                files_status.append(FileDeleteStatus(filename=filename, status="error_deleting_from_storage", message=f"Embeddings might have been deleted, but file system deletion failed: {str(e)}"))
        else:
            logger.warning(f"File '{filename}' not found in processed files directory for user '{user_id}' for deletion.")
            status_msg = "not_found_in_storage"
            message = "File not found in processed storage. Embeddings (if they existed for this filename) were targeted for deletion."
            if not vs_delete_success:
                 message = "File not found in processed storage, and there was an issue removing embeddings."
            files_status.append(FileDeleteStatus(filename=filename, status=status_msg, message=message))

    overall_message = f"Deletion process completed for {len(filenames_to_delete)} file(s)."
    # Refine overall message based on statuses
    if all(fs.status == "deleted_successfully" for fs in files_status):
        overall_message = f"All {len(filenames_to_delete)} file(s) and their embeddings deleted successfully."
    elif any("error" in fs.status or "issue" in fs.status for fs in files_status):
        overall_message = "Deletion process completed with some errors or issues."

    return DeleteResponse(
        user_id=user_id,
        overall_message=overall_message,
        files_status=files_status
    )

@router.get("/list_processed/", response_model=List[UserDocumentInfo]) # Corrected response model
async def list_processed_documents_api(user_id: str): # user_id as query parameter
    """
    Lists all processed documents (files found in the user's UPLOADED_FILES_DIR)
    for a given user_id.
    """
    logger.info(f"Request to list processed documents for user_id: {user_id}")
    user_processed_dir = settings.UPLOADED_FILES_DIR / user_id

    if not user_id:
        raise HTTPException(status_code=400, detail="user_id query parameter is required.")

    if not user_processed_dir.exists() or not user_processed_dir.is_dir():
        logger.info(f"No processed documents directory found for user_id: {user_id} at {user_processed_dir}")
        return [] # Return empty list if directory doesn't exist

    document_infos: List[UserDocumentInfo] = []
    try:
        for item in user_processed_dir.iterdir():
            if item.is_file():
                stat_info = item.stat()
                file_ext = item.suffix[1:].lower() if item.suffix else "unknown"

                doc_info = UserDocumentInfo(
                    filename=item.name,
                    size=stat_info.st_size,
                    modified_date=datetime.fromtimestamp(stat_info.st_mtime).isoformat(),
                    file_type=file_ext
                )
                document_infos.append(doc_info)
        logger.info(f"Found {len(document_infos)} processed documents for user_id: {user_id}")
    except Exception as e:
        logger.error(f"Error listing documents for user_id {user_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Could not list documents: {str(e)}")

    return document_infos
