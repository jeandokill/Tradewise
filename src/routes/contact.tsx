import { createFileRoute } from "@tanstack/react-router";
import { Mail, Phone, MapPin, Send, MessageCircle, Clock } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/contact")({
  head: () => ({ meta: [{ title: "Contact us — Tradewise" }] }),
  component: Contact,
});

const faqs = [
  { q: "How fast is shipping?", a: "Most orders ship within 24 hours and arrive in 2–5 business days." },
  { q: "Do you offer returns?", a: "Yes — 30-day returns on all spare parts in original packaging." },
  { q: "Can I pay with mobile money?", a: "Yes, we accept Visa, Mastercard and MTN Mobile Money at checkout." },
  { q: "Are the parts compatible with my EV?", a: "Use our compatibility filter on each vehicle page — it only shows parts that fit." },
];

function Contact() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const fd = new FormData(form);
    const name = String(fd.get("name") ?? "");
    const email = String(fd.get("email") ?? "");
    const subject = String(fd.get("subject") ?? "Website enquiry");
    const message = String(fd.get("message") ?? "");
    const body = `From: ${name} <${email}>%0D%0A%0D%0A${encodeURIComponent(message)}`;
    window.location.href = `mailto:contact@tradewise.rw?subject=${encodeURIComponent(subject)}&body=${body}`;
    toast.success("Opening your email app to send the message…");
  };

  return (
    <div className="container mx-auto px-4 py-14">
      <div className="text-center max-w-2xl mx-auto mb-12 animate-fade-up">
        <h1 className="text-4xl md:text-5xl font-bold">Get in touch</h1>
        <p className="text-muted-foreground mt-3">Questions about vehicles, parts, or your order? We'd love to hear from you.</p>
      </div>

      <div className="grid lg:grid-cols-4 gap-5 mb-12">
        {[
          { Icon: Mail, t: "Email", d: "support@tradewise.rw" },
          { Icon: Phone, t: "Phone", d: "+250 786 989 552" },
          { Icon: MapPin, t: "Address", d: "KG 7 Ave, Kigali, Rwanda" },
          { Icon: Clock, t: "Hours", d: "Mon–Sat • 8am – 7pm" },
        ].map(({ Icon, t, d }) => (
          <div key={t} className="p-6 rounded-xl bg-card shadow-card text-center">
            <div className="h-12 w-12 mx-auto rounded-full bg-gradient-brand text-white flex items-center justify-center mb-3"><Icon className="h-5 w-5" /></div>
            <h3 className="font-semibold">{t}</h3>
            <p className="text-sm text-muted-foreground mt-1">{d}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <form onSubmit={onSubmit} className="bg-card rounded-2xl shadow-card p-6 md:p-8 space-y-4">
          <h2 className="text-2xl font-bold flex items-center gap-2"><MessageCircle className="h-5 w-5 text-primary" /> Send a message</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <input name="name" required placeholder="Your name" className="px-4 py-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            <input name="email" required type="email" placeholder="Email address" className="px-4 py-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <input name="subject" placeholder="Subject" className="w-full px-4 py-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          <textarea name="message" required rows={5} placeholder="Your message..." className="w-full px-4 py-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
          <button type="submit" className="inline-flex items-center gap-2 px-6 py-3 rounded-md bg-gradient-brand text-white font-semibold hover:opacity-90">
            <Send className="h-4 w-4" /> Send message
          </button>
        </form>

        <div>
          <h2 className="text-2xl font-bold mb-4">Frequently asked</h2>
          <div className="space-y-3">
            {faqs.map((f, i) => (
              <div key={i} className="rounded-xl bg-card shadow-card overflow-hidden">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full px-5 py-4 flex items-center justify-between text-left font-medium hover:bg-secondary/40">
                  {f.q}
                  <span className="text-primary text-xl">{openFaq === i ? "−" : "+"}</span>
                </button>
                {openFaq === i && <div className="px-5 pb-4 text-sm text-muted-foreground">{f.a}</div>}
              </div>
            ))}
          </div>
        </div>
      </div>

      <section className="mt-14 rounded-2xl overflow-hidden bg-card shadow-card">
        <iframe
          title="Tradewise location"
          src="https://www.openstreetmap.org/export/embed.html?bbox=30.04%2C-1.96%2C30.10%2C-1.92&layer=mapnik"
          className="w-full h-72 border-0"
          loading="lazy"
        />
      </section>
    </div>
  );
}
