import React from "react";

export function PerformanceMonitor() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
          if (typeof window !== 'undefined' && window.performance) {
            window.addEventListener('load', () => {
              setTimeout(() => {
                const perfData = performance.getEntriesByType('navigation')[0];
                if (perfData && perfData.loadEventEnd > 3000) {
                  console.warn('Page load time is slow:', perfData.loadEventEnd + 'ms');
                }
              }, 0);
            });
          }
        `,
      }}
    />
  );
}
