import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { Language } from "@/lib/i18n";
import { PROCESSING_STATUS } from "@/constants/document-constants";

export interface Database {
  id: string;
  name: string;
  size: string;
  documentCount: number;
  createdDate: string;
  lastModified: string;
  documents: Document[];
}

export interface Document {
  id: string;
  name: string;
  type: string;
  size: string;
  pages: number;
  createdDate: string;
  addedDate: string;
  content: string;
  fileType: "PDF" | "Word" | "Excel" | "PowerPoint" | "Image" | "Text";
  isProcessed?: boolean;
  processingStatus?: keyof typeof PROCESSING_STATUS;
}

export interface ChatMessage {
  id: string;
  type: "user" | "bot";
  content: string;
  timestamp: string;
  documentReferences?: string[];
}

export interface SavedChat {
  id: string;
  name: string;
  messages: ChatMessage[];
  createdDate: string;
}

export interface AppSettings {
  fontSize: number;
  language: Language;
  theme: "light" | "dark" | "auto";
  privacySettings: {
    shareUsage: boolean;
    saveHistory: boolean;
    allowAnalytics: boolean;
  };
}

// Custom hook for modal management with enhanced cleanup
export function useModalManager() {
  const [modals, setModals] = useState({
    userProfile: false,
    security: false,
    terms: false,
    currentPlan: false,
    availablePackages: false,
    viewBills: false,
    teams: false,
  });

  const openModal = useCallback((modalName: keyof typeof modals) => {
    setModals((prev) => ({ ...prev, [modalName]: true }));
  }, []);

  const closeModal = useCallback((modalName: keyof typeof modals) => {
    setModals((prev) => ({ ...prev, [modalName]: false }));

    // Enhanced cleanup with debouncing
    const cleanup = () => {
      requestAnimationFrame(() => {
        document
          .querySelectorAll("[data-radix-dropdown-menu-trigger]")
          .forEach((el) => {
            el.removeAttribute("data-state");
            el.removeAttribute("aria-expanded");
          });

        document
          .querySelectorAll("[data-radix-dropdown-menu-content]")
          .forEach((el) => {
            if (el.getAttribute("data-state") === "closed") {
              el.remove();
            }
          });

        // Force re-render with resize event
        window.dispatchEvent(new Event("resize"));
      });
    };

    setTimeout(cleanup, 100);
  }, []);

  return { modals, openModal, closeModal };
}

// Custom hook for drag and drop functionality
export function useDragAndDrop() {
  const [dragState, setDragState] = useState({
    draggedDocument: null as { docId: string; fromDbId: string } | null,
    dragOver: null as string | null,
    chatDragOver: false,
    isDraggingFiles: false,
  });

  const handleDragStart = useCallback((docId: string, fromDbId: string) => {
    setDragState((prev) => ({
      ...prev,
      draggedDocument: { docId, fromDbId },
    }));
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, dbId?: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragState((prev) => ({
      ...prev,
      isDraggingFiles: e.dataTransfer.types.includes("Files"),
      dragOver: dbId || null,
    }));
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragState((prev) => ({
      ...prev,
      dragOver: null,
      isDraggingFiles: false,
    }));
  }, []);

  const resetDragState = useCallback(() => {
    setDragState({
      draggedDocument: null,
      dragOver: null,
      chatDragOver: false,
      isDraggingFiles: false,
    });
  }, []);

  const setChatDragOver = useCallback((value: boolean) => {
    setDragState((prev) => ({ ...prev, chatDragOver: value }));
  }, []);

  return {
    dragState,
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    resetDragState,
    setChatDragOver,
  };
}

// Custom hook for search functionality with debouncing
export function useSearch(data: ChatMessage[], delay = 300) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredData, setFilteredData] = useState(data);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const debouncedSearch = useCallback(
    (query: string) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        if (query.trim()) {
          const filtered = data.filter((item) =>
            item.content.toLowerCase().includes(query.toLowerCase()),
          );
          setFilteredData(filtered);
        } else {
          setFilteredData(data);
        }
      }, delay);
    },
    [data, delay],
  );

  const updateSearchQuery = useCallback(
    (query: string) => {
      setSearchQuery(query);
      debouncedSearch(query);
    },
    [debouncedSearch],
  );

  useEffect(() => {
    setFilteredData(data);
    if (searchQuery) {
      debouncedSearch(searchQuery);
    }
  }, [data, searchQuery, debouncedSearch]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    searchQuery,
    filteredData,
    updateSearchQuery,
  };
}

