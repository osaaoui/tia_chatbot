import React, { memo, useCallback } from "react";
import {
  Database,
  Plus,
  Trash2,
  Edit3,
  FileText,
  ChevronLeft,
  Play,
  Loader2,
  FileImage,
  FileSpreadsheet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  Document,
  Database as DatabaseType,
} from "@/hooks/use-optimized-tia-app";
import { Translations } from "@/lib/i18n";

interface DatabasePanelProps {
  isVisible: boolean;
  databases: DatabaseType[];
  selectedDatabase: string | null;
  processing: {
    isProcessing: boolean;
    progress: number;
    documentsToProcess: number;
    processedDocuments: number;
  };
  dragState: {
    draggedDocument: { docId: string; fromDbId: string } | null;
    dragOver: string | null;
    chatDragOver: boolean;
    isDraggingFiles: boolean;
  };
  onToggleVisibility: () => void;
  onDatabaseAction: React.Dispatch<React.SetStateAction<DatabaseType[]>>;
  onSelectDocument: (document: Document, databaseId: string) => void;
  onFileUpload: (files: FileList | null, targetDbId: string) => void;
  onDragHandlers: {
    onDragStart: (docId: string, fromDbId: string) => void;
    onDragOver: (e: React.DragEvent, dbId?: string) => void;
    onDragLeave: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent, dbId?: string) => void;
    processDocuments: () => Promise<void>;
  };
  t: Translations;
}

