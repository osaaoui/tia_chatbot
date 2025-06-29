import React from "react";

interface AccessibilityAnnouncementsProps {
  processing: {
    isProcessing: boolean;
    progress: number;
  };
  layout: {
    showColumn1: boolean;
    showColumn2: boolean;
  };
}

export function AccessibilityAnnouncements({
  processing,
  layout,
}: AccessibilityAnnouncementsProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
    >
      {processing.isProcessing &&
        `Processing documents: ${processing.progress}% complete`}
      {layout.showColumn1 && "Database panel opened"}
      {layout.showColumn2 && "Document viewer opened"}
    </div>
  );
}
