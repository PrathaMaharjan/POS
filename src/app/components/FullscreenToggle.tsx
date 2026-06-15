"use client";

import { useState, useEffect } from "react";

export default function FullscreenToggle() {
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Sync state if the user presses 'Esc' to exit fullscreen manually
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        // Enter Fullscreen mode for the whole browser window
        await document.documentElement.requestFullscreen();
      } else {
        // Exit Fullscreen mode
        await document.exitFullscreen();
      }
    } catch (err) {
      console.error("Error attempting to toggle fullscreen mode:", err);
    }
  };

  return (
    <button
      onClick={toggleFullscreen}
      className="flex items-center gap-2 bg-[#141416] border border-neutral-800 hover:border-white text-neutral-400 hover:text-white px-4 py-2 rounded-xl text-xs font-semibold tracking-wide uppercase transition-all duration-150 shrink-0"
      title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
    >
      {isFullscreen ? (
        <>
          {/* Minimize Icon */}
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 14h6v6M20 10h-6V4M14 10l7-7M10 14l-7 7"/>
          </svg>
          Normal Screen
        </>
      ) : (
        <>
          {/* Maximize Icon */}
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3"/>
          </svg>
          Full Screen
        </>
      )}
    </button>
  );
}