const DatabasePanel = memo<DatabasePanelProps>(
  ({
    isVisible,
    databases,
    selectedDatabase,
    processing,
    dragState,
    onToggleVisibility,
    onDatabaseAction,
    onSelectDocument,
    onFileUpload,
    onDragHandlers,
    t,
  }) => {
    const [editingDatabase, setEditingDatabase] = React.useState<string | null>(
      null,
    );
    const [editingDocument, setEditingDocument] = React.useState<string | null>(
      null,
    );
    const [newDatabaseName, setNewDatabaseName] = React.useState("");

    const createDatabase = useCallback(() => {
      if (!newDatabaseName.trim()) return;

      const newDb: DatabaseType = {
        id: Date.now().toString(),
        name: newDatabaseName,
        size: "0 MB",
        documentCount: 0,
        createdDate: new Date().toISOString().split("T")[0],
        lastModified: new Date().toISOString().split("T")[0],
        documents: [],
      };

      onDatabaseAction((prev) => [...prev, newDb]);
      setNewDatabaseName("");
    }, [newDatabaseName, onDatabaseAction]);

    const deleteDatabase = useCallback(
      (dbId: string) => {
        if (confirm(t.confirmDelete)) {
          onDatabaseAction((prev) => prev.filter((db) => db.id !== dbId));
        }
      },
      [onDatabaseAction, t.confirmDelete],
    );

    const renameDatabase = useCallback(
      (dbId: string, newName: string) => {
        onDatabaseAction((prev) =>
          prev.map((db) =>
            db.id === dbId
              ? {
                  ...db,
                  name: newName,
                  lastModified: new Date().toISOString().split("T")[0],
                }
              : db,
          ),
        );
        setEditingDatabase(null);
      },
      [onDatabaseAction],
    );

    const deleteDocument = useCallback(
      (dbId: string, docId: string) => {
        if (confirm(t.confirmDelete)) {
          onDatabaseAction((prev) =>
            prev.map((db) =>
              db.id === dbId
                ? {
                    ...db,
                    documents: db.documents.filter((doc) => doc.id !== docId),
                    documentCount: db.documentCount - 1,
                    lastModified: new Date().toISOString().split("T")[0],
                  }
                : db,
            ),
          );
        }
      },
      [onDatabaseAction, t.confirmDelete],
    );

    const renameDocument = useCallback(
      (dbId: string, docId: string, newName: string) => {
        onDatabaseAction((prev) =>
          prev.map((db) =>
            db.id === dbId
              ? {
                  ...db,
                  documents: db.documents.map((doc) =>
                    doc.id === docId ? { ...doc, name: newName } : doc,
                  ),
                  lastModified: new Date().toISOString().split("T")[0],
                }
              : db,
          ),
        );
        setEditingDocument(null);
      },
      [onDatabaseAction],
    );

    const [expandedDatabases, setExpandedDatabases] = React.useState<
      Set<string>
    >(new Set());

    // Handle document highlighting from chat references
    React.useEffect(() => {
      const handleHighlightDocument = (event: CustomEvent) => {
        const { documentId, databaseId } = event.detail;

        // Expand the database if not already expanded
        setExpandedDatabases((prev) => new Set(prev.add(databaseId)));

        // Highlight the document
        setTimeout(() => {
          const documentElement = document.querySelector(
            `[data-document-id="${documentId}"]`,
          );
          if (documentElement) {
            documentElement.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
            documentElement.classList.add("highlight-document");
            setTimeout(() => {
              documentElement.classList.remove("highlight-document");
            }, 3000);
          }
        }, 100);
      };

      window.addEventListener(
        "highlightDocument",
        handleHighlightDocument as EventListener,
      );
      return () => {
        window.removeEventListener(
          "highlightDocument",
          handleHighlightDocument as EventListener,
        );
      };
    }, []);

    const toggleDatabase = useCallback((databaseId: string) => {
      setExpandedDatabases((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(databaseId)) {
          newSet.delete(databaseId);
        } else {
          newSet.add(databaseId);
        }
        return newSet;
      });
    }, []);

    // Calculate unprocessed documents count
    const unprocessedDocsCount = databases.reduce(
      (count, db) =>
        count + db.documents.filter((doc) => !doc.isProcessed).length,
      0,
    );

    const getFileTypeIcon = (fileType: Document["fileType"]) => {
      switch (fileType) {
        case "PDF":
          return <FileText className="h-3 w-3 text-red-500" />;
        case "Word":
          return <FileText className="h-3 w-3 text-blue-500" />;
        case "Excel":
          return <FileSpreadsheet className="h-3 w-3 text-green-500" />;
        case "PowerPoint":
          return <FileImage className="h-3 w-3 text-orange-500" />;
        case "Image":
          return <FileImage className="h-3 w-3 text-purple-500" />;
        default:
          return <FileText className="h-3 w-3 text-gray-500" />;
      }
    };

    if (!isVisible) return null;

    return (
      <div className="w-80 bg-white dark:bg-gray-800 border-r-2 border-blue-100 dark:border-blue-800 transition-all duration-300 shadow-lg">
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="p-4 border-b bg-gray-50 dark:bg-gray-700">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-800 dark:text-white flex items-center">
                <Database className="mr-2 h-5 w-5 text-blue-600" />
                {t.databases}
              </h2>
              <Button variant="ghost" size="sm" onClick={onToggleVisibility}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </div>

            {/* New Database Input */}
            <div className="mt-2 flex gap-2">
              <Input
                placeholder={t.databaseName}
                value={newDatabaseName}
                onChange={(e) => setNewDatabaseName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && createDatabase()}
                className="flex-1"
                size="sm"
              />
              <Button onClick={createDatabase} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Process Documents - Only show when there are unprocessed documents */}
            {unprocessedDocsCount > 0 && (
              <div className="mt-2 flex gap-2">
                <Button
                  onClick={onDragHandlers.processDocuments}
                  disabled={processing.isProcessing}
                  size="sm"
                  className="flex-1"
                >
                  {processing.isProcessing ? (
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  ) : (
                    <Play className="mr-2 h-3 w-3" />
                  )}
                  {t.processDocuments} ({unprocessedDocsCount})
                </Button>
              </div>
            )}

            {/* Enhanced Processing Progress */}
            {processing.isProcessing && (
              <div className="mt-2">
                <div className="flex justify-between text-xs mb-1">
                  <span>{t.processing}</span>
                  <span>
                    {processing.processedDocuments}/
                    {processing.documentsToProcess}
                  </span>
                </div>
                <Progress value={processing.progress} className="h-2" />
                <div className="text-xs text-gray-500 mt-1 text-center">
                  {processing.progress}% complete
                </div>
              </div>
            )}
          </div>

          {/* Database List */}
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-2">
              {databases.map((database) => (
                <div
                  key={database.id}
                  className={cn(
                    "border rounded-lg p-3 hover:shadow-md transition-all",
                    dragState.dragOver === database.id &&
                      "border-blue-400 bg-blue-50 dark:bg-blue-900/20",
                    dragState.isDraggingFiles &&
                      "border-dashed border-blue-400",
                  )}
                  onDragOver={(e) => onDragHandlers.onDragOver(e, database.id)}
                  onDragLeave={onDragHandlers.onDragLeave}
                  onDrop={(e) => onDragHandlers.onDrop(e, database.id)}
                >
                  <div
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => toggleDatabase(database.id)}
                  >
                    <div className="flex items-center space-x-2 flex-1">
                      <Database className="h-4 w-4 text-blue-500" />
                      {editingDatabase === database.id ? (
                        <Input
                          value={database.name}
                          onChange={(e) =>
                            renameDatabase(database.id, e.target.value)
                          }
                          onBlur={() => setEditingDatabase(null)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") setEditingDatabase(null);
                            if (e.key === "Escape") setEditingDatabase(null);
                          }}
                          autoFocus
                          className="h-6 text-sm"
                        />
                      ) : (
                        <span className="font-medium text-sm">
                          {database.name}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingDatabase(database.id);
                        }}
                      >
                        <Edit3 className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteDatabase(database.id);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  <div className="text-xs text-gray-500 mt-1">
                    {database.documentCount} {t.documents} • {database.size}
                  </div>

                  {/* Documents List */}
                  {expandedDatabases.has(database.id) && (
                    <div className="mt-3 space-y-1">
                      {database.documents.map((doc) => (
                        <div
                          key={doc.id}
                          data-document-id={doc.id}
                          className={cn(
                            "p-2 rounded border cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all text-xs",
                            selectedDatabase === database.id &&
                              "bg-blue-100 dark:bg-blue-900/30 border-blue-300",
                            doc.processingStatus === "processing" &&
                              "bg-yellow-50 border-yellow-300",
                            doc.isProcessed && "bg-green-50 border-green-300",
                          )}
                          draggable
                          onDragStart={() =>
                            onDragHandlers.onDragStart(doc.id, database.id)
                          }
                          onClick={() => onSelectDocument(doc, database.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2 flex-1">
                              {getFileTypeIcon(doc.fileType)}
                              {editingDocument === doc.id ? (
                                <Input
                                  value={doc.name}
                                  onChange={(e) =>
                                    renameDocument(
                                      database.id,
                                      doc.id,
                                      e.target.value,
                                    )
                                  }
                                  onBlur={() => setEditingDocument(null)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter")
                                      setEditingDocument(null);
                                    if (e.key === "Escape")
                                      setEditingDocument(null);
                                  }}
                                  autoFocus
                                  className="h-5 text-xs"
                                  onClick={(e) => e.stopPropagation()}
                                />
                              ) : (
                                <span className="font-medium truncate">
                                  {doc.name}
                                </span>
                              )}
                            </div>
                            <div className="flex space-x-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-5 w-5 p-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingDocument(doc.id);
                                }}
                              >
                                <Edit3 className="h-2 w-2" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-5 w-5 p-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteDocument(database.id, doc.id);
                                }}
                              >
                                <Trash2 className="h-2 w-2" />
                              </Button>
                            </div>
                          </div>
                          <div className="flex justify-between text-xs text-gray-400 mt-1">
                            <span>
                              {doc.type} • {doc.pages} {t.pages} • {doc.size}
                            </span>
                            {doc.processingStatus === "processing" && (
                              <span className="text-yellow-600 flex items-center">
                                <Loader2 className="h-2 w-2 animate-spin mr-1" />
                                Processing
                              </span>
                            )}
                            {doc.isProcessed && (
                              <span className="text-green-600">
                                ✓ Processed
                              </span>
                            )}
                            {!doc.isProcessed &&
                              doc.processingStatus !== "processing" && (
                                <span className="text-gray-500">
                                  Not processed
                                </span>
                              )}
                          </div>
                        </div>
                      ))}

                      {/* Add Document Section */}
                      <div
                        className={cn(
                          "border-2 border-dashed border-gray-300 rounded p-3 transition-all",
                          "hover:border-blue-400 hover:bg-blue-50/50",
                          dragState.dragOver === database.id &&
                            "border-blue-500 bg-blue-100 dark:bg-blue-900/30",
                        )}
                        onDragOver={(e) =>
                          onDragHandlers.onDragOver(e, database.id)
                        }
                        onDragLeave={onDragHandlers.onDragLeave}
                        onDrop={(e) => onDragHandlers.onDrop(e, database.id)}
                      >
                        <input
                          type="file"
                          multiple
                          className="hidden"
                          id={`file-upload-${database.id}`}
                          onChange={(e) =>
                            onFileUpload(e.target.files, database.id)
                          }
                          accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.txt"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full text-xs"
                          onClick={() =>
                            document
                              .getElementById(`file-upload-${database.id}`)
                              ?.click()
                          }
                        >
                          <Plus className="mr-1 h-3 w-3" />
                          {t.addDocument}
                        </Button>
                        <p className="text-xs text-gray-500 mt-1 text-center">
                          {t.dragDropFiles}
                        </p>
                        <p className="text-xs text-gray-400 mt-1 text-center">
                          PDF, Word, Excel, PowerPoint, Images
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>
    );
  },
);

DatabasePanel.displayName = "DatabasePanel";

export default DatabasePanel;
