import { formatRWF } from "@/lib/currency";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Zap, ShieldCheck, Truck, Headphones, Sparkles, Star, Quote, Battery, MessageCircle } from "lucide-react";
import heroEv from "@/assets/hero-ev.jpg";
import { supabase } from "@/integrations/supabase/client";
import { contactSalesUrl } from "@/lib/contact-sales";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Tradewise — Quality Products & Great Deals in Rwanda" },
      { name: "description", content: "Shop quality vehicles, parts and accessories at great prices in Rwanda. Trade smart. Grow everywhere." },
      { property: "og:title", content: "Tradewise — Quality Products & Great Deals in Rwanda" },
      { property: "og:description", content: "Shop quality vehicles, parts and accessories at great prices in Rwanda." },
      { property: "og:url", content: "https://tradewise.rw/" },
      { property: "og:type", content: "website" },
    ],
    links: [
      { rel: "canonical", href: "https://tradewise.rw/" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "Tradewise",
          url: "https://tradewise.rw/",
          logo: "https://tradewise.rw/favicon.ico",
        }),
      },
    ],
  }),
  component: Home,
});

type Slide = { id: string; image_url: string; title: string; subtitle: string | null; cta_label: string | null; cta_link: string | null };
type Product = { id: string; name: string; slug: string; description: string | null; price: number; image_url: string | null; is_vehicle: boolean; is_featured: boolean; is_new: boolean; is_bestseller: boolean; hide_price: boolean };
type Category = { id: string; name: string; slug: string; description: string | null; image_url: string | null };

const brands = ["VOLTAIRE", "AURORA", "TITAN", "SPARK", "NOVA", "ECLIPSE", "HELIOS", "ORBIT"];

type Review = { id: string; name: string; company: string | null; body: string; rating: number };


