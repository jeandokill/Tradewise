import { createFileRoute, Link } from "@tanstack/react-router";
import { Target, Eye, Heart, Users, Globe, Award, Leaf, Zap } from "lucide-react";
import hero from "@/assets/hero-suv.jpg";

export const Route = createFileRoute("/about")({
  head: () => ({ meta: [{ title: "About — Tradewise" }] }),
  component: About,
});

function About() {
  return (
    <div>
      <section className="relative h-80 overflow-hidden">
        <img src={hero} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-primary/40" />
        <div className="relative container mx-auto px-4 h-full flex flex-col justify-center text-white">
          <h1 className="text-4xl md:text-6xl font-bold animate-fade-up">About Tradewise</h1>
          <p className="text-white/85 mt-3 max-w-xl animate-fade-up text-lg">Trade smart. Grow everywhere.</p>
        </div>
      </section>

      <section className="container mx-auto px-4 py-14 max-w-3xl">
        <p className="text-lg text-muted-foreground leading-relaxed">
          Tradewise is a modern e-commerce marketplace currently focused on electric vehicles and their compatible auto spare parts. As we grow, we'll expand into a full multi-category platform — but for now we're laser-focused on giving EV drivers and mechanics one trusted destination for vehicles and the parts that keep them moving.
        </p>
        <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
          Founded with the belief that mobility should be clean, accessible and well-supported, Tradewise pairs a curated catalog with a smart compatibility engine — so the part you need is the part that actually fits.
        </p>
      </section>

      <section className="container mx-auto px-4 pb-10 grid md:grid-cols-3 gap-5">
        {[
          { Icon: Target, t: "Our Mission", d: "Empower smart traders with quality vehicles and verified parts at fair prices." },
          { Icon: Eye, t: "Our Vision", d: "Be the world's most trusted EV and parts marketplace, accessible to everyone." },
          { Icon: Heart, t: "Our Values", d: "Transparency, quality, sustainability and customer-first service in every order." },
        ].map(({ Icon, t, d }) => (
          <div key={t} className="p-6 rounded-xl bg-card shadow-card">
            <Icon className="h-8 w-8 text-accent mb-3" />
            <h3 className="font-bold text-lg">{t}</h3>
            <p className="text-sm text-muted-foreground mt-2">{d}</p>
          </div>
        ))}
      </section>

      <section className="container mx-auto px-4 py-14">
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-5">
          {[
            { Icon: Users, n: "10K+", l: "Happy customers" },
            { Icon: Globe, n: "20+", l: "Countries served" },
            { Icon: Award, n: "200+", l: "Verified workshops" },
            { Icon: Zap, n: "500+", l: "Parts in catalog" },
          ].map(({ Icon, n, l }) => (
            <div key={l} className="p-6 rounded-2xl bg-card shadow-card text-center">
              <Icon className="h-7 w-7 mx-auto text-primary mb-2" />
              <p className="text-3xl font-extrabold">{n}</p>
              <p className="text-sm text-muted-foreground mt-1">{l}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-gradient-soft py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-10">Our journey</h2>
          <div className="space-y-6">
            {[
              { y: "2026", t: "Founded", d: "Tradewise launches this year with a focused EV catalog and a big vision." },
              { y: "2026", t: "Parts marketplace", d: "Smart compatibility engine goes live — every part matched to the right car." },
              { y: "Next", t: "Going global", d: "Expanding into multiple African and European markets." },
            ].map((m) => (
              <div key={m.y} className="flex gap-5 p-5 rounded-xl bg-card shadow-card">
                <div className="shrink-0 w-20 text-2xl font-extrabold text-primary">{m.y}</div>
                <div>
                  <h3 className="font-bold">{m.t}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{m.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16 text-center max-w-2xl">
        <Leaf className="h-10 w-10 mx-auto text-green-600 mb-3" />
        <h2 className="text-2xl md:text-3xl font-bold">Built for a cleaner future</h2>
        <p className="text-muted-foreground mt-3">Every vehicle on Tradewise is electric — because we believe smart commerce should also be sustainable commerce.</p>
      </section>

      <section className="bg-gradient-hero text-white">
        <div className="container mx-auto px-4 py-14 text-center">
          <h2 className="text-3xl font-bold">Start exploring</h2>
          <Link to="/categories" className="mt-5 inline-flex px-6 py-3 rounded-md bg-white text-primary font-semibold hover:bg-white/90">Browse vehicles</Link>
        </div>
      </section>
    </div>
  );
}
