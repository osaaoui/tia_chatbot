import React from "react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";
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