function Home() {
  const [i, setI] = useState(0);

  const { data } = useQuery({
    queryKey: ["home-data"],
    queryFn: async () => {
      const [s, v, p, cats, rev] = await Promise.all([
        supabase.from("hero_slides").select("id,image_url,title,subtitle,cta_label,cta_link").eq("active", true).order("sort_order"),
        supabase.from("products").select("id,name,slug,description,price,image_url,is_vehicle,is_featured,is_new,is_bestseller,hide_price").eq("is_vehicle", true).order("created_at", { ascending: false }).limit(8),
        supabase.from("products").select("id,name,slug,description,price,image_url,is_vehicle,is_featured,is_new,is_bestseller,hide_price").eq("is_vehicle", false).order("created_at", { ascending: false }).limit(8),
        supabase.from("categories").select("id,name,slug,description,image_url").order("sort_order"),
        supabase.from("reviews").select("id,name,company,body,rating").eq("status", "approved").order("created_at", { ascending: false }).limit(9),
      ]);
      return {
        slides: (s.data ?? []) as Slide[],
        vehicles: (v.data ?? []) as Product[],
        parts: (p.data ?? []) as Product[],
        categories: (cats.data ?? []) as Category[],
        reviews: (rev.data ?? []) as Review[],
      };
    },
  });

  const slides = data?.slides ?? [];
  const vehicles = data?.vehicles ?? [];
  const parts = data?.parts ?? [];
  const categories = data?.categories ?? [];
  const reviews = data?.reviews ?? [];

  useEffect(() => {
    if (slides.length < 2) return;
    const t = setInterval(() => setI((prev) => (prev + 1) % slides.length), 5000);
    return () => clearInterval(t);
  }, [slides.length]);

  const current = slides[i];
  const newCars = vehicles.filter((v) => v.is_new);
  const bestSellers = [...vehicles, ...parts].filter((x) => x.is_bestseller).slice(0, 8);

  return (
    <div>
      {/* Hero carousel */}
      <section className="relative h-[58vh] min-h-[420px] sm:h-[70vh] sm:min-h-[480px] md:h-[88vh] md:min-h-[520px] overflow-hidden bg-secondary/40">
        {slides.map((s, idx) => (
          <div key={s.id} className="absolute inset-0 transition-opacity duration-1000" style={{ opacity: i === idx ? 1 : 0 }}>
            <img src={s.image_url} alt={s.title} className="w-full h-full object-cover object-center" loading={idx === 0 ? "eager" : "lazy"} fetchPriority={idx === 0 ? "high" : "auto"} />
            <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/45 to-black/10" />
          </div>
        ))}
        {current && (
          <div className="relative z-10 container mx-auto px-4 h-full flex flex-col justify-center max-w-3xl">
            <div key={i} className="animate-fade-up">
              <span className="inline-block px-3 py-1 rounded-full bg-accent/90 text-accent-foreground text-xs font-semibold tracking-wide uppercase mb-5">
                Tradewise Marketplace
              </span>
              <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold text-white leading-tight drop-shadow-lg">{current.title}</h1>
              {current.subtitle && <p className="mt-4 text-lg md:text-xl text-white/85 max-w-xl">{current.subtitle}</p>}
              <div className="mt-8 flex flex-wrap gap-3">
                <Link to={(current.cta_link as string) || "/categories"} className="inline-flex items-center gap-2 px-7 py-3.5 rounded-md bg-gradient-brand text-white font-semibold shadow-elegant hover:opacity-95 transition">
                  {current.cta_label || "Browse"} <ArrowRight className="h-4 w-4" />
                </Link>
                <Link to="/about" className="inline-flex items-center px-7 py-3.5 rounded-md border border-white/40 text-white hover:bg-white/10 transition">Learn more</Link>
              </div>
            </div>
          </div>
        )}
        {slides.length > 1 && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex gap-2">
            {slides.map((_, idx) => (
              <button key={idx} onClick={() => setI(idx)}
                className={`h-2 rounded-full transition-all ${i === idx ? "w-10 bg-accent" : "w-2 bg-white/60"}`}
                aria-label={`Slide ${idx + 1}`} />
            ))}
          </div>
        )}
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {[
            { Icon: Zap, t: "Wide Selection", d: "Curated product catalog" },
            { Icon: ShieldCheck, t: "Verified Quality", d: "Quality guaranteed" },
            { Icon: Truck, t: "Fast Delivery", d: "Ship nationwide" },
            { Icon: Headphones, t: "24/7 Support", d: "We're here to help" },
          ].map(({ Icon, t, d }) => (
            <div key={t} className="p-5 rounded-xl bg-card shadow-card text-center hover:-translate-y-1 transition-transform">
              <Icon className="h-8 w-8 text-primary mx-auto mb-3" />
              <h3 className="font-semibold">{t}</h3>
              <p className="text-xs text-muted-foreground mt-1">{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Browse by category */}
      {categories.length > 0 && (
        <section className="container mx-auto px-4 pb-16">
          <div className="flex items-end justify-between mb-8 flex-wrap gap-3">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-accent">Browse</span>
              <h2 className="text-3xl md:text-4xl font-bold">Categories</h2>
              <p className="text-muted-foreground mt-2">Explore everything we offer, by category.</p>
            </div>
            <Link to="/categories" className="hidden sm:inline-flex items-center gap-1 text-primary font-medium hover:gap-2 transition-all">View all <ArrowRight className="h-4 w-4" /></Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            {categories.map((cat) => (
              <Link key={cat.id} to="/categories/$slug" params={{ slug: cat.slug }} className="group rounded-xl overflow-hidden bg-card shadow-card hover:shadow-elegant transition-all hover:-translate-y-1">
                <div className="aspect-[4/3] overflow-hidden bg-secondary/30">
                  {cat.image_url
                    ? <img src={cat.image_url} alt={cat.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                    : <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-primary/40">{cat.name.charAt(0)}</div>}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold group-hover:text-primary transition-colors">{cat.name}</h3>
                  {cat.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{cat.description}</p>}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured products */}
      {vehicles.length > 0 && (
        <section className="container mx-auto px-4 pb-16">
          <div className="flex items-end justify-between mb-8">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-accent">Featured</span>
              <h2 className="text-3xl md:text-4xl font-bold">Products you'll love</h2>
              <p className="text-muted-foreground mt-2">Handpicked favorites from our catalog</p>
            </div>
            <Link to="/categories" className="hidden sm:inline-flex items-center gap-1 text-primary font-medium hover:gap-2 transition-all">View all <ArrowRight className="h-4 w-4" /></Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {vehicles.map((c) => (
              <Link key={c.id} to="/products/$id" params={{ id: c.id }}
                className="group rounded-xl overflow-hidden bg-card shadow-card hover:shadow-elegant transition-all">
                <div className="aspect-[4/3] overflow-hidden bg-secondary/30 relative">
                  {c.is_new && <span className="absolute top-3 left-3 z-10 px-2 py-1 rounded-md bg-accent text-accent-foreground text-[10px] font-bold uppercase">New</span>}
                  {c.image_url && <img src={c.image_url} alt={c.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold mt-1 group-hover:text-primary transition-colors">{c.name}</h3>
                  <div className="mt-2 flex items-center justify-between">
                    {c.hide_price ? (
                      <a href={contactSalesUrl(c.name)} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"><MessageCircle className="h-3.5 w-3.5" />Contact sales</a>
                    ) : (
                      <span className="font-bold text-primary">{formatRWF(c.price)}</span>
                    )}
                    <span className="text-xs text-muted-foreground inline-flex items-center gap-1"><Battery className="h-3 w-3" />In stock</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* New Stock */}
      {newCars.length > 0 && (
        <section className="bg-gradient-soft py-16">
          <div className="container mx-auto px-4">
            <div className="flex items-end justify-between mb-8 flex-wrap gap-3">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-accent inline-flex items-center gap-1"><Sparkles className="h-3 w-3" /> Just landed</span>
                <h2 className="text-3xl md:text-4xl font-bold">New stock this week</h2>
                <p className="text-muted-foreground mt-2">Fresh arrivals across all categories</p>
              </div>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {newCars.map((c) => (
                <Link key={c.id} to="/products/$id" params={{ id: c.id }} className="group rounded-2xl overflow-hidden bg-card shadow-card hover:shadow-elegant transition-all flex flex-col">
                  <div className="aspect-video overflow-hidden bg-secondary/30">
                    {c.image_url && <img src={c.image_url} alt={c.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />}
                  </div>
                  <div className="p-5 flex-1 flex flex-col">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-green-100 text-green-700 self-start">IN STOCK</span>
                    <h3 className="font-bold text-lg mt-2">{c.name}</h3>
                    {c.description && <p className="text-sm text-muted-foreground mt-2 line-clamp-2 flex-1">{c.description}</p>}
                    <div className="mt-3 flex items-center justify-between">
                      {c.hide_price ? (
                        <a href={contactSalesUrl(c.name)} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-1 text-base font-semibold text-primary hover:underline"><MessageCircle className="h-4 w-4" />Contact sales — are you interested?</a>
                      ) : (
                        <span className="font-bold text-primary text-lg">{formatRWF(c.price)}</span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Popular products */}
      {bestSellers.length > 0 && (
        <section className="container mx-auto px-4 py-16">
          <div className="flex items-end justify-between mb-8 flex-wrap gap-3">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-accent">Best sellers</span>
              <h2 className="text-3xl md:text-4xl font-bold">Popular products</h2>
            </div>
            <Link to="/categories" className="text-primary font-medium inline-flex items-center gap-1 hover:gap-2 transition-all">Browse all <ArrowRight className="h-4 w-4" /></Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {bestSellers.map((p) => (
              <Link key={p.id} to="/products/$id" params={{ id: p.id }} className="group rounded-xl bg-card shadow-card overflow-hidden hover:shadow-elegant transition-all">
                <div className="aspect-square bg-secondary/30 overflow-hidden">
                  {p.image_url && <img src={p.image_url} alt={p.name} className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-500" loading="lazy" />}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-sm mt-1 group-hover:text-primary line-clamp-1">{p.name}</h3>
                  {p.hide_price ? (
                    <a href={contactSalesUrl(p.name)} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"><MessageCircle className="h-3.5 w-3.5" />Contact sales</a>
                  ) : (
                    <p className="font-bold text-primary mt-2">{formatRWF(p.price)}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Promo */}
      <section className="container mx-auto px-4 pb-16">
        <div className="rounded-3xl bg-gradient-hero text-white p-8 md:p-14 grid md:grid-cols-2 gap-8 items-center overflow-hidden relative">
          <div className="relative z-10">
            <span className="inline-block px-3 py-1 rounded-full bg-white/15 text-xs font-bold uppercase tracking-wider">Limited time</span>
            <h3 className="text-3xl md:text-4xl font-extrabold mt-3">Save 10% on your first order</h3>
            <p className="text-white/85 mt-3">Use code <strong className="bg-white/20 px-2 py-0.5 rounded">TRADEWISE10</strong> at checkout.</p>
            <Link to="/categories" className="mt-5 inline-flex items-center gap-2 px-6 py-3 rounded-md bg-white text-primary font-semibold hover:bg-white/90">Shop now <ArrowRight className="h-4 w-4" /></Link>
          </div>
          <div className="relative hidden md:block">
            <img src={heroEv} alt="" className="rounded-2xl shadow-elegant w-full h-56 object-cover animate-float" />
          </div>
        </div>
      </section>

      {/* Brands */}
      <section className="border-y border-border bg-card/50 py-8 overflow-hidden">
        <p className="text-center text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">Trusted by 200+ workshops</p>
        <div className="overflow-hidden">
          <div className="flex gap-12 animate-marquee whitespace-nowrap">
            {[...brands, ...brands].map((b, idx) => (
              <span key={idx} className="text-2xl font-extrabold text-muted-foreground/70 tracking-wider">{b}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      {reviews.length > 0 && (
        <section className="container mx-auto px-4 py-16">
          <div className="text-center mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-accent">Reviews</span>
            <h2 className="text-3xl md:text-4xl font-bold">What our customers say</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {reviews.map((r) => (
              <div key={r.id} className="p-6 rounded-2xl bg-card shadow-card">
                <Quote className="h-6 w-6 text-accent mb-3" />
                <p className="text-sm text-muted-foreground leading-relaxed">"{r.body}"</p>
                <div className="flex items-center gap-1 mt-4 text-accent">
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <Star key={idx} className={`h-4 w-4 ${idx < r.rating ? "fill-current" : "opacity-30"}`} />
                  ))}
                </div>
                <div className="mt-3">
                  <p className="font-semibold text-sm">{r.name}</p>
                  {r.company && <p className="text-xs text-muted-foreground">{r.company}</p>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}



      {/* CTA */}
      <section className="bg-gradient-hero text-white">
        <div className="container mx-auto px-4 py-16 text-center">
          <h2 className="text-3xl md:text-4xl font-bold">Ready to shop smart?</h2>
          <p className="mt-3 text-white/85 max-w-xl mx-auto">Join thousands of smart traders who choose Tradewise for quality products and great deals.</p>
          <Link to="/login" className="mt-6 inline-flex px-7 py-3 rounded-md bg-white text-primary font-semibold hover:bg-white/90 transition">Create an account</Link>
        </div>
      </section>
    </div>
  );
}