// Custom hook for document search with highlighting
export function useDocumentSearch(document: Document | null) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<number[]>([]);
  const [currentResult, setCurrentResult] = useState(0);

  const performSearch = useCallback(() => {
    if (!document || !searchQuery.trim()) {
      setSearchResults([]);
      setCurrentResult(0);
      return;
    }

    const content = document.content.toLowerCase();
    const query = searchQuery.toLowerCase();
    const results: number[] = [];
    let index = content.indexOf(query);

    while (index !== -1) {
      results.push(index);
      index = content.indexOf(query, index + 1);
    }

    setSearchResults(results);
    setCurrentResult(0);
  }, [document, searchQuery]);

  useEffect(() => {
    const timeoutId = setTimeout(performSearch, 200);
    return () => clearTimeout(timeoutId);
  }, [performSearch]);

  const navigateResults = useCallback(
    (direction: "next" | "prev") => {
      if (searchResults.length === 0) return;

      setCurrentResult((prev) => {
        if (direction === "next") {
          return prev >= searchResults.length - 1 ? 0 : prev + 1;
        } else {
          return prev <= 0 ? searchResults.length - 1 : prev - 1;
        }
      });
    },
    [searchResults.length],
  );

  return {
    searchQuery,
    setSearchQuery,
    searchResults,
    currentResult,
    navigateResults,
  };
}

// Custom hook for file operations
export function useFileOperations() {
  const getFileType = useCallback((fileName: string): Document["fileType"] => {
    const extension = fileName.toLowerCase().split(".").pop();
    switch (extension) {
      case "pdf":
        return "PDF";
      case "doc":
      case "docx":
        return "Word";
      case "xls":
      case "xlsx":
        return "Excel";
      case "ppt":
      case "pptx":
        return "PowerPoint";
      case "jpg":
      case "jpeg":
      case "png":
      case "gif":
        return "Image";
      default:
        return "Text";
    }
  }, []);

  const validateFileType = useCallback((file: File): boolean => {
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "image/jpeg",
      "image/png",
      "image/gif",
      "text/plain",
    ];

    return allowedTypes.includes(file.type) || file.size < 50 * 1024 * 1024; // 50MB limit
  }, []);

  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }, []);

  return {
    getFileType,
    validateFileType,
    formatFileSize,
  };
}

