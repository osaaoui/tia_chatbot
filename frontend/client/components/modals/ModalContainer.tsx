import React, { memo, Suspense, lazy } from "react";

// Lazy load modals for better performance
const UserProfileModal = lazy(() => import("./UserProfileModal"));
const SecurityModal = lazy(() => import("./SecurityModal"));
const TermsModal = lazy(() => import("./TermsModal"));
const CurrentPlanModal = lazy(() => import("./CurrentPlanModal"));
const AvailablePackagesModal = lazy(() => import("./AvailablePackagesModal"));
const ViewBillsModal = lazy(() => import("./ViewBillsModal"));
const TeamsModal = lazy(() => import("./TeamsModal"));

interface ModalContainerProps {
  modals: {
    userProfile: boolean;
    security: boolean;
    terms: boolean;
    currentPlan: boolean;
    availablePackages: boolean;
    viewBills: boolean;
    teams: boolean;
  };
  onClose: (modalName: string) => void;
}

// Simple loading component for modals
const ModalLoadingFallback = memo(() => (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-xl">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
        Loading...
      </p>
    </div>
  </div>
));

const ModalContainer = memo<ModalContainerProps>(({ modals, onClose }) => {
  return (
    <>
      <Suspense fallback={<ModalLoadingFallback />}>
        {modals.userProfile && (
          <UserProfileModal
            isOpen={modals.userProfile}
            onClose={() => onClose("userProfile")}
          />
        )}
      </Suspense>

      <Suspense fallback={<ModalLoadingFallback />}>
        {modals.security && (
          <SecurityModal
            isOpen={modals.security}
            onClose={() => onClose("security")}
          />
        )}
      </Suspense>

      <Suspense fallback={<ModalLoadingFallback />}>
        {modals.terms && (
          <TermsModal isOpen={modals.terms} onClose={() => onClose("terms")} />
        )}
      </Suspense>

      <Suspense fallback={<ModalLoadingFallback />}>
        {modals.currentPlan && (
          <CurrentPlanModal
            isOpen={modals.currentPlan}
            onClose={() => onClose("currentPlan")}
          />
        )}
      </Suspense>

      <Suspense fallback={<ModalLoadingFallback />}>
        {modals.availablePackages && (
          <AvailablePackagesModal
            isOpen={modals.availablePackages}
            onClose={() => onClose("availablePackages")}
          />
        )}
      </Suspense>

      <Suspense fallback={<ModalLoadingFallback />}>
        {modals.viewBills && (
          <ViewBillsModal
            isOpen={modals.viewBills}
            onClose={() => onClose("viewBills")}
          />
        )}
      </Suspense>

      <Suspense fallback={<ModalLoadingFallback />}>
        {modals.teams && (
          <TeamsModal isOpen={modals.teams} onClose={() => onClose("teams")} />
        )}
      </Suspense>
    </>
  );
});

ModalContainer.displayName = "ModalContainer";

export default ModalContainer;
