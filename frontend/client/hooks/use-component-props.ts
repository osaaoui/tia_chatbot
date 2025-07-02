import { useMemo } from "react";
import { UserResponse } from "@/services/api"; // For currentUser type
import {
  Database,
  AppSettings,
  ChatMessage, // Assuming this is AppChatMessage from use-optimized-tia-app
  SavedChat,
} from "./use-optimized-tia-app";
import { Translations } from "@/lib/i18n";

// Exporting the params type for use in Index.tsx
export interface UseComponentPropsParams {
  layout: {
    showColumn1: boolean;
    showColumn2: boolean;
  };
  settings: AppSettings;
  databases: Database[];
  documentState: {
    selectedDatabase: string | null;
    selectedDocument: any;
    currentPage: number;
    zoom: number;
  };
  chatState: {
    messages: ChatMessage[];
    currentMessage: string;
    currentChatId: string;
  };
  savedChats: SavedChat[];
  processing: {
    isProcessing: boolean;
    progress: number;
    documentsToProcess: number;
    processedDocuments: number;
  };
  dragAndDrop: any;
  actions: any;
  modalManager: any;
  setChatState: any;
  setSavedChats: any;
  setDatabases: any;
  handleFileUpload: (files: FileList | null, targetDbId: string) => void;
  handleChatFileUpload: (files: FileList | null) => void;
  t: Translations;
  currentUser: UserResponse | null; // Added
  logout: () => void;              // Added
}

// Renamed function to match export convention if needed, or keep as is
export function useComponentProps({
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
  currentUser, // Destructure new props
  logout,      // Destructure new props
}: UseComponentPropsParams) { // Ensure this matches the exported interface name

  // Derive userId for components that need it.
  // Note: useFileUpload is instantiated in Index.tsx and its props are set there.
  // If useFileUpload needs userId, Index.tsx should pass it when creating the hook instance.
  // For DatabasePanel and ChatInterface, we pass currentUser or derived userId.
  const userId = currentUser?.username || "default_user"; // Fallback if needed, though currentUser should exist on protected routes

  const headerProps = useMemo(
    () => ({
      // isAdmin: currentUser?.role === 'admin', // Derive from currentUser
      // currentUser: currentUser ? { name: currentUser.full_name || currentUser.username, initials: currentUser.username.substring(0,2).toUpperCase() } : null,
      // The TiaHeader was requested to be removed. If it's brought back or another header needs this:
      userFullName: currentUser?.full_name || currentUser?.username,
      onLogout: logout, // Pass logout function
      onOpenModal: modalManager.openModal,
      language: settings.language,
      t,
    }),
    [currentUser, logout, modalManager.openModal, settings.language, t],
  );

  const databasePanelProps = useMemo(
    () => ({
      isVisible: layout.showColumn1,
      databases,
      selectedDatabase: documentState.selectedDatabase,
      processing,
      dragState: dragAndDrop.dragState,
      onToggleVisibility: actions.toggleColumn1,
      onDatabaseAction: setDatabases,
      onSelectDocument: actions.selectDocument,
      onFileUpload: handleFileUpload, // This handleFileUpload needs to use the correct userId
      onDragHandlers: {
        onDragStart: dragAndDrop.handleDragStart,
        onDragOver: dragAndDrop.handleDragOver,
        onDragLeave: dragAndDrop.handleDragLeave,
        onDrop: (e: React.DragEvent, dbId?: string) => {
          e.preventDefault();
          dragAndDrop.resetDragState();
          if (e.dataTransfer.files.length > 0 && dbId) {
            // handleFileUpload here is the one passed from Index.tsx, which should be correctly bound with userId
            handleFileUpload(e.dataTransfer.files, dbId);
          }
        },
        processDocuments: actions.processDocuments, // This also might need userId if it makes API calls
      },
      t,
      currentUser, // Pass currentUser for role checks and display
      logout, // Pass logout for user display/logout button in sidebar
    }),
    [
      layout.showColumn1,
      databases,
      documentState.selectedDatabase,
      processing,
      dragAndDrop,
      actions.toggleColumn1,
      actions.selectDocument,
      actions.processDocuments,
      handleFileUpload,
      setDatabases,
      t,
      currentUser,
      logout,
    ],
  );

  const documentViewerProps = useMemo(
    () => ({
      isVisible: layout.showColumn2,
      selectedDocument: documentState.selectedDocument,
      currentPage: documentState.currentPage,
      zoom: documentState.zoom,
      onToggleVisibility: actions.toggleColumn2,
      onPageChange: actions.setDocumentPage,
      onZoomChange: actions.setDocumentZoom,
      t,
    }),
    [
      layout.showColumn2,
      documentState,
      actions.toggleColumn2,
      actions.setDocumentPage,
      actions.setDocumentZoom,
      t,
    ],
  );

  const chatInterfaceProps = useMemo(
    () => ({
      chatState,
      savedChats,
      settings,
      dragState: dragAndDrop.dragState,
      columnStates: layout,
      onChatAction: setChatState,
      onSavedChatsAction: setSavedChats,
      onSettingsChange: actions.updateSettings,
      onToggleColumns: {
        toggleColumn1: actions.toggleColumn1,
        toggleColumn2: actions.toggleColumn2,
      },
      onFileUpload: handleChatFileUpload, // This also needs to be userId aware
      onDragHandlers: {
        onDragOver: dragAndDrop.handleDragOver,
        onDragLeave: dragAndDrop.handleDragLeave,
        onDrop: (e: React.DragEvent) => {
          e.preventDefault();
          dragAndDrop.setChatDragOver(false);
          if (e.dataTransfer.files.length > 0) {
            // handleChatFileUpload needs userId
            handleChatFileUpload(e.dataTransfer.files);
          }
        },
        setChatDragOver: dragAndDrop.setChatDragOver,
      },
      onSelectDocumentReference: actions.selectDocumentByReference,
      t,
      currentUserId: userId, // Pass the derived userId
      currentUserFullName: currentUser?.full_name || currentUser?.username, // For display purposes if needed
    }),
    [
      chatState,
      savedChats,
      settings,
      dragAndDrop,
      layout,
      setChatState,
      setSavedChats,
      actions,
      handleChatFileUpload,
      t,
      userId, // Add userId to dependency array
      currentUser, // Add currentUser for full name
    ],
  );

  const modalProps = useMemo(
    () => ({
      modals: modalManager.modals,
      onClose: modalManager.closeModal,
    }),
    [modalManager.modals, modalManager.closeModal],
  );

  return {
    headerProps,
    databasePanelProps,
    documentViewerProps,
    chatInterfaceProps,
    modalProps,
  };
}
