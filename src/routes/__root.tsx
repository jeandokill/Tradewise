import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";

import appCss from "../styles.css?url";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CartProvider } from "@/lib/cart";
import { AdminProvider } from "@/lib/admin";
import { Toaster } from "@/components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-primary">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">The page you're looking for doesn't exist.</p>
        <Link to="/" className="mt-6 inline-flex rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">Go home</Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">Something went wrong</h1>
        <button onClick={() => { router.invalidate(); reset(); }} className="mt-6 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Try again</button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Tradewise — Trade Smart. Grow Everywhere." },
      { name: "description", content: "Tradewise: your trusted e-commerce marketplace for quality products and great deals." },
      { property: "og:title", content: "Tradewise — Trade Smart. Grow Everywhere." },
      { name: "twitter:title", content: "Tradewise — Trade Smart. Grow Everywhere." },
      { property: "og:description", content: "Tradewise: your trusted e-commerce marketplace for quality products and great deals." },
      { name: "twitter:description", content: "Tradewise: your trusted e-commerce marketplace for quality products and great deals." },
      { property: "og:image", content: "https://tradewise.rw/og-image.png" },
      { name: "twitter:image", content: "https://tradewise.rw/og-image.png" },
      { property: "og:url", content: "https://tradewise.rw" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head><HeadContent /></head>
      <body>{children}<Scripts /></body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const isAdmin = path.startsWith("/admin");
  return (
    <QueryClientProvider client={queryClient}>
      <AdminProvider>
        <CartProvider>
          {isAdmin ? (
            <Outlet />
          ) : (
            <div className="flex min-h-screen flex-col">
              <Header />
              <main className="flex-1"><Outlet /></main>
              <Footer />
            </div>
          )}
          <Toaster />
        </CartProvider>
      </AdminProvider>
    </QueryClientProvider>
  );
}
