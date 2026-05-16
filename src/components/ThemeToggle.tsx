import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/lib/theme";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className, variant = "ghost" }: { className?: string; variant?: "ghost" | "outline" }) {
  const { theme, toggle } = useTheme();
  return (
    <Button
      type="button"
      onClick={toggle}
      variant={variant}
      size="icon"
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      className={cn("relative overflow-hidden rounded-full", className)}
    >
      <Sun className={cn("h-4 w-4 transition-all", theme === "dark" ? "scale-0 -rotate-90 opacity-0" : "scale-100 rotate-0 opacity-100")} />
      <Moon className={cn("absolute h-4 w-4 transition-all", theme === "dark" ? "scale-100 rotate-0 opacity-100" : "scale-0 rotate-90 opacity-0")} />
    </Button>
  );
}
