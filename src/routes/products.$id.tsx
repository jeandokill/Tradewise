import { formatRWF } from "@/lib/currency";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ShoppingCart, Check, Truck, ShieldCheck, RotateCcw, MessageCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/lib/cart";
import { toast } from "sonner";
import { contactSalesUrl } from "@/lib/contact-sales";

export const Route = createFileRoute("/products/$id")({
  component: ProductDetail,
});

type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  image_url: string | null;
  is_vehicle: boolean;
  category_id: string | null;
  compatible_with: string[] | null;
  hide_price: boolean;
};
type Category = { id: string; name: string; slug: string };

function ProductDetail() {
  const { id } = Route.useParams();
  const { add } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [qty, setQty] = useState(1);

  useEffect(() => {
    (async () => {
      const { data: p } = await supabase
        .from("products")
        .select("id,name,description,price,stock,image_url,is_vehicle,category_id,compatible_with,hide_price")
        .eq("id", id)
        .maybeSingle();
      const prod = p as Product | null;
      setProduct(prod);

      if (prod?.category_id) {
        const { data: c } = await supabase
          .from("categories")
          .select("id,name,slug")
          .eq("id", prod.category_id)
          .maybeSingle();
        setCategory(c as Category | null);
      }

      if (prod) {
        if (prod.is_vehicle) {
          // Reverse lookup: parts where compatible_with contains this vehicle id
          const { data: parts } = await supabase
            .from("products")
            .select("id,name,description,price,stock,image_url,is_vehicle,category_id,compatible_with,hide_price")
            .eq("is_vehicle", false)
            .contains("compatible_with", [prod.id]);
          setRelated((parts ?? []) as Product[]);
        } else if (prod.compatible_with?.length) {
          const { data: cars } = await supabase
            .from("products")
            .select("id,name,description,price,stock,image_url,is_vehicle,category_id,compatible_with,hide_price")
            .in("id", prod.compatible_with);
          setRelated((cars ?? []) as Product[]);
        }
      }

      setLoaded(true);
    })();
  }, [id]);

  if (!loaded) return null;
  if (!product) return (
    <div className="container mx-auto px-4 py-20 text-center">
      <h1 className="text-2xl font-bold">Product not found</h1>
      <Link to="/categories" className="text-primary mt-4 inline-block">← Back to categories</Link>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-10">
      <Link
        to={category ? "/categories/$slug" : "/categories"}
        params={category ? { slug: category.slug } : undefined as never}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6"
      >
        <ArrowLeft className="h-4 w-4" /> {category ? `Back to ${category.name}` : "Back to categories"}
      </Link>

      <div className="grid lg:grid-cols-2 gap-10">
        <div className="rounded-2xl bg-card shadow-card p-6 animate-fade-up">
          <div className="aspect-square bg-secondary/40 rounded-xl flex items-center justify-center overflow-hidden">
            {product.image_url && <img src={product.image_url} alt={product.name} className="w-full h-full object-contain p-6" />}
          </div>
        </div>

        <div className="animate-fade-up">
          {product.is_vehicle && <span className="inline-block px-3 py-1 rounded-full bg-accent text-accent-foreground text-xs font-semibold uppercase">Vehicle</span>}
          <h1 className="text-3xl md:text-4xl font-bold mt-3">{product.name}</h1>
          {product.hide_price ? (
            <p className="text-lg text-muted-foreground mt-3">Price on request</p>
          ) : (
            <p className="text-3xl font-bold text-primary mt-3">{formatRWF(product.price)}</p>
          )}
          {product.stock > 0 && <p className="text-sm text-green-700 mt-1 inline-flex items-center gap-1"><Check className="h-4 w-4" /> In stock</p>}

          <div className="mt-6 p-5 rounded-xl bg-card shadow-card">
            <h3 className="font-semibold mb-2">Description</h3>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{product.description || "No description yet."}</p>
          </div>

          {product.hide_price ? (
            <a
              href={contactSalesUrl(product.name)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 w-full inline-flex items-center justify-center gap-2 h-12 rounded-md bg-primary text-primary-foreground font-semibold hover:opacity-90"
            >
              <MessageCircle className="h-4 w-4" /> Are you interested? Contact sales team
            </a>
          ) : (
            <div className="mt-6 flex items-center gap-3">
              <div className="inline-flex items-center border border-border rounded-md bg-card">
                <button onClick={() => setQty(Math.max(1, qty - 1))} className="h-11 w-11 hover:bg-secondary">−</button>
                <span className="w-12 text-center font-medium">{qty}</span>
                <button onClick={() => setQty(qty + 1)} className="h-11 w-11 hover:bg-secondary">+</button>
              </div>
              <button
                onClick={() => { add({ id: product.id, name: product.name, price: Number(product.price), image: product.image_url || "" }, qty); toast.success("Added to cart"); }}
                className="flex-1 inline-flex items-center justify-center gap-2 h-11 rounded-md bg-primary text-primary-foreground font-semibold hover:opacity-90"
              >
                <ShoppingCart className="h-4 w-4" /> Add to cart
              </button>
            </div>
          )}

          <div className="mt-6 grid grid-cols-3 gap-3 text-xs">
            {[{Icon:Truck,t:"Fast shipping"},{Icon:ShieldCheck,t:"Quality guaranteed"},{Icon:RotateCcw,t:"30-day returns"}].map(({Icon,t})=>(
              <div key={t} className="p-3 rounded-lg bg-card shadow-card text-center">
                <Icon className="h-5 w-5 mx-auto text-primary mb-1" />
                <p className="font-medium">{t}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="text-2xl font-bold mb-2">{product.is_vehicle ? "Compatible spare parts" : "Compatible with"}</h2>
          <p className="text-sm text-muted-foreground mb-5">
            {product.is_vehicle ? "Spare parts that fit this vehicle." : "This part is compatible with these vehicles."}
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {related.map((r) => (
              <Link key={r.id} to="/products/$id" params={{ id: r.id }} className="group rounded-xl bg-card shadow-card overflow-hidden hover:shadow-elegant transition-all flex flex-col">
                <div className="aspect-square bg-secondary/30 overflow-hidden">
                  {r.image_url && <img src={r.image_url} alt={r.name} className="w-full h-full object-contain p-3 group-hover:scale-105 transition-transform duration-500" />}
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <h3 className="font-semibold text-sm group-hover:text-primary line-clamp-2">{r.name}</h3>
                  {r.hide_price ? (
                    <span className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-primary"><MessageCircle className="h-3.5 w-3.5" />Contact sales</span>
                  ) : (
                    <span className="font-bold text-primary mt-2">{formatRWF(r.price)}</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
