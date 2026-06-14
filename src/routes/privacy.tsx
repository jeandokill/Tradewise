import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Tradewise" },
      { name: "description", content: "Learn how Tradewise collects, uses, and protects your personal information." },
    ],
  }),
  component: Privacy,
});

const sections = [
  { t: "1. Information we collect", d: "We collect information you provide directly — such as your name, email, shipping address and payment details — as well as data automatically collected when you browse, such as device info and cookies." },
  { t: "2. How we use your information", d: "Your data is used to process orders, deliver products, provide customer support, improve the platform and send service updates. We never sell your personal information." },
  { t: "3. Cookies", d: "We use cookies to keep you signed in, remember your cart and analyze site usage. You can disable cookies in your browser, but some features may not work as expected." },
  { t: "4. Payments", d: "Payment details are processed by trusted third-party providers (e.g. card networks, MTN MoMo). Tradewise does not store your full payment credentials." },
  { t: "5. Data sharing", d: "We share data only with service providers needed to fulfill your orders (e.g. delivery partners) or when required by law." },
  { t: "6. Data retention", d: "We keep your account and order data only as long as needed to provide the service and comply with legal obligations." },
  { t: "7. Your rights", d: "You may request access, correction or deletion of your personal data at any time by contacting us via the Contact page." },
  { t: "8. Security", d: "We use industry-standard encryption and access controls to protect your data. No system is 100% secure, so we encourage strong unique passwords." },
  { t: "9. Changes to this policy", d: "We may update this policy from time to time. The latest version will always be posted on this page." },
];

function Privacy() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center"><ShieldCheck className="h-6 w-6 text-primary" /></div>
        <div>
          <h1 className="text-3xl md:text-4xl font-bold">Privacy Policy</h1>
          <p className="text-sm text-muted-foreground mt-1">Last updated: {new Date().toLocaleDateString()}</p>
        </div>
      </div>
      <div className="space-y-6 mt-8">
        {sections.map((s) => (
          <section key={s.t} className="p-5 rounded-xl bg-card shadow-card">
            <h2 className="font-bold text-lg">{s.t}</h2>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{s.d}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
