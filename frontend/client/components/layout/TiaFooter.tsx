import React, { memo } from "react";
import { Translations } from "@/lib/i18n";

interface TiaFooterProps {
  t: Translations;
}

const TiaFooter = memo<TiaFooterProps>(({ t }) => {
  return (
    <footer className="bg-gray-800 text-white py-2 px-6 border-t-4 border-blue-600">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <p className="text-xs text-gray-300">{t.footerText}</p>
        </div>
        <div className="text-xs text-gray-400">
          © 2024 Softia.ca - {t.rightsReserved}
        </div>
      </div>
    </footer>
  );
});

TiaFooter.displayName = "TiaFooter";

export default TiaFooter;
