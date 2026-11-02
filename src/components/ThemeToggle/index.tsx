"use client";

import { useTheme } from "next-themes";
import { FaMoon, FaSun } from "react-icons/fa";

export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className="fixed right-4 top-4 z-50 inline-flex h-10 items-center gap-2 rounded-full border border-hairline bg-surface/90 px-3.5 text-xs font-semibold text-ink shadow-card backdrop-blur-md transition hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-glow"
      aria-label="Alternar entre tema claro e escuro"
    >
      <FaSun size={13} className="hidden dark:block"/>
      <FaMoon size={13} className="dark:hidden"/>
      <span className="dark:hidden">Escuro</span>
      <span className="hidden dark:block">Claro</span>
    </button>
  );
}
