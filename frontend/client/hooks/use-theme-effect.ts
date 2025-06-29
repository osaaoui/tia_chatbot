import { useEffect } from "react";
import { AppSettings } from "./use-optimized-tia-app";

export function useThemeEffect(settings: AppSettings) {
  useEffect(() => {
    const applyTheme = () => {
      const isDark =
        settings.theme === "dark" ||
        (settings.theme === "auto" &&
          window.matchMedia("(prefers-color-scheme: dark)").matches);

      document.documentElement.classList.toggle("dark", isDark);
    };

    applyTheme();

    if (settings.theme === "auto") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleChange = () => applyTheme();
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
  }, [settings.theme]);
}
