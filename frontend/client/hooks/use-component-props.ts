import { useMemo } from "react";
import {
  Database,
  AppSettings,
  ChatMessage,
  SavedChat,
} from "./use-optimized-tia-app";
import { Translations } from "@/lib/i18n";

interface ComponentPropsHookParams {
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
}

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
}: ComponentPropsHookParams) {
  const headerProps = useMemo(
    () => ({
      isAdmin: true,
      currentUser: { name: "John Doe", initials: "JD" },
      onOpenModal: modalManager.openModal,
      language: settings.language,
      t,
    }),
    [modalManager.openModal, settings.language, t],
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
      onFileUpload: handleFileUpload,
      onDragHandlers: {
        onDragStart: dragAndDrop.handleDragStart,
        onDragOver: dragAndDrop.handleDragOver,
        onDragLeave: dragAndDrop.handleDragLeave,
        onDrop: (e: React.DragEvent, dbId?: string) => {
          e.preventDefault();
          dragAndDrop.resetDragState();
          if (e.dataTransfer.files.length > 0 && dbId) {
            handleFileUpload(e.dataTransfer.files, dbId);
          }
        },
        processDocuments: actions.processDocuments,
      },
      t,
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
      onFileUpload: handleChatFileUpload,
      onDragHandlers: {
        onDragOver: dragAndDrop.handleDragOver,
        onDragLeave: dragAndDrop.handleDragLeave,
        onDrop: (e: React.DragEvent) => {
          e.preventDefault();
          dragAndDrop.setChatDragOver(false);
          if (e.dataTransfer.files.length > 0) {
            handleChatFileUpload(e.dataTransfer.files);
          }
        },
        setChatDragOver: dragAndDrop.setChatDragOver,
      },
      onSelectDocumentReference: actions.selectDocumentByReference,
      t,
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
