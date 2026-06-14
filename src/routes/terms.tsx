import { createFileRoute } from "@tanstack/react-router";
import { FileText } from "lucide-react";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms & Conditions — Tradewise" },
      { name: "description", content: "Read the Tradewise terms and conditions governing the use of our marketplace." },
    ],
  }),
  component: Terms,
});

const sections = [
  { t: "1. Acceptance of terms", d: "By accessing or using Tradewise, you agree to be bound by these terms. If you do not agree, please do not use the platform." },
  { t: "2. Accounts", d: "You are responsible for maintaining the confidentiality of your account credentials and for all activity that happens under your account." },
  { t: "3. Orders & payments", d: "All orders are subject to availability and confirmation. Prices are listed in USD unless otherwise specified. Payment is processed at checkout." },
  { t: "4. Shipping & returns", d: "Delivery times are estimates. You may return eligible items within 14 days of receipt in original condition. Some categories (e.g. installed parts) are non-returnable." },
  { t: "5. Product compatibility", d: "Our compatibility engine is provided as a guide. Always verify part fitment with a qualified technician before installation." },
  { t: "6. Intellectual property", d: "All content, logos and trademarks on Tradewise are the property of Tradewise or its licensors and may not be used without written permission." },
  { t: "7. Limitation of liability", d: "Tradewise is not liable for any indirect, incidental or consequential damages arising out of your use of the platform." },
  { t: "8. Changes to these terms", d: "We may update these terms from time to time. Continued use of the platform after changes constitutes acceptance of the new terms." },
  { t: "9. Contact", d: "Questions about these terms? Reach us through the Contact page." },
];

function Terms() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center"><FileText className="h-6 w-6 text-primary" /></div>
        <div>
          <h1 className="text-3xl md:text-4xl font-bold">Terms & Conditions</h1>
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
