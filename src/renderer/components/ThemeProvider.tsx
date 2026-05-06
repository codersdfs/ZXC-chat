import { createContext, useContext, useEffect, useState } from "react";

interface ThemeContextType {
  theme: "light" | "dark";
  themeMode: "light" | "dark" | "system";
  setThemeMode: (mode: "light" | "dark" | "system") => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

const getSystemTheme = () =>
  window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";

const getStoredThemeMode = () => {
  const stored = localStorage.getItem("themeMode");
  if (stored === "light" || stored === "dark" || stored === "system") {
    return stored;
  }
  return "system";
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [themeMode, setThemeModeState] = useState<"light" | "dark" | "system">(
    () => getStoredThemeMode(),
  );
  const [theme, setTheme] = useState<"light" | "dark">(() =>
    getStoredThemeMode() === "system" ? getSystemTheme() : (getStoredThemeMode() as "light" | "dark"),
  );

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (event: MediaQueryListEvent) => {
      if (themeMode === "system") {
        setTheme(event.matches ? "dark" : "light");
      }
    };

    if (themeMode === "system") {
      media.addEventListener("change", handleChange);
    }

    return () => {
      media.removeEventListener("change", handleChange);
    };
  }, [themeMode]);

  useEffect(() => {
    localStorage.setItem("themeMode", themeMode);
    document.documentElement.setAttribute("data-theme", theme);
  }, [themeMode, theme]);

  const setThemeMode = (mode: "light" | "dark" | "system") => {
    setThemeModeState(mode);
    setTheme(mode === "system" ? getSystemTheme() : mode);
  };

  const toggleTheme = () => {
    setThemeMode(theme === "light" ? "dark" : "light");
  };

  return (
    <ThemeContext.Provider value={{ theme, themeMode, setThemeMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
