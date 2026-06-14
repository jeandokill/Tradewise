import { createFileRoute, Link, Outlet, useMatches } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/categories")({
  head: () => ({
    meta: [
      { title: "Categories — Tradewise" },
      { name: "description", content: "Browse all categories. Pick a category to see the products inside." },
    ],
  }),
  component: CategoriesLayout,
});

type Category = { id: string; name: string; slug: string; description: string | null; image_url: string | null };

function CategoriesLayout() {
  const matches = useMatches();
  const isChild = matches.some((m) => m.routeId === "/categories/$slug");
  const [cats, setCats] = useState<Category[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (isChild) return;
    (async () => {
      const { data } = await supabase
        .from("categories")
        .select("id,name,slug,description,image_url")
        .order("sort_order");
      setCats((data ?? []) as Category[]);
      setLoaded(true);
    })();
  }, [isChild]);

  if (isChild) return <Outlet />;

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center max-w-2xl mx-auto mb-12 animate-fade-up">
        <span className="inline-block px-3 py-1 rounded-full bg-accent/15 text-accent text-xs font-semibold uppercase tracking-wide">Shop</span>
        <h1 className="text-4xl md:text-5xl font-bold mt-3">Browse our categories</h1>
        <p className="text-muted-foreground mt-3">Pick a category to see the products inside.</p>
      </div>

      {loaded && cats.length === 0 ? (
        <p className="text-center text-muted-foreground">No categories yet.</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {cats.map((c) => (
            <Link
              key={c.id}
              to="/categories/$slug"
              params={{ slug: c.slug }}
              className="group rounded-xl overflow-hidden bg-card shadow-card hover:shadow-elegant transition-all hover:-translate-y-1"
            >
              <div className="aspect-[4/3] overflow-hidden bg-secondary/30">
                {c.image_url
                  ? <img src={c.image_url} alt={c.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                  : <div className="w-full h-full flex items-center justify-center text-5xl font-bold text-primary/30">{c.name.charAt(0)}</div>}
              </div>
              <div className="p-5">
                <h3 className="text-lg font-semibold group-hover:text-primary transition-colors">{c.name}</h3>
                {c.description && <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{c.description}</p>}
                <p className="text-xs text-primary mt-3 font-medium">View products →</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
