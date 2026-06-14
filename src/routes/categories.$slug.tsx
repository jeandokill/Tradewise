import { formatRWF } from "@/lib/currency";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, ShoppingCart, Check, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/lib/cart";
import { toast } from "sonner";
import { contactSalesUrl } from "@/lib/contact-sales";

export const Route = createFileRoute("/categories/$slug")({
  component: CategoryProducts,
});

type Category = { id: string; name: string; slug: string; description: string | null; image_url: string | null };
type Product = { id: string; name: string; description: string | null; price: number; image_url: string | null; is_vehicle: boolean; is_new: boolean; hide_price: boolean };

function CategoryProducts() {
  const { slug } = Route.useParams();
  const { add } = useCart();
  const [cat, setCat] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: c } = await supabase
        .from("categories")
        .select("id,name,slug,description,image_url")
        .eq("slug", slug)
        .maybeSingle();
      setCat(c as Category | null);
      if (c) {
        const { data: p } = await supabase
          .from("products")
          .select("id,name,description,price,image_url,is_vehicle,is_new,hide_price")
          .eq("category_id", (c as Category).id)
          .order("created_at", { ascending: false });
        setProducts((p ?? []) as Product[]);
      }
      setLoaded(true);
    })();
  }, [slug]);

  if (!loaded) return null;
  if (!cat) return (
    <div className="container mx-auto px-4 py-20 text-center">
      <h1 className="text-2xl font-bold">Category not found</h1>
      <Link to="/categories" className="text-primary mt-4 inline-block">← Back to categories</Link>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-10">
      <Link to="/categories" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6">
        <ArrowLeft className="h-4 w-4" /> All categories
      </Link>

      <div className="mb-8 animate-fade-up">
        <h1 className="text-3xl md:text-4xl font-bold">{cat.name}</h1>
        {cat.description && <p className="text-muted-foreground mt-2 max-w-2xl">{cat.description}</p>}
        <p className="text-sm text-muted-foreground mt-2">{products.length} product{products.length === 1 ? "" : "s"}</p>
      </div>

      {products.length === 0 ? (
        <p className="text-muted-foreground">No products in this category yet.</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {products.map((p) => (
            <div key={p.id} className="rounded-xl bg-card shadow-card overflow-hidden hover:shadow-elegant transition-all flex flex-col">
              <Link to="/products/$id" params={{ id: p.id }} className="aspect-square bg-secondary/30 overflow-hidden block relative">
                {p.is_new && <span className="absolute top-3 left-3 z-10 px-2 py-1 rounded-md bg-accent text-accent-foreground text-[10px] font-bold uppercase">New</span>}
                {p.image_url && <img src={p.image_url} alt={p.name} className="w-full h-full object-contain p-3 hover:scale-105 transition-transform" loading="lazy" />}
              </Link>
              <div className="p-4 flex-1 flex flex-col">
                <Link to="/products/$id" params={{ id: p.id }} className="font-semibold text-sm leading-snug hover:text-primary">{p.name}</Link>
                <p className="text-xs text-muted-foreground mt-2 line-clamp-2 flex-1">{p.description}</p>
                <div className="mt-3 flex items-center justify-between gap-2">
                  {p.hide_price ? (
                    <a href={contactSalesUrl(p.name)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-3 py-2 rounded-md bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90">
                      <MessageCircle className="h-3.5 w-3.5" /> Contact sales
                    </a>
                  ) : (
                    <>
                      <span className="font-bold text-primary">{formatRWF(p.price)}</span>
                      {p.is_vehicle ? (
                        <Link to="/products/$id" params={{ id: p.id }} className="inline-flex items-center gap-1 px-3 py-2 rounded-md bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90">
                          View parts →
                        </Link>
                      ) : (
                        <button
                          onClick={() => { add({ id: p.id, name: p.name, price: Number(p.price), image: p.image_url || "" }); toast.success("Added", { icon: <Check className="h-4 w-4" /> }); }}
                          className="inline-flex items-center gap-1 px-3 py-2 rounded-md bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90"
                        >
                          <ShoppingCart className="h-3.5 w-3.5" /> Add
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
