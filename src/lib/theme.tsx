import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type Theme = "light" | "dark";
const Ctx = createContext<{ theme: Theme; toggle: () => void; setTheme: (t: Theme) => void } | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const stored = (typeof window !== "undefined" && (localStorage.getItem("tf-theme") as Theme | null)) || null;
    const prefersDark = typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches;
    const initial: Theme = stored ?? (prefersDark ? "dark" : "light");
    setTheme(initial);
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.classList.toggle("dark", theme === "dark");
    try { localStorage.setItem("tf-theme", theme); } catch {}
  }, [theme]);

  return (
    <Ctx.Provider value={{ theme, setTheme, toggle: () => setTheme(t => (t === "dark" ? "light" : "dark")) }}>
      {children}
    </Ctx.Provider>
  );
}

export const useTheme = () => {
  const v = useContext(Ctx);
  if (!v) return { theme: "light" as Theme, toggle: () => {}, setTheme: () => {} };
  return v;
};
