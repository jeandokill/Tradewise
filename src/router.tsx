import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 min — instant revisits
        gcTime: 30 * 60 * 1000,
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  });

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    // Prefetch route code + data on hover/focus/touch so clicks feel instant.
    defaultPreload: "intent",
    defaultPreloadDelay: 50,
    defaultPreloadStaleTime: 0,
    // Show pending UI immediately instead of waiting 1s, so users get
    // visual feedback the moment the URL changes.
    defaultPendingMs: 0,
    defaultPendingMinMs: 0,
  });

  return router;
};
