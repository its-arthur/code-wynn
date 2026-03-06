"use client";

import { useEffect } from "react";

/** Prevents Ctrl/Cmd + scroll wheel zoom on the whole page */
export function DisableZoomHandler() {
  useEffect(() => {
    const preventZoom = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) e.preventDefault();
    };
    document.addEventListener("wheel", preventZoom, { passive: false });
    return () => document.removeEventListener("wheel", preventZoom);
  }, []);
  return null;
}
