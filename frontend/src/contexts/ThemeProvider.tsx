import { createContext, useContext, useEffect, useState } from "react";
import { getItem, setItem } from "@/lib/localStorage";
import {
  createTheme,
  ThemeProvider as MuiThemeProvider,
} from "@mui/material/styles";
import { CssBaseline } from "@mui/material";

type Theme = "dark" | "light" | "system";

type ThemeProviderState = {
  theme: Theme;
  resolvedTheme: Exclude<Theme, "system">;
  setTheme: (theme: Theme) => void;
};

const ThemeContext = createContext<ThemeProviderState>({
  theme: "system",
  resolvedTheme: "light",
  setTheme: () => {},
});

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

// ✅ define your MUI themes once
const lightMuiTheme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#001081" }, // Blue
    secondary: { main: "#1eed93" }, // Green
  },
});

const darkMuiTheme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#1eed93" }, // Green pops
    secondary: { main: "#4c6ef5" }, // Softer blue
    background: { default: "#0b0f19", paper: "#141a29" },
  },
});

const getSystemPreference = (): Exclude<Theme, "system"> => {
  if (typeof window === "undefined") {
    return "light";
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "tasks-management-theme",
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    getItem(storageKey) ?? defaultTheme,
  );
  const [systemTheme, setSystemTheme] =
    useState<Exclude<Theme, "system">>(getSystemPreference);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (event: MediaQueryListEvent) => {
      setSystemTheme(event.matches ? "dark" : "light");
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const root = window.document.documentElement;
    root.classList.remove("light", "dark");

    const appliedTheme = theme === "system" ? systemTheme : theme;
    root.classList.add(appliedTheme);
    setItem(storageKey, appliedTheme);
  }, [theme, storageKey, systemTheme]);

  const resolvedTheme = theme === "system" ? systemTheme : theme;
  const muiTheme = resolvedTheme === "dark" ? darkMuiTheme : lightMuiTheme;

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      <MuiThemeProvider theme={muiTheme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useTheme = () => {
  const context = useContext(ThemeContext);

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider");

  return context;
};
