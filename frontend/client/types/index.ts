// Re-export types from hooks for easier imports
export type {
  Database,
  Document,
  ChatMessage,
  SavedChat,
  AppSettings,
} from "@/hooks/use-optimized-tia-app";

export type { Language, Translations } from "@/lib/i18n";

// Common UI component props
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export interface ToggleableComponent {
  isVisible: boolean;
  onToggleVisibility: () => void;
}

export interface DragDropHandlers {
  onDragStart: (docId: string, fromDbId: string) => void;
  onDragOver: (e: React.DragEvent, dbId?: string) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, dbId?: string) => void;
}

export interface ProcessingState {
  isProcessing: boolean;
  progress: number;
  documentsToProcess: number;
  processedDocuments: number;
}

export interface DragState {
  draggedDocument: { docId: string; fromDbId: string } | null;
  dragOver: string | null;
  chatDragOver: boolean;
  isDraggingFiles: boolean;
}

export interface FileOperations {
  validateFileType: (file: File) => boolean;
  getFileType: (fileName: string) => Document["fileType"];
  formatFileSize: (bytes: number) => string;
}

// Modal types
export interface ModalState {
  userProfile: boolean;
  security: boolean;
  terms: boolean;
  currentPlan: boolean;
  availablePackages: boolean;
  viewBills: boolean;
  teams: boolean;
}

export interface ModalManager {
  modals: ModalState;
  openModal: (modalName: keyof ModalState) => void;
  closeModal: (modalName: keyof ModalState) => void;
}
