import { useCallback, useState } from "react";
import { Database, Document } from "./use-optimized-tia-app";
import { uploadDocument, ApiUploadResponse } from "@/services/api"; // Import ApiUploadResponse
import { useToast } from "./use-toast"; // For user feedback

interface FileUploadHookProps {
  databases: Database[];
  setDatabases: React.Dispatch<React.SetStateAction<Database[]>>;
  fileOperations: {
    validateFileType: (file: File) => boolean;
    getFileType: (fileName: string) => Document["fileType"];
    formatFileSize: (bytes: number) => string;
  };
  t: any; // Localization function, assuming it's passed in
}

export function useFileUpload({
  databases, // Assuming this is still needed for UI updates, though backend is source of truth
  setDatabases, // Similar to above
  fileOperations,
  t,
}: FileUploadHookProps) {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const userId = "default_user"; // Placeholder for actual user ID management

  const handleFileUpload = useCallback(
    async (files: FileList | null, targetDbId: string) => { // targetDbId might be deprecated if not used by backend
      if (!files) return;

      const validFiles = Array.from(files).filter((file) =>
        fileOperations.validateFileType(file),
      );

      if (validFiles.length !== files.length) {
        const invalidCount = files.length - validFiles.length;
        toast({
          title: "File Upload",
          description: `${invalidCount} file(s) were skipped due to unsupported format or size limit (50MB max).`,
          variant: "destructive",
        });
      }

      if (validFiles.length === 0) return;

      setIsUploading(true);
      let successfulUploads = 0;
      let failedUploads = 0;

      for (const file of validFiles) {
        try {
          const response: ApiUploadResponse = await uploadDocument(file, userId); // Use new response type

          // Backend now directly processes and returns details.
          // Update local state based on this more detailed response.
          const fileType = fileOperations.getFileType(response.filename);
          const newDoc: Document = {
            id: response.filename, // Using filename as ID, ensure uniqueness or use backend ID if provided
            name: response.filename,
            type: fileType, // This is the broad type (PDF, Word)
            size: fileOperations.formatFileSize(file.size), // Original file size
            pages: response.text_sections_extracted, // Approximation, or if backend can count pages
            createdDate: new Date().toISOString().split("T")[0], // Should ideally come from backend if it stores this
            addedDate: new Date().toISOString().split("T")[0],
            content: response.message, // Use backend message or a summary
            fileType, // Redundant with type, but part of Document interface
            isProcessed: true, // Since this endpoint now processes directly
            processingStatus: "completed", // Mark as completed
            // We could add response.total_chunks_processed, etc. to the Document model if needed
          };

          // Update local state.
          // The logic for updating `databases` (especially `documentCount` and `size`)
          // should be robust. If `targetDbId` represents a specific collection that the
          // `userId` maps to on the backend, this can work.
          // If all docs for a user go to one pool, `targetDbId` might be less relevant for backend,
          // but still useful for UI grouping.
          // This part is tricky as the backend is the source of truth.
          // A common pattern is to re-fetch the document list for the targetDbId
          // or update based on a websocket message, or simply trust the backend.
          // For now, adding to local state to reflect an upload occurred.
           setDatabases((prev) =>
            prev.map((db) =>
              db.id === targetDbId // Or however you identify the relevant DB/collection
                ? {
                    ...db,
                    documents: [...db.documents.filter(doc => doc.name !== newDoc.name), newDoc], // Avoid duplicates if re-uploading
                    documentCount: db.documents.filter(doc => doc.name !== newDoc.name).length + 1,
                    // Size and lastModified should ideally come from backend
                  }
                : db,
            ),
          );
          successfulUploads++;
        } catch (error) {
          console.error("Error uploading file:", file.name, error);
          failedUploads++;
        }
      }
      setIsUploading(false);

      if (successfulUploads > 0) {
        toast({
          title: "File Upload",
          description: `${successfulUploads} file(s) uploaded and processing started.`,
        });
      }
      if (failedUploads > 0) {
        toast({
          title: "File Upload Failed",
          description: `${failedUploads} file(s) could not be uploaded.`,
          variant: "destructive",
        });
      }
      // Potentially trigger a re-fetch of documents here
    },
    [fileOperations, setDatabases, toast, userId, t], // Added t to dependencies
  );

  const handleChatFileUpload = useCallback( // This function might need rethinking
    async (files: FileList | null) => {
      if (!files) return;

      // "My Documents" is a client-side concept. Files are uploaded with a user_id.
      // The backend doesn't have a concept of "databases" in the same way the frontend state does.
      // We'll upload to the default collection for the user.
      // The `targetDbId` used in `handleFileUpload` might become less relevant
      // if all user docs go to the same place on the backend.

      // For now, let's assume there's a default "My Documents" database ID locally.
      // This part of the logic might need significant change depending on how databases are managed.
      let myDocsDb = databases.find((db) => db.name === t.myDocuments); // t.myDocuments should be a stable ID or name
      let targetDbId: string;

      if (!myDocsDb) {
        // This local DB creation might be out of sync with backend.
        // It's better if backend confirms/creates user's default space.
        const newMyDocsDbId = `my-docs-${userId}-${Date.now()}`; // More unique ID
        const newMyDocsDb: Database = {
          id: newMyDocsDbId,
          name: t.myDocuments, // This is a display name
          size: "0 MB",
          documentCount: 0,
          createdDate: new Date().toISOString().split("T")[0],
          lastModified: new Date().toISOString().split("T")[0],
          documents: [],
        };
        setDatabases((prev) => [...prev, newMyDocsDb]);
        targetDbId = newMyDocsDbId;
      } else {
        targetDbId = myDocsDb.id;
      }

      await handleFileUpload(files, targetDbId); // Call the modified handleFileUpload
      // The alert here is now redundant due to toast notifications in handleFileUpload
    },
    [databases, handleFileUpload, setDatabases, t, userId], // Added t and userId
  );

  return {
    handleFileUpload,
    handleChatFileUpload,
    isUploading, // Expose loading state
  };
}
