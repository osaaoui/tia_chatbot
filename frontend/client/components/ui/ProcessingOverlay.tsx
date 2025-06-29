import React from "react";

interface ProcessingOverlayProps {
  isProcessing: boolean;
  progress: number;
  processedDocuments: number;
  documentsToProcess: number;
}

export function ProcessingOverlay({
  isProcessing,
  progress,
  processedDocuments,
  documentsToProcess,
}: ProcessingOverlayProps) {
  if (!isProcessing) return null;

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-xl max-w-sm w-full mx-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold mb-2">Processing Documents</h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
            Please wait while we process your documents...
          </p>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {processedDocuments}/{documentsToProcess} documents ({progress}%
            complete)
          </p>
        </div>
      </div>
    </div>
  );
}
