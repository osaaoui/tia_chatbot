import React, { useEffect } from "react"; // Added useEffect
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";
import { listUserProcessedDocuments, ApiUserDocumentInfo } from "@/services/api"; // Import the new service and type
import { Document as AppDocument, Database as AppDatabase } from "@/hooks/use-optimized-tia-app"; // Types for frontend state
import { useOptimizedTiaApp } from "@/hooks/use-optimized-tia-app";
import { useFileUpload } from "@/hooks/use-file-upload";
import { useComponentProps, UseComponentPropsParams } from "@/hooks/use-component-props"; // Import UseComponentPropsParams
import { useThemeEffect } from "@/hooks/use-theme-effect";
import { useAuth } from "@/context/AuthContext"; // Import useAuth

import TiaHeader from "@/components/layout/TiaHeader"; // This might be removed later if requested
import DatabasePanel from "@/components/panels/DatabasePanel";
import DocumentViewer from "@/components/panels/DocumentViewer";
import ChatInterface from "@/components/panels/ChatInterface";
import TiaFooter from "@/components/layout/TiaFooter";
import ModalContainer from "@/components/modals/ModalContainer";
import { ProcessingOverlay } from "@/components/ui/ProcessingOverlay";
import { AccessibilityAnnouncements } from "@/components/ui/AccessibilityAnnouncements";
import { PerformanceMonitor } from "@/components/ui/PerformanceMonitor";

export default function Index() {
  const appState = useOptimizedTiaApp();
  const {
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
    actions,
    modalManager,
    dragAndDrop,
    fileOperations,
  } = appState;

  const t = useTranslation(settings.language);
  const { currentUser, logout } = useAuth(); // Get currentUser and logout from AuthContext

  // Custom hooks for cleaner organization
  useThemeEffect(settings);

  // Effect to load user's documents when currentUser changes (on login or app load with session)
  useEffect(() => {
    if (currentUser && currentUser.username) {
      const fetchUserDocuments = async () => {
        try {
          console.log(`Fetching documents for user: ${currentUser.username}`);
          const userDocsInfo: ApiUserDocumentInfo[] = await listUserProcessedDocuments(currentUser.username);
          console.log("Fetched user documents info:", userDocsInfo);

          // Transform ApiUserDocumentInfo into frontend Document and Database structure
          const transformedDocuments: AppDocument[] = userDocsInfo.map(docInfo => ({
            id: docInfo.filename, // Use filename as ID, ensure unique or use a backend-generated ID if available
            name: docInfo.filename,
            type: fileOperations.getFileType(docInfo.filename), // Infer from filename using existing util
            size: fileOperations.formatFileSize(docInfo.size), // Format size
            pages: 0, // Placeholder - API doesn't return page count for list
            createdDate: new Date(docInfo.modified_date).toISOString().split("T")[0], // Use modified_date
            addedDate: new Date(docInfo.modified_date).toISOString().split("T")[0],   // Use modified_date
            content: "", // Placeholder - Full content not fetched by list endpoint
            fileType: fileOperations.getFileType(docInfo.filename) as AppDocument['fileType'],
            isProcessed: true,
            processingStatus: 'completed',
          }));

          console.log("Transformed documents for frontend state:", transformedDocuments);

          if (transformedDocuments.length > 0) {
            // Group all documents into a single "My Documents" database for now
            const userDatabase: AppDatabase = {
              id: `db-${currentUser.username}-${Date.now()}`, // Generate a unique ID for this frontend DB concept
              name: t.myDocuments || "My Documents", // Use translation if available
              size: transformedDocuments.reduce((acc, doc) => acc + parseFloat(doc.size.split(" ")[0] || "0"), 0).toFixed(1) + " MB", // Crude size sum
              documentCount: transformedDocuments.length,
              createdDate: new Date().toISOString().split("T")[0],
              lastModified: new Date().toISOString().split("T")[0],
              documents: transformedDocuments,
            };
            setDatabases([userDatabase]);
            console.log("Updated databases state with fetched documents:", [userDatabase]);
          } else {
            setDatabases([]); // No documents found for user
            console.log("No documents found for user, setting databases to empty array.");
          }
        } catch (error) {
          console.error("Failed to fetch user documents:", error);
          // Optionally, show a toast to the user
          // toast({ title: "Error", description: "Could not load your documents.", variant: "destructive" });
          setDatabases([]); // Reset on error
        }
      };

      fetchUserDocuments();
    } else {
      // User logged out or no user found, clear databases
      console.log("No current user or username, clearing databases state.");
      setDatabases([]);
    }
  }, [currentUser, setDatabases, fileOperations, t]); // Dependencies: currentUser, setDatabases, fileOperations, t


  // Pass currentUser to useFileUpload if it needs userId, or handle userId within useComponentProps
  // For now, useFileUpload will get userId via useComponentProps
  const { handleFileUpload, handleChatFileUpload } = useFileUpload({
    databases,
    setDatabases,
    fileOperations,
    t,
    userId: currentUser?.username, // Pass the authenticated user's username as userId
  });

  const componentPropsParams: UseComponentPropsParams = { // Explicitly type if not inferred
    layout,
    settings,
    databases,
    documentState,
    chatState,
    savedChats,
    processing,
    dragAndDrop,
    actions,
    modalManager,
    setChatState,
    setSavedChats,
    setDatabases,
    handleFileUpload,
    handleChatFileUpload,
    t,
    currentUser, // Pass currentUser
    logout,      // Pass logout function
  };

  const {
    headerProps,
    databasePanelProps,
    documentViewerProps,
    chatInterfaceProps,
    modalProps,
  } = useComponentProps(componentPropsParams);

  const containerStyle = {
    fontSize: `${settings.fontSize}px`,
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  };

  const containerClasses = cn(
    "h-screen flex flex-col bg-gradient-to-br from-slate-50 to-blue-50 transition-all duration-300",
    settings.theme === "dark" && "dark:from-gray-900 dark:to-gray-800",
  );

  return (
    <div className={containerClasses} style={containerStyle}>
      <TiaHeader {...headerProps} />

      <div className="flex-1 flex overflow-hidden">
        <DatabasePanel {...databasePanelProps} />
        <DocumentViewer {...documentViewerProps} />
        <ChatInterface {...chatInterfaceProps} />
      </div>

      <TiaFooter t={t} />
      <ModalContainer {...modalProps} />

      <ProcessingOverlay
        isProcessing={processing.isProcessing}
        progress={processing.progress}
        processedDocuments={processing.processedDocuments}
        documentsToProcess={processing.documentsToProcess}
      />

      <AccessibilityAnnouncements processing={processing} layout={layout} />
      <PerformanceMonitor />
    </div>
  );
}
