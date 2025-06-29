import React from "react";
import { Package, ExternalLink, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface AvailablePackagesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AvailablePackagesModal({
  isOpen,
  onClose,
}: AvailablePackagesModalProps) {
  const handleViewPackages = () => {
    // Open packages page in new tab
    window.open("https://softia.ca/pricing-packages", "_blank");
  };

  const packages = [
    {
      name: "Starter",
      price: "$49.99/month",
      users: "Up to 10 users",
      storage: "500 GB",
      features: ["Basic AI Support", "Standard Security", "Email Support"],
    },
    {
      name: "Professional",
      price: "$149.99/month",
      users: "Up to 25 users",
      storage: "1 TB",
      features: [
        "Advanced AI Support",
        "Enhanced Security",
        "Priority Support",
        "API Access",
      ],
    },
    {
      name: "Enterprise Pro",
      price: "$299.99/month",
      users: "Up to 50 users",
      storage: "2 TB",
      features: [
        "Premium AI Support",
        "Enterprise Security",
        "24/7 Support",
        "Full API Access",
        "Custom Integrations",
      ],
      current: true,
    },
    {
      name: "Enterprise Max",
      price: "$599.99/month",
      users: "Up to 100 users",
      storage: "5 TB",
      features: [
        "Elite AI Support",
        "Maximum Security",
        "Dedicated Support",
        "Full API Access",
        "Custom Integrations",
        "White-label Options",
      ],
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-blue-600" />
            Available Packages
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <div className="mb-4">
            <p className="text-sm text-gray-600">
              Explore our available packages and upgrade options for your team.
            </p>
          </div>

          {/* Quick Link to Full Packages Page */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-blue-900">
                  View Complete Package Details
                </h3>
                <p className="text-sm text-blue-700 mt-1">
                  See detailed comparisons, add-ons, and custom enterprise
                  options
                </p>
              </div>
              <Button
                onClick={handleViewPackages}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                View All Packages
              </Button>
            </div>
          </div>

          {/* Package Preview Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {packages.map((pkg, index) => (
              <div
                key={index}
                className={`border rounded-lg p-4 ${
                  pkg.current
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                } transition-colors`}
              >
                <div className="text-center">
                  {pkg.current && (
                    <div className="mb-2">
                      <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                        Current Plan
                      </span>
                    </div>
                  )}
                  <h3 className="font-semibold text-lg text-gray-900">
                    {pkg.name}
                  </h3>
                  <div className="text-2xl font-bold text-blue-600 mt-2">
                    {pkg.price}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">{pkg.users}</div>
                  <div className="text-sm text-gray-500">{pkg.storage}</div>
                </div>

                <div className="mt-4 space-y-2">
                  <h4 className="font-medium text-sm">Features:</h4>
                  <ul className="text-xs text-gray-600 space-y-1">
                    {pkg.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center">
                        <span className="w-1 h-1 bg-blue-400 rounded-full mr-2"></span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                {!pkg.current && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-4"
                    onClick={() =>
                      alert(`Upgrade to ${pkg.name} plan initiated`)
                    }
                  >
                    Upgrade
                  </Button>
                )}
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-gray-50 border rounded-lg">
            <p className="text-sm text-gray-600">
              <strong>Need a custom solution?</strong> Contact our sales team
              for enterprise packages with custom user limits, storage, and
              specialized features tailored to your organization's needs.
            </p>
            <Button variant="outline" size="sm" className="mt-2">
              Contact Sales
            </Button>
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

export default AvailablePackagesModal;
