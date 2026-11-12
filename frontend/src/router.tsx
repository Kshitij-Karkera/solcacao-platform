// router.tsx: creates the TanStack Router instance.

import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
// Auto-generated list of all routes built from the files in src/routes
import { routeTree } from "./routeTree.gen";

// TanStack Start calls this to get a fresh router (once per server request)
export const getRouter = () => {
  // New data cache per router so users never share cached data on the server
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    // Made available to every route via useRouteContext()
    context: { queryClient },
    // Restore scroll position on back/forward navigation
    scrollRestoration: true,
    // Preloaded data is treated as stale immediately (TanStack Query manages caching)
    defaultPreloadStaleTime: 0,
  });

  return router;
};
