import { useState, useCallback } from "react";

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
  fontSize: "small" | "medium" | "large";
  language: "en" | "es" | "fr";
  theme: "light" | "dark";
}

export function useTiaApp() {
  // Layout state
  const [showColumn1, setShowColumn1] = useState(false);
  const [showColumn2, setShowColumn2] = useState(false);
  const [settings, setSettings] = useState<AppSettings>({
    fontSize: "medium",
    language: "en",
    theme: "light",
  });

  // Mock data
  const [databases] = useState<Database[]>([
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
          name: "Employee Handbook",
          type: "PDF",
          size: "2.1 MB",
          pages: 45,
          createdDate: "2024-01-10",
          addedDate: "2024-01-15",
          content:
            "This comprehensive employee handbook outlines company policies, procedures, and guidelines for all staff members. It covers workplace conduct, benefits, time-off policies, and professional development opportunities.",
        },
        {
          id: "doc2",
          name: "Security Guidelines",
          type: "PDF",
          size: "1.8 MB",
          pages: 32,
          createdDate: "2024-01-12",
          addedDate: "2024-01-16",
          content:
            "Security guidelines and protocols for maintaining information security and data protection within the organization. This document covers password policies, data handling procedures, and incident response protocols.",
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
          name: "API Documentation",
          type: "PDF",
          size: "3.2 MB",
          pages: 78,
          createdDate: "2024-01-08",
          addedDate: "2024-01-11",
          content:
            "Complete API documentation including endpoints, authentication methods, request/response formats, and integration examples for developers.",
        },
      ],
    },
  ]);

  // Document state
  const [selectedDatabase, setSelectedDatabase] = useState<string | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(
    null,
  );
  const [currentDocumentPage, setCurrentDocumentPage] = useState(1);
  const [documentZoom, setDocumentZoom] = useState(100);

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      type: "bot",
      content:
        "Hello! I'm Tia, your AI assistant. How can I help you today? I can search through your company documents and provide relevant information.",
      timestamp: new Date().toISOString(),
      documentReferences: [],
    },
  ]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [savedChats, setSavedChats] = useState<SavedChat[]>([]);
  const [currentChatId, setCurrentChatId] = useState("1");
  const [chatSearchQuery, setChatSearchQuery] = useState("");

  // Actions
  const toggleDatabase = useCallback((databaseId: string) => {
    setSelectedDatabase((prev) => (prev === databaseId ? null : databaseId));
  }, []);

  const selectDocument = useCallback((document: Document) => {
    setSelectedDocument(document);
    setShowColumn2(true);
    setCurrentDocumentPage(1);
  }, []);

  const handleDocumentReference = useCallback(
    (docId: string) => {
      for (const database of databases) {
        const doc = database.documents.find((d) => d.id === docId);
        if (doc) {
          selectDocument(doc);
          setSelectedDatabase(database.id);
          setShowColumn1(true);
          break;
        }
      }
    },
    [databases, selectDocument],
  );

  const sendMessage = useCallback((message: string) => {
    if (!message.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: "user",
      content: message,
      timestamp: new Date().toISOString(),
    };

    setChatMessages((prev) => [...prev, userMessage]);

    // Simulate bot response
    setTimeout(() => {
      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: "bot",
        content: `I understand you're asking about "${message}". Based on the documents in your database, here's what I found. [doc1] [doc2]`,
        timestamp: new Date().toISOString(),
        documentReferences: ["doc1", "doc2"],
      };
      setChatMessages((prev) => [...prev, botMessage]);
    }, 1500);

    setCurrentMessage("");
  }, []);

  const saveConversation = useCallback(() => {
    const newChat: SavedChat = {
      id: Date.now().toString(),
      name: `Chat Session ${savedChats.length + 1}`,
      messages: chatMessages,
      createdDate: new Date().toISOString().split("T")[0],
    };
    setSavedChats((prev) => [...prev, newChat]);
  }, [chatMessages, savedChats.length]);

  const deleteMessage = useCallback((messageId: string) => {
    setChatMessages((prev) => prev.filter((m) => m.id !== messageId));
  }, []);

  const updateSettings = useCallback((newSettings: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  }, []);

  const formatTimestamp = useCallback((timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString("en-US", {
      year: "2-digit",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }, []);

  return {
    // State
    showColumn1,
    showColumn2,
    settings,
    databases,
    selectedDatabase,
    selectedDocument,
    currentDocumentPage,
    documentZoom,
    chatMessages,
    currentMessage,
    savedChats,
    currentChatId,
    chatSearchQuery,

    // Actions
    setShowColumn1,
    setShowColumn2,
    setCurrentMessage,
    setChatSearchQuery,
    setCurrentDocumentPage,
    setDocumentZoom,
    setCurrentChatId,
    toggleDatabase,
    selectDocument,
    handleDocumentReference,
    sendMessage,
    saveConversation,
    deleteMessage,
    updateSettings,
    formatTimestamp,
  };
}
