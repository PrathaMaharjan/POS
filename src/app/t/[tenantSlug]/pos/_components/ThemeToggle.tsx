"use client";

import React from 'react';
import { useTheme } from '@/app/t/[tenantSlug]/pos/context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      type="button"
      className="p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#141416] text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-all duration-150"
      aria-label="Toggle Interface Theme"
    >
      {theme === 'dark' ? (
        <Sun className="w-4.5 h-4.5 text-[#e5b83b]" strokeWidth={2} />
      ) : (
        <Moon className="w-4.5 h-4.5 text-neutral-600" strokeWidth={2} />
      )}
    </button>
  );
}