export const DOCUMENT_TYPES = {
  PDF: "PDF",
  WORD: "Word",
  EXCEL: "Excel",
  POWERPOINT: "PowerPoint",
  IMAGE: "Image",
  TEXT: "Text",
} as const;

export const FILE_TYPE_EXTENSIONS = {
  ".pdf": DOCUMENT_TYPES.PDF,
  ".doc": DOCUMENT_TYPES.WORD,
  ".docx": DOCUMENT_TYPES.WORD,
  ".xls": DOCUMENT_TYPES.EXCEL,
  ".xlsx": DOCUMENT_TYPES.EXCEL,
  ".ppt": DOCUMENT_TYPES.POWERPOINT,
  ".pptx": DOCUMENT_TYPES.POWERPOINT,
  ".jpg": DOCUMENT_TYPES.IMAGE,
  ".jpeg": DOCUMENT_TYPES.IMAGE,
  ".png": DOCUMENT_TYPES.IMAGE,
  ".gif": DOCUMENT_TYPES.IMAGE,
  ".txt": DOCUMENT_TYPES.TEXT,
} as const;

export const PROCESSING_STATUS = {
  PENDING: "pending",
  PROCESSING: "processing",
  COMPLETED: "completed",
  ERROR: "error",
} as const;

export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export const SUPPORTED_EXTENSIONS = Object.keys(FILE_TYPE_EXTENSIONS).join(",");

export const ICON_STYLES = {
  PDF: "h-3 w-3 text-red-500",
  Word: "h-3 w-3 text-blue-500",
  Excel: "h-3 w-3 text-green-500",
  PowerPoint: "h-3 w-3 text-orange-500",
  Image: "h-3 w-3 text-purple-500",
  Text: "h-3 w-3 text-gray-500",
} as const;
