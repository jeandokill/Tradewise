import { formatRWF } from "@/lib/currency";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { StatusBadge } from "./admin.index";
import { toast } from "sonner";
import { ChevronDown, ChevronRight, MapPin, Phone, Mail, User as UserIcon, Package, CreditCard, Check, X } from "lucide-react";

export const Route = createFileRoute("/admin/orders")({
  component: OrdersAdmin,
});

type OrderStatus = "pending" | "awaiting_payment_review" | "paid" | "shipped" | "delivered" | "cancelled" | "refunded" | "payment_declined";
type ShippingAddress = {
  street?: string; city?: string; state?: string; postal?: string; country?: string; phone?: string;
};
type Order = {
  id: string;
  user_id: string | null;
  customer_name: string | null;
  customer_email: string | null;
  total: number;
  status: OrderStatus;
  items_count: number;
  created_at: string;
  payment_method: string | null;
  payment_proof_url: string | null;
  payer_name: string | null;
  payer_phone: string | null;
  shipping_address: ShippingAddress | null;
};
type OrderItem = { id: string; product_name: string; qty: number; price: number };

const statuses: ("all" | OrderStatus)[] = ["all", "awaiting_payment_review", "pending", "paid", "shipped", "delivered", "cancelled", "refunded", "payment_declined"];

