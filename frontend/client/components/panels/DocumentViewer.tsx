import React, { memo, useCallback } from "react";
import {
  FileText,
  ChevronLeft,
  ChevronRight,
  Search,
  ZoomIn,
  ZoomOut,
  FileImage,
  FileSpreadsheet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Document } from "@/hooks/use-optimized-tia-app";
import { Translations } from "@/lib/i18n";
import { useDocumentSearch } from "@/hooks/use-optimized-tia-app";

interface DocumentViewerProps {
  isVisible: boolean;
  selectedDocument: Document | null;
  currentPage: number;
  zoom: number;
  onToggleVisibility: () => void;
  onPageChange: (page: number) => void;
  onZoomChange: (zoom: number) => void;
  t: Translations;
}

const DocumentViewer = memo<DocumentViewerProps>(
  ({
    isVisible,
    selectedDocument,
    currentPage,
    zoom,
    onToggleVisibility,
    onPageChange,
    onZoomChange,
    t,
  }) => {
    const {
      searchQuery,
      setSearchQuery,
      searchResults,
      currentResult,
      navigateResults,
    } = useDocumentSearch(selectedDocument);

    const getFileTypeIcon = (fileType: Document["fileType"]) => {
      switch (fileType) {
        case "PDF":
          return <FileText className="h-5 w-5 text-red-500" />;
        case "Word":
          return <FileText className="h-5 w-5 text-blue-500" />;
        case "Excel":
          return <FileSpreadsheet className="h-5 w-5 text-green-500" />;
        case "PowerPoint":
          return <FileImage className="h-5 w-5 text-orange-500" />;
        case "Image":
          return <FileImage className="h-5 w-5 text-purple-500" />;
        default:
          return <FileText className="h-5 w-5 text-gray-500" />;
      }
    };

    const renderHighlightedText = useCallback(
      (text: string, searchQuery: string) => {
        if (!searchQuery) return text;

        const parts = text.split(new RegExp(`(${searchQuery})`, "gi"));
        return parts.map((part, index) =>
          part.toLowerCase() === searchQuery.toLowerCase() ? (
            <mark key={index} className="bg-yellow-300">
              {part}
            </mark>
          ) : (
            part
          ),
        );
      },
      [],
    );

    const renderDocumentContent = useCallback(
      (document: Document) => {
        switch (document.fileType) {
          case "PDF":
            return (
              <div className="bg-white dark:bg-gray-900 p-6 rounded border shadow-sm min-h-96">
                <div className="flex items-center gap-2 mb-6 pb-4 border-b">
                  <FileText className="h-6 w-6 text-red-500" />
                  <div className="flex-1">
                    <h2 className="font-bold text-lg text-gray-900 dark:text-white">
                      {document.name}
                    </h2>
                    <p className="text-sm text-gray-500">
                      Page {currentPage} of {document.pages} • PDF Document
                    </p>
                  </div>
                </div>

                {/* PDF page simulation */}
                <div className="bg-gray-50 dark:bg-gray-800 p-8 rounded-lg border mb-4 min-h-[500px]">
                  <div className="bg-white dark:bg-gray-900 p-6 rounded shadow-sm min-h-[450px]">
                    <div className="prose prose-sm max-w-none">
                      <div className="text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">
                        {renderHighlightedText(document.content, searchQuery)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* PDF metadata */}
                <div className="text-xs text-gray-500 border-t pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>Size: {document.size}</div>
                    <div>Created: {document.createdDate}</div>
                    <div>Type: {document.type}</div>
                    <div>Added: {document.addedDate}</div>
                  </div>
                </div>
              </div>
            );
          case "Word":
            return (
              <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded border shadow-sm min-h-96">
                <div className="flex items-center gap-2 mb-6 pb-4 border-b border-blue-200">
                  <FileText className="h-6 w-6 text-blue-500" />
                  <div className="flex-1">
                    <h2 className="font-bold text-lg text-gray-900 dark:text-white">
                      {document.name}
                    </h2>
                    <p className="text-sm text-blue-600">
                      Page {currentPage} of {document.pages} • Word Document
                    </p>
                  </div>
                </div>

                {/* Word document simulation */}
                <div className="bg-white dark:bg-gray-900 p-8 rounded-lg border border-blue-200 mb-4 min-h-[500px]">
                  <div className="prose prose-blue max-w-none">
                    <div className="text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">
                      {renderHighlightedText(document.content, searchQuery)}
                    </div>
                  </div>
                </div>

                {/* Word metadata */}
                <div className="text-xs text-blue-600 border-t border-blue-200 pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>Size: {document.size}</div>
                    <div>Created: {document.createdDate}</div>
                    <div>Type: {document.type}</div>
                    <div>Added: {document.addedDate}</div>
                  </div>
                </div>
              </div>
            );
          case "Excel":
            return (
              <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded border shadow-sm min-h-96">
                <div className="flex items-center gap-2 mb-4">
                  <FileSpreadsheet className="h-5 w-5 text-green-500" />
                  <span className="font-semibold">Excel Spreadsheet</span>
                </div>
                {/* Sample Excel-like table view */}
                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse border border-green-300">
                    <thead>
                      <tr className="bg-green-100">
                        <th className="border border-green-300 px-3 py-2 text-left">
                          Column A
                        </th>
                        <th className="border border-green-300 px-3 py-2 text-left">
                          Column B
                        </th>
                        <th className="border border-green-300 px-3 py-2 text-left">
                          Column C
                        </th>
                        <th className="border border-green-300 px-3 py-2 text-left">
                          Column D
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.from({ length: 10 }, (_, i) => (
                        <tr
                          key={i}
                          className={i % 2 === 0 ? "bg-white" : "bg-green-25"}
                        >
                          <td className="border border-green-300 px-3 py-2">
                            Data {i + 1}A
                          </td>
                          <td className="border border-green-300 px-3 py-2">
                            Data {i + 1}B
                          </td>
                          <td className="border border-green-300 px-3 py-2">
                            Data {i + 1}C
                          </td>
                          <td className="border border-green-300 px-3 py-2">
                            Data {i + 1}D
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="text-gray-600 dark:text-gray-300 mt-4 text-sm">
                  {renderHighlightedText(document.content, searchQuery)}
                </div>
              </div>
            );
          case "PowerPoint":
            return (
              <div className="bg-orange-50 dark:bg-orange-900/20 p-6 rounded border shadow-sm min-h-96">
                <div className="flex items-center gap-2 mb-4">
                  <FileImage className="h-5 w-5 text-orange-500" />
                  <span className="font-semibold">PowerPoint Presentation</span>
                </div>
                {/* Slide preview */}
                <div className="bg-white border-2 border-orange-200 rounded-lg p-8 mb-4 text-center aspect-video flex items-center justify-center">
                  <div className="text-center">
                    <h3 className="text-xl font-bold mb-4">
                      Slide {currentPage}
                    </h3>
                    <div className="text-gray-600 leading-relaxed">
                      {renderHighlightedText(
                        `Slide content for page ${currentPage}. ${document.content.substring(0, 200)}...`,
                        searchQuery,
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-gray-600 dark:text-gray-300 text-sm">
                  Full presentation content:{" "}
                  {renderHighlightedText(document.content, searchQuery)}
                </div>
              </div>
            );
          case "Image":
            return (
              <div className="bg-purple-50 dark:bg-purple-900/20 p-6 rounded border shadow-sm min-h-96">
                <div className="flex items-center gap-2 mb-4">
                  <FileImage className="h-5 w-5 text-purple-500" />
                  <span className="font-semibold">Image Document</span>
                </div>
                {/* Image placeholder */}
                <div className="bg-white border-2 border-purple-200 rounded-lg p-8 mb-4 text-center aspect-video flex items-center justify-center">
                  <div className="text-center">
                    <FileImage className="h-16 w-16 text-purple-400 mx-auto mb-4" />
                    <p className="text-gray-500">Image Preview</p>
                    <p className="text-sm text-gray-400 mt-2">
                      {document.name}
                    </p>
                  </div>
                </div>
                <div className="text-gray-600 dark:text-gray-300 text-sm">
                  {renderHighlightedText(document.content, searchQuery)}
                </div>
              </div>
            );
          default:
            return (
              <div className="bg-white dark:bg-gray-900 p-6 rounded border shadow-sm min-h-96">
                <div className="text-gray-800 dark:text-gray-200 leading-relaxed">
                  {renderHighlightedText(document.content, searchQuery)}
                </div>
              </div>
            );
        }
      },
      [searchQuery, renderHighlightedText],
    );

    if (!isVisible) return null;

    return (
      <div className="w-96 bg-white dark:bg-gray-800 border-r-2 border-blue-100 dark:border-blue-800 transition-all duration-300 shadow-lg">
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="p-4 border-b bg-gray-50 dark:bg-gray-700">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-800 dark:text-white flex items-center">
                <FileText className="mr-2 h-5 w-5 text-blue-600" />
                {t.documentViewer}
              </h2>
              <Button variant="ghost" size="sm" onClick={onToggleVisibility}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </div>

            {selectedDocument && (
              <div className="mt-2">
                <div className="flex items-center gap-2">
                  {getFileTypeIcon(selectedDocument.fileType)}
                  <div className="text-sm font-medium">
                    {selectedDocument.name}
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  {t.page} {currentPage} {t.of} {selectedDocument.pages}
                </div>
              </div>
            )}

            {/* Document Search */}
            <div className="mt-2 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
                <Input
                  placeholder={t.searchInDocument}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-8 text-xs"
                />
              </div>
              {searchResults.length > 0 && (
                <div className="flex items-center gap-1">
                  <span className="text-xs text-gray-500">
                    {currentResult + 1}/{searchResults.length}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => navigateResults("prev")}
                    disabled={searchResults.length === 0}
                  >
                    <ChevronLeft className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => navigateResults("next")}
                    disabled={searchResults.length === 0}
                  >
                    <ChevronRight className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Document Controls */}
          {selectedDocument && (
            <div className="p-3 border-b bg-gray-50 dark:bg-gray-700 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onZoomChange(Math.max(50, zoom - 10))}
                >
                  <ZoomOut className="h-3 w-3" />
                </Button>
                <span className="text-xs">{zoom}%</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onZoomChange(Math.min(200, zoom + 10))}
                >
                  <ZoomIn className="h-3 w-3" />
                </Button>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage <= 1}
                  onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                >
                  <ChevronLeft className="h-3 w-3" />
                </Button>
                <Input
                  className="w-12 h-7 text-xs text-center"
                  value={currentPage}
                  onChange={(e) => {
                    const page = Math.max(
                      1,
                      Math.min(
                        selectedDocument.pages,
                        parseInt(e.target.value) || 1,
                      ),
                    );
                    onPageChange(page);
                  }}
                />
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage >= selectedDocument.pages}
                  onClick={() =>
                    onPageChange(
                      Math.min(selectedDocument.pages, currentPage + 1),
                    )
                  }
                >
                  <ChevronRight className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}

          {/* Document Content */}
          <ScrollArea className="flex-1">
            <div className="p-4">
              {selectedDocument ? (
                <div
                  className="max-w-none"
                  style={{
                    transform: `scale(${zoom / 100})`,
                    transformOrigin: "top left",
                  }}
                >
                  {renderDocumentContent(selectedDocument)}
                  <div className="mt-8 text-center text-gray-400 text-sm">
                    {t.page} {currentPage} {t.of} {selectedDocument.pages}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  {t.selectDocument}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    );
  },
);

DocumentViewer.displayName = "DocumentViewer";

export default DocumentViewer;
