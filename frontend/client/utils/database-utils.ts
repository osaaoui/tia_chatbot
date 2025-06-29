import { Database, Document } from "@/hooks/use-optimized-tia-app";

export const createNewDatabase = (name: string): Database => ({
  id: Date.now().toString(),
  name,
  size: "0 MB",
  documentCount: 0,
  createdDate: new Date().toISOString().split("T")[0],
  lastModified: new Date().toISOString().split("T")[0],
  documents: [],
});

export const updateDatabaseDocuments = (
  databases: Database[],
  dbId: string,
  updater: (documents: Document[]) => Document[],
): Database[] => {
  return databases.map((db) =>
    db.id === dbId
      ? {
          ...db,
          documents: updater(db.documents),
          documentCount: updater(db.documents).length,
          lastModified: new Date().toISOString().split("T")[0],
        }
      : db,
  );
};

export const renameDatabase = (
  databases: Database[],
  dbId: string,
  newName: string,
): Database[] => {
  return databases.map((db) =>
    db.id === dbId
      ? {
          ...db,
          name: newName,
          lastModified: new Date().toISOString().split("T")[0],
        }
      : db,
  );
};

export const deleteDatabase = (
  databases: Database[],
  dbId: string,
): Database[] => {
  return databases.filter((db) => db.id !== dbId);
};

export const getFileTypeIcon = (fileType: Document["fileType"]) => {
  const iconMap = {
    PDF: "h-3 w-3 text-red-500",
    Word: "h-3 w-3 text-blue-500",
    Excel: "h-3 w-3 text-green-500",
    PowerPoint: "h-3 w-3 text-orange-500",
    Image: "h-3 w-3 text-purple-500",
    Text: "h-3 w-3 text-gray-500",
  };

  return iconMap[fileType] || iconMap.Text;
};

export const calculateUnprocessedDocuments = (
  databases: Database[],
): number => {
  return databases.reduce(
    (count, db) =>
      count + db.documents.filter((doc) => !doc.isProcessed).length,
    0,
  );
};