function OrdersAdmin() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [filter, setFilter] = useState<typeof statuses[number]>("all");
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [itemsById, setItemsById] = useState<Record<string, OrderItem[]>>({});

  const load = async () => {
    const { data } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
    setOrders((data ?? []) as Order[]);
  };
  useEffect(() => { load(); }, []);

  const loadItems = async (orderId: string) => {
    if (itemsById[orderId]) return;
    const { data } = await supabase.from("order_items").select("id,product_name,qty,price").eq("order_id", orderId);
    setItemsById((prev) => ({ ...prev, [orderId]: (data ?? []) as OrderItem[] }));
  };

  const toggle = (id: string) => {
    setExpanded((cur) => (cur === id ? null : id));
    loadItems(id);
  };

  const list = orders ?? [];

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: list.length };
    list.forEach((o) => { c[o.status] = (c[o.status] ?? 0) + 1; });
    return c;
  }, [list]);

  const filtered = list.filter((o) =>
    (filter === "all" || o.status === filter) &&
    (o.id.toLowerCase().includes(query.toLowerCase()) ||
      (o.customer_name ?? "").toLowerCase().includes(query.toLowerCase()) ||
      (o.customer_email ?? "").toLowerCase().includes(query.toLowerCase()))
  );

  const changeStatus = async (id: string, status: OrderStatus) => {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    setOrders((o) => (o ?? []).map((x) => (x.id === id ? { ...x, status } : x)));
    toast.success(`Marked ${status}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl md:text-2xl font-bold">Orders</h2>
        <p className="text-sm text-muted-foreground">{list.length} orders</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {statuses.map((s) => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition-colors ${filter === s ? "bg-primary text-primary-foreground" : "bg-card border border-border hover:bg-secondary"}`}>
            {s} <span className="opacity-70">({counts[s] ?? 0})</span>
          </button>
        ))}
      </div>

      <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by order ID, customer, or email…"
        className="w-full max-w-md px-3 py-2 rounded-md border border-input bg-background text-sm" />

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-xs uppercase">
              <tr>
                <th className="w-8"></th>
                <th className="text-left p-3">Order</th>
                <th className="text-left p-3 hidden sm:table-cell">Customer</th>
                <th className="text-left p-3 hidden md:table-cell">Date</th>
                <th className="text-right p-3">Total</th>
                <th className="text-center p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => {
                const open = expanded === o.id;
                const addr = o.shipping_address ?? {};
                return (
                  <>
                    <tr key={o.id} onClick={() => toggle(o.id)} className="border-t border-border hover:bg-secondary/30 cursor-pointer">
                      <td className="p-3 text-muted-foreground">{open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}</td>
                      <td className="p-3">
                        <p className="font-semibold">#{o.id.slice(0, 8)}</p>
                        <p className="text-xs text-muted-foreground">{o.items_count} item{o.items_count > 1 ? "s" : ""}</p>
                      </td>
                      <td className="p-3 hidden sm:table-cell">
                        <p className="font-medium">{o.customer_name ?? "—"}</p>
                        <p className="text-xs text-muted-foreground">{o.customer_email}</p>
                      </td>
                      <td className="p-3 hidden md:table-cell text-xs text-muted-foreground">{new Date(o.created_at).toLocaleDateString()}</td>
                      <td className="p-3 text-right font-semibold">{formatRWF(o.total)}</td>
                      <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <select value={o.status} onChange={(e) => changeStatus(o.id, e.target.value as OrderStatus)}
                          className="text-xs px-2 py-1 rounded border border-input bg-background">
                          {statuses.filter((s) => s !== "all").map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <div className="mt-1"><StatusBadge status={o.status} /></div>
                      </td>
                    </tr>
                    {open && (
                      <tr key={`${o.id}-details`} className="border-t border-border bg-secondary/20">
                        <td colSpan={6} className="p-5">
                          <div className="grid md:grid-cols-2 gap-6">
                            <div>
                              <h4 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3 flex items-center gap-2"><UserIcon className="h-3.5 w-3.5" /> Customer</h4>
                              <div className="space-y-2 text-sm">
                                <p className="font-medium">{o.customer_name ?? "—"}</p>
                                <p className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-muted-foreground" /> <a href={`mailto:${o.customer_email}`} className="text-primary hover:underline">{o.customer_email ?? "—"}</a></p>
                                {addr.phone && (
                                  <p className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-muted-foreground" /> <a href={`tel:${addr.phone}`} className="text-primary hover:underline">{addr.phone}</a></p>
                                )}
                                <p className="text-xs text-muted-foreground pt-1">Paid via <span className="uppercase font-semibold">{o.payment_method ?? "—"}</span></p>
                                <p className="text-xs text-muted-foreground">Placed {new Date(o.created_at).toLocaleString()}</p>
                              </div>
                            </div>
                            <div>
                              <h4 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3 flex items-center gap-2"><MapPin className="h-3.5 w-3.5" /> Shipping address</h4>
                              {addr.street || addr.city ? (
                                <address className="not-italic text-sm leading-relaxed">
                                  {addr.street && <>{addr.street}<br /></>}
                                  {[addr.city, addr.state, addr.postal].filter(Boolean).join(", ")}<br />
                                  {addr.country}
                                </address>
                              ) : (
                                <p className="text-sm text-muted-foreground">No shipping address on file.</p>
                              )}
                            </div>
                            <div className="md:col-span-2">
                              <h4 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3 flex items-center gap-2"><CreditCard className="h-3.5 w-3.5" /> Payment proof</h4>
                              {o.payment_proof_url ? (
                                <div className="space-y-3">
                                  <a href={o.payment_proof_url} target="_blank" rel="noreferrer" className="inline-block">
                                    <img src={o.payment_proof_url} alt="Payment proof" className="max-h-72 rounded-lg border border-border bg-secondary/30" />
                                  </a>
                                  <a href={o.payment_proof_url} target="_blank" rel="noreferrer" className="block text-xs text-primary hover:underline break-all">{o.payment_proof_url}</a>
                                  {o.status === "awaiting_payment_review" && (
                                    <div className="flex flex-wrap gap-2 pt-1">
                                      <button onClick={() => changeStatus(o.id, "paid")}
                                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700">
                                        <Check className="h-4 w-4" /> Approve payment
                                      </button>
                                      <button onClick={() => changeStatus(o.id, "payment_declined")}
                                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-destructive text-destructive-foreground text-sm font-semibold hover:opacity-90">
                                        <X className="h-4 w-4" /> Decline
                                      </button>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <p className="text-xs text-muted-foreground">No proof uploaded.</p>
                              )}
                            </div>
                            <div className="md:col-span-2">
                              <h4 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3 flex items-center gap-2"><Package className="h-3.5 w-3.5" /> Items</h4>
                              {!itemsById[o.id] ? (
                                <p className="text-xs text-muted-foreground">Loading…</p>
                              ) : itemsById[o.id].length === 0 ? (
                                <p className="text-xs text-muted-foreground">No items recorded.</p>
                              ) : (
                                <table className="w-full text-sm">
                                  <thead className="text-xs uppercase text-muted-foreground">
                                    <tr><th className="text-left py-1">Product</th><th className="text-right py-1">Qty</th><th className="text-right py-1">Price</th><th className="text-right py-1">Subtotal</th></tr>
                                  </thead>
                                  <tbody>
                                    {itemsById[o.id].map((it) => (
                                      <tr key={it.id} className="border-t border-border">
                                        <td className="py-2">{it.product_name}</td>
                                        <td className="py-2 text-right">{it.qty}</td>
                                        <td className="py-2 text-right">{formatRWF(it.price)}</td>
                                        <td className="py-2 text-right font-semibold">{formatRWF(Number(it.price) * it.qty)}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
              {orders !== null && filtered.length === 0 && (
                <tr><td colSpan={6} className="p-8 text-center text-sm text-muted-foreground">No orders found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
