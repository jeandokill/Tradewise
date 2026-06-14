import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Smartphone, Lock, MapPin, ChevronRight, Upload, Copy, Send, Building2 } from "lucide-react";
import { useCart } from "@/lib/cart";
import { useAdmin } from "@/lib/admin";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatRWF } from "@/lib/currency";

export const Route = createFileRoute("/checkout")({
  head: () => ({ meta: [{ title: "Checkout — Tradewise" }] }),
  component: CheckoutPage,
});

type Step = 1 | 2 | 3;
type Method = "momo" | "airtel" | "card";

const WHATSAPP_NUMBER = "250786989552"; // E.164 without +
const MOMO_NUMBER = "0786989552";
const AIRTEL_NUMBER = "0786989552";
const BANK_NAME = "Equity Bank";
const BANK_ACCOUNT = "4005101042963";
const BANK_HOLDER = "JEANDAMOUR BYIRINGIRO";

const METHOD_LABEL: Record<Method, string> = {
  momo: "MTN Mobile Money",
  airtel: "Airtel Money",
  card: "Equity Bank transfer",
};

function CheckoutPage() {
  const { items, total, clear } = useCart();
  const { user, loading } = useAdmin();
  const nav = useNavigate();
  const [step, setStep] = useState<Step>(1);
  const [method, setMethod] = useState<Method>("momo");
  const [placed, setPlaced] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // address
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [stateP, setStateP] = useState("");
  const [postal, setPostal] = useState("");
  const [country, setCountry] = useState("Rwanda");

  // payment proof
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loading && !user && !placed) {
      toast.error("Please log in to place an order");
      nav({ to: "/login" });
    }
  }, [user, loading, placed, nav]);

  if (items.length === 0 && !placed) {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <h1 className="text-2xl font-bold">Your cart is empty</h1>
        <Link to="/categories" className="mt-6 inline-flex px-6 py-3 rounded-md bg-primary text-primary-foreground font-semibold">Shop now</Link>
      </div>
    );
  }

  if (placed) {
    return (
      <div className="container mx-auto px-4 py-20 max-w-xl text-center animate-fade-up">
        <div className="mx-auto h-20 w-20 rounded-full bg-amber-100 flex items-center justify-center mb-5">
          <CheckCircle2 className="h-12 w-12 text-amber-600" />
        </div>
        <h1 className="text-3xl font-bold">Order received</h1>
        <p className="text-muted-foreground mt-2">
          Order #{orderId?.slice(0, 8)} placed. <strong>Payment approval is pending</strong> — our team will verify your proof of payment within a few minutes and update your dashboard.
        </p>
        <div className="mt-4 p-4 bg-card rounded-xl shadow-card text-left text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Total</span><strong>{formatRWF(total)}</strong></div>
          <div className="flex justify-between mt-1"><span className="text-muted-foreground">Payment method</span><strong>{METHOD_LABEL[method]}</strong></div>
        </div>
        <div className="mt-6 flex gap-3 justify-center">
          <Link to="/dashboard" className="px-5 py-2.5 rounded-md bg-primary text-primary-foreground font-semibold">Go to dashboard</Link>
          <Link to="/categories" className="px-5 py-2.5 rounded-md border border-input">Continue shopping</Link>
        </div>
      </div>
    );
  }

  const onPickFile = (f: File | null) => {
    if (!f) { setProofFile(null); setProofPreview(null); return; }
    if (!f.type.startsWith("image/")) { toast.error("Please upload an image file"); return; }
    if (f.size > 8 * 1024 * 1024) { toast.error("Image must be smaller than 8MB"); return; }
    setProofFile(f);
    const r = new FileReader();
    r.onload = () => setProofPreview(String(r.result));
    r.readAsDataURL(f);
  };

  const copy = (txt: string, label: string) => {
    navigator.clipboard.writeText(txt).then(() => toast.success(`${label} copied`));
  };

  const placeOrder = async () => {
    if (!user) { nav({ to: "/login" }); return; }
    if (!proofFile) { toast.error("Please upload your payment proof"); return; }
    setSubmitting(true);

    // 1. upload proof
    const ext = proofFile.name.split(".").pop() || "jpg";
    const path = `payment-proofs/${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error: upErr } = await supabase.storage.from("product-images").upload(path, proofFile, {
      cacheControl: "3600", upsert: false,
    });
    if (upErr) { setSubmitting(false); toast.error("Could not upload proof: " + upErr.message); return; }
    const { data: pub } = supabase.storage.from("product-images").getPublicUrl(path);
    const proofUrl = pub.publicUrl;

    // 2. insert order with awaiting_payment_review status
    const { data: order, error } = await supabase.from("orders").insert({
      user_id: user.id,
      customer_name: fullName || (user.user_metadata?.full_name as string | undefined) || user.email,
      customer_email: user.email,
      total,
      status: "awaiting_payment_review" as never,
      items_count: items.reduce((s, i) => s + i.qty, 0),
      payment_method: method,
      payment_proof_url: proofUrl,
      payer_name: fullName,
      payer_phone: phone,
      shipping_address: { street, city, state: stateP, postal, country, phone },
    }).select("id").single();

    if (error || !order) {
      setSubmitting(false);
      toast.error(error?.message ?? "Could not place order");
      return;
    }

    const rows = items.map((i) => ({
      order_id: order.id,
      product_id: /^[0-9a-f-]{36}$/i.test(i.id) ? i.id : null,
      product_name: i.name,
      qty: i.qty,
      price: i.price,
    }));
    const { error: itemsErr } = await supabase.from("order_items").insert(rows);
    if (itemsErr) console.error(itemsErr);

    // 3. open WhatsApp with message + proof link
    const msg =
      `I am ${fullName || user.email}, I paid ${formatRWF(total)} using ${METHOD_LABEL[method]}, ` +
      `and here's my proof of payment: ${proofUrl}`;
    const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, "_blank", "noopener");

    setOrderId(order.id);
    toast.success("Order received — payment approval pending");
    clear();
    setPlaced(true);
    setSubmitting(false);
  };

  const steps = [
    { n: 1, label: "Address" },
    { n: 2, label: "Payment" },
    { n: 3, label: "Proof" },
  ] as const;

  return (
    <div className="container mx-auto px-4 py-10">
      <h1 className="text-3xl md:text-4xl font-bold mb-2">Checkout</h1>
      <p className="text-muted-foreground mb-8">Secure checkout — your order syncs to your dashboard.</p>

      <div className="flex items-center gap-2 mb-8 overflow-x-auto">
        {steps.map((s, i) => (
          <div key={s.n} className="flex items-center gap-2">
            <div className={`h-9 w-9 rounded-full flex items-center justify-center text-sm font-bold ${step >= s.n ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>{s.n}</div>
            <span className={`text-sm font-medium ${step >= s.n ? "text-foreground" : "text-muted-foreground"}`}>{s.label}</span>
            {i < steps.length - 1 && <ChevronRight className="h-4 w-4 text-muted-foreground mx-1" />}
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {step === 1 && (
            <form onSubmit={(e) => { e.preventDefault(); setStep(2); }} className="bg-card rounded-2xl shadow-card p-6 space-y-4 animate-fade-up">
              <h2 className="text-xl font-bold flex items-center gap-2"><MapPin className="h-5 w-5 text-primary" /> Shipping address</h2>
              <div className="grid sm:grid-cols-2 gap-3">
                <Input required placeholder="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                <Input required type="tel" placeholder="Phone number" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <Input required placeholder="Street address" value={street} onChange={(e) => setStreet(e.target.value)} />
              <div className="grid sm:grid-cols-3 gap-3">
                <Input required placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} />
                <Input required placeholder="State / Province" value={stateP} onChange={(e) => setStateP(e.target.value)} />
                <Input placeholder="Postal code" value={postal} onChange={(e) => setPostal(e.target.value)} />
              </div>
              <Input required placeholder="Country" value={country} onChange={(e) => setCountry(e.target.value)} />
              <button className="w-full py-3 rounded-md bg-primary text-primary-foreground font-semibold hover:opacity-90">Continue to payment</button>
            </form>
          )}

          {step === 2 && (
            <div className="bg-card rounded-2xl shadow-card p-6 space-y-4 animate-fade-up">
              <h2 className="text-xl font-bold">Choose a payment method</h2>
              <div className="grid sm:grid-cols-3 gap-3">
                <MethodCard active={method==="momo"} onClick={() => setMethod("momo")} title="MTN MoMo" sub="Mobile Money" badge="MoMo" badgeClass="bg-yellow-500 text-black" />
                <MethodCard active={method==="airtel"} onClick={() => setMethod("airtel")} title="Airtel Money" sub="Mobile Money" badge="Airtel" badgeClass="bg-red-600 text-white" />
                <MethodCard active={method==="card"} onClick={() => setMethod("card")} title="Bank transfer" sub="Equity Bank" badge="Bank" badgeClass="bg-blue-700 text-white" />
              </div>

              <div className="mt-4 rounded-xl border border-border bg-secondary/30 p-5 space-y-3">
                <p className="text-sm font-semibold inline-flex items-center gap-2">
                  {method === "card" ? <Building2 className="h-4 w-4 text-primary" /> : <Smartphone className="h-4 w-4 text-primary" />}
                  Send <span className="text-primary">{formatRWF(total)}</span> using {METHOD_LABEL[method]}
                </p>

                {method !== "card" && (
                  <PayRow label="Number" value={method === "momo" ? MOMO_NUMBER : AIRTEL_NUMBER} onCopy={copy} />
                )}
                {method === "card" && (
                  <>
                    <PayRow label="Bank" value={BANK_NAME} onCopy={copy} />
                    <PayRow label="Account number" value={BANK_ACCOUNT} onCopy={copy} />
                    <PayRow label="Account holder" value={BANK_HOLDER} onCopy={copy} />
                  </>
                )}
                <PayRow label="Amount" value={formatRWF(total)} onCopy={copy} />
                <p className="text-xs text-muted-foreground pt-1">
                  After paying, click <strong>Continue</strong> below and upload a screenshot of the confirmation.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => setStep(1)} className="px-5 py-3 rounded-md border border-input">Back</button>
                <button onClick={() => setStep(3)} className="flex-1 py-3 rounded-md bg-primary text-primary-foreground font-semibold hover:opacity-90">Continue — I have paid</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="bg-card rounded-2xl shadow-card p-6 space-y-4 animate-fade-up">
              <h2 className="text-xl font-bold">Upload your payment proof</h2>
              <p className="text-sm text-muted-foreground">
                Upload a clear screenshot of the {METHOD_LABEL[method]} confirmation. When you click <strong>Send</strong>, WhatsApp will open with a pre-filled message and a link to your proof — just hit send in WhatsApp.
              </p>

              <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
                onChange={(e) => onPickFile(e.target.files?.[0] ?? null)} />

              {!proofPreview ? (
                <button onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-border rounded-xl p-10 text-center hover:border-primary/60 transition">
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="font-medium">Click to upload screenshot</p>
                  <p className="text-xs text-muted-foreground mt-1">PNG or JPG, max 8MB</p>
                </button>
              ) : (
                <div className="space-y-3">
                  <img src={proofPreview} alt="Proof preview" className="w-full max-h-96 object-contain rounded-xl border border-border bg-secondary/30" />
                  <button onClick={() => fileInputRef.current?.click()} className="text-sm text-primary hover:underline">Replace image</button>
                </div>
              )}

              <div className="rounded-lg bg-secondary/40 p-3 text-xs space-y-1">
                <p><span className="text-muted-foreground">You will send to WhatsApp:</span> +{WHATSAPP_NUMBER}</p>
                <p className="text-foreground/80 italic">
                  "I am {fullName || "<your name>"}, I paid {formatRWF(total)} using {METHOD_LABEL[method]}, and here's my proof of payment: [link]"
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => setStep(2)} className="px-5 py-3 rounded-md border border-input" disabled={submitting}>Back</button>
                <button onClick={placeOrder} disabled={submitting || !proofFile}
                  className="flex-1 inline-flex items-center justify-center gap-2 py-3 rounded-md bg-gradient-brand text-white font-semibold hover:opacity-90 disabled:opacity-50">
                  <Send className="h-4 w-4" /> {submitting ? "Sending…" : "Send to WhatsApp & place order"}
                </button>
              </div>
              <p className="text-xs text-muted-foreground inline-flex items-center gap-1"><Lock className="h-3 w-3" /> Your order is saved as <strong>Payment approval pending</strong> until our team verifies.</p>
            </div>
          )}
        </div>

        <div className="bg-card rounded-2xl shadow-card p-6 h-fit sticky top-24">
          <h2 className="font-bold mb-4">Summary</h2>
          <div className="space-y-2 text-sm max-h-64 overflow-y-auto pb-2">
            {items.map((i) => (
              <div key={i.id} className="flex justify-between gap-2">
                <span className="text-muted-foreground truncate">{i.name} × {i.qty}</span>
                <span>{formatRWF(i.qty * i.price)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-border pt-3 mt-3 flex justify-between text-lg font-bold">
            <span>Total</span><span className="text-primary">{formatRWF(total)}</span>
          </div>
          <button onClick={() => nav({ to: "/cart" })} className="mt-4 w-full py-2 text-xs text-muted-foreground hover:text-primary">Edit cart</button>
        </div>
      </div>
    </div>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className="w-full px-4 py-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />;
}
function MethodCard({ active, onClick, title, sub, badge, badgeClass }: { active: boolean; onClick: () => void; title: string; sub: string; badge: string; badgeClass: string }) {
  return (
    <button type="button" onClick={onClick} className={`p-4 rounded-xl border-2 text-left transition-all ${active ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/50"}`}>
      <div className={`inline-block px-2 py-1 rounded text-xs font-extrabold tracking-wider ${badgeClass}`}>{badge}</div>
      <p className="font-semibold mt-2 text-sm">{title}</p>
      <p className="text-xs text-muted-foreground">{sub}</p>
    </button>
  );
}
function PayRow({ label, value, onCopy }: { label: string; value: string; onCopy: (v: string, l: string) => void }) {
  return (
    <div className="flex items-center justify-between gap-3 bg-background rounded-md px-3 py-2 border border-border">
      <div className="min-w-0">
        <p className="text-[10px] uppercase text-muted-foreground tracking-wider">{label}</p>
        <p className="font-mono font-semibold truncate">{value}</p>
      </div>
      <button onClick={() => onCopy(value, label)} className="shrink-0 inline-flex items-center gap-1 text-xs text-primary hover:underline">
        <Copy className="h-3 w-3" /> Copy
      </button>
    </div>
  );
}
