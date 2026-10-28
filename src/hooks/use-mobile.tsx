// useIsMobile(): true when the viewport is narrower than 768px.
// Used by shadcn components (e.g. the sidebar) to switch to mobile layouts.

import * as React from "react";

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  // undefined until measured in the browser (the server has no screen width)
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    // Re-check whenever the viewport crosses the breakpoint
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    mql.addEventListener("change", onChange);
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    // Clean up the listener when the component unmounts
    return () => mql.removeEventListener("change", onChange);
  }, []);

  // Convert undefined to false
  return !!isMobile;
}
