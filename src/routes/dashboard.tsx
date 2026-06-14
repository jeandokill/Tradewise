import { formatRWF } from "@/lib/currency";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ShoppingBag, Bell, User as UserIcon, Package, Clock, CheckCircle2, XCircle, Star, MessageSquare, Send } from "lucide-react";
import { toast } from "sonner";
import { useAdmin } from "@/lib/admin";
import { supabase } from "@/integrations/supabase/client";


export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "My Dashboard — Tradewise" }, { name: "robots", content: "noindex" }] }),
  component: UserDashboard,
});

type Order = {
  id: string;
  total: number;
  status: string;
  items_count: number;
  created_at: string;
};

type MyReview = {
  id: string;
  body: string;
  company: string | null;
  rating: number;
  status: "pending" | "approved" | "declined";
  created_at: string;
};

function UserDashboard() {
  const { user, isAdmin, loading, roleLoading, notifications, unreadCount, markAllRead } = useAdmin();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [myReviews, setMyReviews] = useState<MyReview[]>([]);
  const [reviewName, setReviewName] = useState("");
  const [reviewCompany, setReviewCompany] = useState("");
  const [reviewBody, setReviewBody] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (loading || roleLoading) return;
    if (!user) router.navigate({ to: "/login" });
    else if (isAdmin) router.navigate({ to: "/admin" });
  }, [user, isAdmin, loading, roleLoading, router]);

  const loadReviews = async (uid: string) => {
    const { data } = await supabase
      .from("reviews")
      .select("id,body,company,rating,status,created_at")
      .eq("user_id", uid)
      .order("created_at", { ascending: false });
    setMyReviews((data ?? []) as MyReview[]);
  };

  useEffect(() => {
    if (!user) return;
    supabase
      .from("orders")
      .select("id,total,status,items_count,created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => setOrders((data ?? []) as Order[]));
    loadReviews(user.id);
    setReviewName((user.user_metadata?.full_name as string | undefined) ?? "");
  }, [user]);

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!reviewName.trim() || !reviewBody.trim()) {
      toast.error("Please add your name and review");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("reviews").insert({
      user_id: user.id,
      name: reviewName.trim().slice(0, 100),
      company: reviewCompany.trim().slice(0, 100) || null,
      body: reviewBody.trim().slice(0, 1000),
      rating: reviewRating,
    });
    setSubmitting(false);
    if (error) return toast.error(error.message);
    toast.success("Review submitted! It will appear once approved.");
    setReviewBody("");
    setReviewCompany("");
    setReviewRating(5);
    loadReviews(user.id);
  };

  if (loading || !user) return null;

  const name = (user.user_metadata?.full_name as string | undefined) ?? user.email ?? "Account";
  const initial = name.charAt(0).toUpperCase();
  const list = orders ?? [];


  const stats = [
    { label: "Orders placed", value: list.length, icon: ShoppingBag, color: "text-primary" },
    { label: "Awaiting approval", value: list.filter((o) => o.status === "awaiting_payment_review").length, icon: Clock, color: "text-amber-600" },
    { label: "Approved", value: list.filter((o) => o.status === "paid").length, icon: CheckCircle2, color: "text-emerald-600" },
    { label: "Declined", value: list.filter((o) => o.status === "payment_declined" || o.status === "cancelled").length, icon: XCircle, color: "text-destructive" },
  ];

  return (
    <div className="min-h-screen bg-secondary/30">
      <main className="container mx-auto px-4 py-8 space-y-8">
        <section className="bg-card rounded-2xl border border-border p-6 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-gradient-brand text-white flex items-center justify-center text-2xl font-bold">{initial}</div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Welcome, {name}</h1>
            <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1"><UserIcon className="h-3.5 w-3.5" /> {user.email}</p>
          </div>
          <Link to="/categories" className="px-4 py-2 rounded-md bg-gradient-brand text-white text-sm font-semibold hover:opacity-90">Browse store</Link>
        </section>

        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s) => (
            <div key={s.label} className="bg-card rounded-xl border border-border p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">{s.label}</p>
                <s.icon className={`h-4 w-4 ${s.color}`} />
              </div>
              <p className="text-2xl font-bold">{s.value}</p>
            </div>
          ))}
        </section>

        <section className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="p-5 border-b border-border flex items-center justify-between">
            <h2 className="font-bold text-lg flex items-center gap-2"><Package className="h-5 w-5" /> My orders</h2>
          </div>
          {orders === null ? null : list.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-sm text-muted-foreground mb-3">You haven't placed any orders yet.</p>
              <Link to="/categories" className="text-sm font-semibold text-primary hover:underline">Start shopping →</Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-secondary/50 text-xs uppercase">
                  <tr>
                    <th className="text-left p-3">Order</th>
                    <th className="text-left p-3">Items</th>
                    <th className="text-left p-3">Total</th>
                    <th className="text-left p-3">Status</th>
                    <th className="text-left p-3 hidden sm:table-cell">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((o) => (
                    <tr key={o.id} className="border-t border-border">
                      <td className="p-3 font-mono text-xs">#{o.id.slice(0, 8)}</td>
                      <td className="p-3">{o.items_count}</td>
                      <td className="p-3 font-semibold">{formatRWF(o.total)}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-semibold uppercase whitespace-nowrap ${
                          o.status === "paid" ? "bg-emerald-100 text-emerald-700" :
                          o.status === "awaiting_payment_review" ? "bg-amber-100 text-amber-700" :
                          o.status === "payment_declined" ? "bg-red-100 text-red-700" :
                          o.status === "pending" ? "bg-yellow-100 text-yellow-700" :
                          o.status === "cancelled" ? "bg-red-100 text-red-700" :
                          "bg-secondary text-foreground"
                        }`}>{
                          o.status === "awaiting_payment_review" ? "Payment approval pending" :
                          o.status === "paid" ? "Payment approved" :
                          o.status === "payment_declined" ? "Payment declined" :
                          o.status
                        }</span>
                      </td>
                      <td className="p-3 text-xs text-muted-foreground hidden sm:table-cell">{new Date(o.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="p-5 border-b border-border flex items-center justify-between">
            <h2 className="font-bold text-lg flex items-center gap-2"><Bell className="h-5 w-5" /> Notifications</h2>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-xs text-primary font-medium hover:underline">Mark all read</button>
            )}
          </div>
          {notifications.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted-foreground">No notifications yet.</p>
          ) : (
            <ul className="divide-y divide-border max-h-96 overflow-y-auto">
              {notifications.slice(0, 20).map((n) => (
                <li key={n.id} className={`p-4 ${!n.read ? "bg-primary/5" : ""}`}>
                  <p className="text-sm font-medium">{n.title}</p>
                  {n.body && <p className="text-xs text-muted-foreground mt-0.5">{n.body}</p>}
                  <p className="text-[10px] text-muted-foreground mt-1">{new Date(n.created_at).toLocaleString()}</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="grid lg:grid-cols-2 gap-6">
          <form onSubmit={submitReview} className="bg-card rounded-2xl border border-border p-5 space-y-4">
            <div>
              <h2 className="font-bold text-lg flex items-center gap-2"><MessageSquare className="h-5 w-5" /> Leave a review</h2>
              <p className="text-xs text-muted-foreground mt-1">Once approved, your review appears on the Tradewise home page.</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium">Your name</label>
                <input value={reviewName} onChange={(e) => setReviewName(e.target.value)} maxLength={100} required
                  className="w-full mt-1 px-3 py-2 rounded-md border border-input bg-background text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium">Company / shop (optional)</label>
                <input value={reviewCompany} onChange={(e) => setReviewCompany(e.target.value)} maxLength={100}
                  className="w-full mt-1 px-3 py-2 rounded-md border border-input bg-background text-sm" />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium">Your review</label>
              <textarea value={reviewBody} onChange={(e) => setReviewBody(e.target.value)} maxLength={1000} required rows={4}
                placeholder="Share your experience with Tradewise…"
                className="w-full mt-1 px-3 py-2 rounded-md border border-input bg-background text-sm resize-none" />
              <p className="text-[10px] text-muted-foreground mt-1">{reviewBody.length}/1000</p>
            </div>
            <div>
              <label className="text-xs font-medium block mb-1">Rating</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} type="button" onClick={() => setReviewRating(n)} aria-label={`${n} stars`}>
                    <Star className={`h-6 w-6 ${n <= reviewRating ? "fill-accent text-accent" : "text-muted-foreground"}`} />
                  </button>
                ))}
              </div>
            </div>
            <button type="submit" disabled={submitting}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-md bg-gradient-brand text-white font-semibold text-sm hover:opacity-90 disabled:opacity-60">
              <Send className="h-4 w-4" /> {submitting ? "Submitting…" : "Submit review"}
            </button>
          </form>

          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <div className="p-5 border-b border-border">
              <h2 className="font-bold text-lg">My reviews</h2>
            </div>
            {myReviews.length === 0 ? (
              <p className="p-8 text-center text-sm text-muted-foreground">You haven't submitted any reviews yet.</p>
            ) : (
              <ul className="divide-y divide-border max-h-96 overflow-y-auto">
                {myReviews.map((r) => (
                  <li key={r.id} className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm">{r.body}</p>
                      <span className={`shrink-0 px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                        r.status === "approved" ? "bg-emerald-100 text-emerald-700" :
                        r.status === "pending" ? "bg-yellow-100 text-yellow-700" :
                        "bg-red-100 text-red-700"
                      }`}>{r.status}</span>
                    </div>
                    <div className="flex items-center gap-1 mt-2 text-accent">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`h-3 w-3 ${i < r.rating ? "fill-current" : "opacity-30"}`} />
                      ))}
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">{new Date(r.created_at).toLocaleString()}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </main>

    </div>
  );
}
