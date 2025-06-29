import React from "react";
import { FileCheck, ExternalLink, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TermsModal({ isOpen, onClose }: TermsModalProps) {
  const handleOpenTerms = () => {
    // Open terms document in new tab
    window.open("https://softia.ca/terms-of-use", "_blank");
  };

  const handleOpenPrivacy = () => {
    // Open privacy policy in new tab
    window.open("https://softia.ca/privacy-policy", "_blank");
  };

  const handleOpenDataHandling = () => {
    // Open data handling document in new tab
    window.open("https://softia.ca/data-handling", "_blank");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileCheck className="h-5 w-5 text-blue-600" />
            Terms of Use & Legal Documents
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <div className="space-y-4">
            <div className="text-sm text-gray-600 mb-4">
              Access our legal documents and policies regarding data handling
              and platform usage.
            </div>

            {/* Terms of Use */}
            <div className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">Terms of Use</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Platform usage terms and conditions
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleOpenTerms}
                  className="flex items-center gap-2"
                >
                  <ExternalLink className="h-3 w-3" />
                  View
                </Button>
              </div>
            </div>

            {/* Privacy Policy */}
            <div className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">Privacy Policy</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    How we collect and use your information
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleOpenPrivacy}
                  className="flex items-center gap-2"
                >
                  <ExternalLink className="h-3 w-3" />
                  View
                </Button>
              </div>
            </div>

            {/* Data Handling */}
            <div className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">
                    Data Handling Policy
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Detailed information about data processing and security
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleOpenDataHandling}
                  className="flex items-center gap-2"
                >
                  <ExternalLink className="h-3 w-3" />
                  View
                </Button>
              </div>
            </div>

            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> By using this platform, you agree to our
                terms of use and data handling policies. Last updated: January
                2024.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={onClose} className="bg-blue-600 hover:bg-blue-700">
            <X className="mr-2 h-4 w-4" />
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default TermsModal;