// Main optimized hook
export function useOptimizedTiaApp() {
  // Layout state
  const [layout, setLayout] = useState({
    showColumn1: false,
    showColumn2: false,
  });

  // Settings with localStorage persistence
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem("tia-settings");
      return saved
        ? JSON.parse(saved)
        : {
            fontSize: 16,
            language: "en" as Language,
            theme: "light" as const,
            privacySettings: {
              shareUsage: true,
              saveHistory: true,
              allowAnalytics: false,
            },
          };
    } catch {
      return {
        fontSize: 16,
        language: "en" as Language,
        theme: "light" as const,
        privacySettings: {
          shareUsage: true,
          saveHistory: true,
          allowAnalytics: false,
        },
      };
    }
  });

  // Persist settings to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("tia-settings", JSON.stringify(settings));
    } catch (error) {
      console.warn("Failed to save settings to localStorage:", error);
    }
  }, [settings]);

  // Data state with memoization
  const [databases, setDatabases] = useState<Database[]>([
    {
      id: "1",
      name: "Company Policies",
      size: "25.4 MB",
      documentCount: 12,
      createdDate: "2024-01-15",
      lastModified: "2024-01-20",
      documents: [
        {
          id: "doc1",
          name: "Employee Handbook.pdf",
          type: "PDF",
          size: "2.1 MB",
          pages: 45,
          createdDate: "2024-01-10",
          addedDate: "2024-01-15",
          content:
            "This comprehensive employee handbook outlines company policies, procedures, and guidelines for all staff members. It covers workplace conduct, benefits, time-off policies, and professional development opportunities. Section 1: Introduction to Company Culture. Our company values integrity, innovation, and collaboration. We believe in creating an inclusive environment where every employee can thrive. Section 2: Code of Conduct. All employees are expected to maintain professional behavior at all times. This includes respectful communication, punctuality, and adherence to company policies.",
          fileType: "PDF",
        },
        {
          id: "doc2",
          name: "Security Guidelines.docx",
          type: "Word",
          size: "1.8 MB",
          pages: 32,
          createdDate: "2024-01-12",
          addedDate: "2024-01-16",
          content:
            "Security guidelines and protocols for maintaining information security and data protection within the organization. This document covers password policies, data handling procedures, and incident response protocols. Password Requirements: Minimum 12 characters, mix of uppercase, lowercase, numbers, and special characters. Two-factor authentication is mandatory for all accounts.",
          fileType: "Word",
        },
      ],
    },
    {
      id: "2",
      name: "Technical Documentation",
      size: "45.2 MB",
      documentCount: 28,
      createdDate: "2024-01-10",
      lastModified: "2024-01-22",
      documents: [
        {
          id: "doc3",
          name: "API Documentation.pdf",
          type: "PDF",
          size: "3.2 MB",
          pages: 78,
          createdDate: "2024-01-08",
          addedDate: "2024-01-11",
          content:
            "Complete API documentation including endpoints, authentication methods, request/response formats, and integration examples for developers. REST API Endpoints: GET /api/users - Retrieve user list. POST /api/users - Create new user. PUT /api/users/{id} - Update user. DELETE /api/users/{id} - Delete user. Authentication: Bearer token required in Authorization header.",
          fileType: "PDF",
        },
        {
          id: "doc4",
          name: "Project Timeline.xlsx",
          type: "Excel",
          size: "1.5 MB",
          pages: 12,
          createdDate: "2024-01-20",
          addedDate: "2024-01-20",
          content:
            "Project timeline and milestone tracking spreadsheet. Contains task assignments, deadlines, progress tracking, and resource allocation for the Q1 2024 development cycle.",
          fileType: "Excel",
        },
      ],
    },
  ]);

  // Document state
  const [documentState, setDocumentState] = useState({
    selectedDatabase: null as string | null,
    selectedDocument: null as Document | null,
    currentPage: 1,
    zoom: 100,
  });

  // Chat state
  const [chatState, setChatState] = useState({
    messages: [
      {
        id: "1",
        type: "bot" as const,
        content:
          "Hello! I'm Tia, your AI assistant. How can I help you today? I can search through your company documents and provide relevant information.",
        timestamp: new Date().toISOString(),
        documentReferences: [],
      },
      {
        id: "2",
        type: "user" as const,
        content: "What are the company's security guidelines?",
        timestamp: new Date().toISOString(),
        documentReferences: [],
      },
      {
        id: "3",
        type: "bot" as const,
        content:
          "Based on the company's security documentation, here are the key security guidelines: Password requirements include a minimum of 12 characters with a mix of uppercase, lowercase, numbers, and special characters. Two-factor authentication is mandatory for all accounts. All employees must follow data handling procedures and incident response protocols as outlined in our security policies.",
        timestamp: new Date().toISOString(),
        documentReferences: [
          "Security Guidelines.docx",
          "Employee Handbook.pdf",
        ],
      },
    ] as ChatMessage[],
    currentMessage: "",
    currentChatId: "1",
  });

  // Saved chats with initial data
  const [savedChats, setSavedChats] = useState<SavedChat[]>([
    {
      id: "1",
      name: "Welcome Session",
      messages: chatState.messages,
      createdDate: "2024-01-22",
    },
  ]);

  // Processing state
  const [processing, setProcessing] = useState({
    isProcessing: false,
    progress: 0,
    documentsToProcess: 0,
    processedDocuments: 0,
  });

  // Memoized computed values
  const computedValues = useMemo(
    () => ({
      totalDocuments: databases.reduce((sum, db) => sum + db.documentCount, 0),
      totalSize: databases
        .reduce((sum, db) => sum + parseFloat(db.size.replace(" MB", "")), 0)
        .toFixed(1),
      databaseOptions: databases.map((db) => ({
        id: db.id,
        name: db.name,
        documentCount: db.documentCount,
      })),
    }),
    [databases],
  );

  // Optimized action creators
  const actions = useMemo(
    () => ({
      // Layout actions
      toggleColumn1: () =>
        setLayout((prev) => ({ ...prev, showColumn1: !prev.showColumn1 })),
      toggleColumn2: () =>
        setLayout((prev) => ({ ...prev, showColumn2: !prev.showColumn2 })),

      // Settings actions
      updateSettings: (updates: Partial<AppSettings>) =>
        setSettings((prev) => ({ ...prev, ...updates })),

      // Document actions
      selectDocument: (document: Document, databaseId: string) =>
        setDocumentState((prev) => ({
          ...prev,
          selectedDocument: document,
          selectedDatabase: databaseId,
          currentPage: 1,
        })),

      setDocumentPage: (page: number) =>
        setDocumentState((prev) => ({ ...prev, currentPage: page })),

      setDocumentZoom: (zoom: number) =>
        setDocumentState((prev) => ({ ...prev, zoom })),

      // Chat actions
      updateCurrentMessage: (message: string) =>
        setChatState((prev) => ({ ...prev, currentMessage: message })),

      addMessage: (message: ChatMessage) =>
        setChatState((prev) => ({
          ...prev,
          messages: [...prev.messages, message],
        })),

      deleteMessage: (messageId: string) =>
        setChatState((prev) => ({
          ...prev,
          messages: prev.messages.filter((m) => m.id !== messageId),
        })),

      // Processing actions
      startProcessing: () =>
        setProcessing({
          isProcessing: true,
          progress: 0,
          documentsToProcess: 0,
          processedDocuments: 0,
        }),
      updateProgress: (progress: number) =>
        setProcessing((prev) => ({ ...prev, progress })),
      stopProcessing: () =>
        setProcessing({
          isProcessing: false,
          progress: 100,
          documentsToProcess: 0,
          processedDocuments: 0,
        }),

      // Enhanced document processing
      processDocuments: async () => {
        const unprocessedDocs = databases.flatMap((db) =>
          db.documents.filter((doc) => !doc.isProcessed),
        );

        if (unprocessedDocs.length === 0) return;

        setProcessing({
          isProcessing: true,
          progress: 0,
          documentsToProcess: unprocessedDocs.length,
          processedDocuments: 0,
        });

        // Process documents one by one
        for (let i = 0; i < unprocessedDocs.length; i++) {
          const doc = unprocessedDocs[i];

          // Update document status to processing
          setDatabases((prev) =>
            prev.map((db) => ({
              ...db,
              documents: db.documents.map((d) =>
                d.id === doc.id
                  ? { ...d, processingStatus: "processing" as const }
                  : d,
              ),
            })),
          );

          // Simulate processing time
          await new Promise((resolve) =>
            setTimeout(resolve, 1000 + Math.random() * 2000),
          );

          // Mark as processed
          setDatabases((prev) =>
            prev.map((db) => ({
              ...db,
              documents: db.documents.map((d) =>
                d.id === doc.id
                  ? {
                      ...d,
                      isProcessed: true,
                      processingStatus: "completed" as const,
                      content: `Enhanced content for ${d.name}. This document has been processed and indexed for better search capabilities. The content includes detailed information about ${d.type.toLowerCase()} data with improved semantic understanding.`,
                    }
                  : d,
              ),
            })),
          );

          // Update progress
          const processedCount = i + 1;
          setProcessing((prev) => ({
            ...prev,
            progress: Math.round(
              (processedCount / unprocessedDocs.length) * 100,
            ),
            processedDocuments: processedCount,
          }));
        }

        // Complete processing
        setTimeout(() => {
          setProcessing({
            isProcessing: false,
            progress: 100,
            documentsToProcess: 0,
            processedDocuments: 0,
          });
        }, 500);
      },

      // Document reference selection from chat
      selectDocumentByReference: (documentName: string) => {
        // Clean the document name (remove brackets and extra spaces)
        const cleanDocName = documentName.replace(/[\[\]]/g, "").trim();

        for (const db of databases) {
          // Try exact match first, then partial match
          let document = db.documents.find(
            (doc) => doc.name.toLowerCase() === cleanDocName.toLowerCase(),
          );

          if (!document) {
            // Try partial match if exact match fails
            document = db.documents.find(
              (doc) =>
                doc.name.toLowerCase().includes(cleanDocName.toLowerCase()) ||
                cleanDocName.toLowerCase().includes(doc.name.toLowerCase()),
            );
          }

          if (document) {
            // Show document viewer and database panel
            setLayout((prev) => ({
              ...prev,
              showColumn1: true, // Show database panel
              showColumn2: true, // Show document viewer
            }));

            // Select the document
            setDocumentState((prev) => ({
              ...prev,
              selectedDocument: document,
              selectedDatabase: db.id,
              currentPage: 1,
            }));

            // Highlight document in database list (will be handled by UI)
            setTimeout(() => {
              const event = new CustomEvent("highlightDocument", {
                detail: { documentId: document.id, databaseId: db.id },
              });
              window.dispatchEvent(event);
            }, 200);
            break;
          }
        }
      },
    }),
    [],
  );

  return {
    // State
    layout,
    settings,
    databases,
    setDatabases,
    documentState,
    chatState,
    setChatState,
    savedChats,
    setSavedChats,
    processing,

    // Computed values
    computedValues,

    // Actions
    actions,

    // Custom hooks
    modalManager: useModalManager(),
    dragAndDrop: useDragAndDrop(),
    fileOperations: useFileOperations(),
  };
}
