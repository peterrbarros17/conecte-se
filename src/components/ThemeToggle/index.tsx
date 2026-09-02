"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { FaMoon, FaSun } from "react-icons/fa";

export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <span
        className="fixed right-4 top-4 z-50 h-10 w-[6.5rem] rounded-full border border-hairline bg-surface/80 shadow-card backdrop-blur-md"
        aria-hidden
      />
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="fixed right-4 top-4 z-50 inline-flex h-10 items-center gap-2 rounded-full border border-hairline bg-surface/90 px-3.5 text-xs font-semibold text-ink shadow-card backdrop-blur-md transition hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-glow"
      aria-label={isDark ? "Ativar tema claro" : "Ativar tema escuro"}
    >
      {isDark ? <FaSun size={13} /> : <FaMoon size={13} />}
      {isDark ? "Claro" : "Escuro"}
    </button>
  );
}
