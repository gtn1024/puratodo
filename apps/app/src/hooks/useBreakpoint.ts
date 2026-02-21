import { useState, useEffect } from "react";

interface BreakpointValues {
  isXs: boolean;   // < 640px
  isSm: boolean;   // >= 640px
  isMd: boolean;   // >= 768px
  isLg: boolean;   // >= 1024px
  isXl: boolean;   // >= 1280px
  width: number;
  // Derived helpers
  showDetailPanel: boolean;   // xl and above - show right side panel
  showSidebarSheet: boolean;  // xs only - sidebar should be in Sheet
}

const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
};

export function useBreakpoint(): BreakpointValues {
  const [width, setWidth] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth;
    }
    return 1024; // Default to desktop
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleResize = () => {
      setWidth(window.innerWidth);
    };

    // Initial update
    handleResize();

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isXs = width < BREAKPOINTS.sm;
  const isSm = width >= BREAKPOINTS.sm;
  const isMd = width >= BREAKPOINTS.md;
  const isLg = width >= BREAKPOINTS.lg;
  const isXl = width >= BREAKPOINTS.xl;

  return {
    isXs,
    isSm,
    isMd,
    isLg,
    isXl,
    width,
    // Right side detail panel shows on xl (>= 1280px)
    showDetailPanel: isXl,
    // Sidebar as Sheet on xs (< 640px)
    showSidebarSheet: isXs,
  };
}
