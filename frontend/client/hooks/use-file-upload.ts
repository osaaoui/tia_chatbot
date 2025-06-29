import { useCallback } from "react";
import { Database, Document } from "./use-optimized-tia-app";

interface FileUploadHookProps {
  databases: Database[];
  setDatabases: React.Dispatch<React.SetStateAction<Database[]>>;
  fileOperations: {
    validateFileType: (file: File) => boolean;
    getFileType: (fileName: string) => Document["fileType"];
    formatFileSize: (bytes: number) => string;
  };
  t: any;
}

export function useFileUpload({
  databases,
  setDatabases,
  fileOperations,
  t,
}: FileUploadHookProps) {
  const handleFileUpload = useCallback(
    (files: FileList | null, targetDbId: string) => {
      if (!files) return;

      const validFiles = Array.from(files).filter((file) =>
        fileOperations.validateFileType(file),
      );

      if (validFiles.length !== files.length) {
        const invalidCount = files.length - validFiles.length;
        alert(
          `${invalidCount} file(s) were skipped due to unsupported format or size limit (50MB max).`,
        );
      }

      validFiles.forEach((file) => {
        const fileType = fileOperations.getFileType(file.name);
        const newDoc: Document = {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: file.name,
          type: fileType,
          size: fileOperations.formatFileSize(file.size),
          pages: Math.floor(Math.random() * 50) + 1,
          createdDate: new Date().toISOString().split("T")[0],
          addedDate: new Date().toISOString().split("T")[0],
          content: `Content of ${file.name}. This is a placeholder for the actual document content that would be extracted from the uploaded file. The file type is ${fileType} and contains structured information relevant to your organization.`,
          fileType,
          isProcessed: false,
          processingStatus: "pending",
        };

        setDatabases((prev) =>
          prev.map((db) =>
            db.id === targetDbId
              ? {
                  ...db,
                  documents: [...db.documents, newDoc],
                  documentCount: db.documentCount + 1,
                  size: `${(
                    parseFloat(db.size.replace(" MB", "")) +
                    file.size / (1024 * 1024)
                  ).toFixed(1)} MB`,
                  lastModified: new Date().toISOString().split("T")[0],
                }
              : db,
          ),
        );
      });
    },
    [fileOperations, setDatabases],
  );

  const handleChatFileUpload = useCallback(
    (files: FileList | null) => {
      if (!files) return;

      let myDocsDb = databases.find((db) => db.name === t.myDocuments);

      if (!myDocsDb) {
        const newMyDocsDb: Database = {
          id: `my-docs-${Date.now()}`,
          name: t.myDocuments,
          size: "0 MB",
          documentCount: 0,
          createdDate: new Date().toISOString().split("T")[0],
          lastModified: new Date().toISOString().split("T")[0],
          documents: [],
        };

        setDatabases((prev) => [...prev, newMyDocsDb]);
        myDocsDb = newMyDocsDb;
      }

      handleFileUpload(files, myDocsDb.id);

      setTimeout(() => {
        alert(
          `${files.length} file(s) uploaded to ${t.myDocuments} database successfully!`,
        );
      }, 500);
    },
    [databases, handleFileUpload, setDatabases, t.myDocuments],
  );

  return {
    handleFileUpload,
    handleChatFileUpload,
  };
}
