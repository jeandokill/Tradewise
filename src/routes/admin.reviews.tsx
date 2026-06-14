import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check, X, Star, Quote, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/reviews")({
  head: () => ({ meta: [{ title: "Reviews — Admin" }, { name: "robots", content: "noindex" }] }),
  component: AdminReviews,
});

type Review = {
  id: string;
  user_id: string;
  name: string;
  company: string | null;
  body: string;
  rating: number;
  status: "pending" | "approved" | "declined";
  created_at: string;
};

function AdminReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [tab, setTab] = useState<"pending" | "approved">("pending");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("reviews")
      .select("*")
      .order("created_at", { ascending: false });
    setReviews((data ?? []) as Review[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel("admin-reviews")
      .on("postgres_changes", { event: "*", schema: "public", table: "reviews" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const approve = async (id: string) => {
    const { error } = await supabase.from("reviews").update({ status: "approved" }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Review approved and posted to home page");
  };

  const decline = async (id: string) => {
    const { error } = await supabase.from("reviews").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Review declined and removed");
  };

  const filtered = reviews.filter((r) => r.status === tab);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><MessageSquare className="h-6 w-6" /> Customer Reviews</h1>
        <p className="text-sm text-muted-foreground">Approve or decline reviews submitted by customers.</p>
      </div>

      <div className="flex gap-2 border-b border-border">
        {(["pending", "approved"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px capitalize ${
              tab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground"
            }`}
          >
            {t} ({reviews.filter((r) => r.status === t).length})
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : filtered.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-10 text-center">
          <p className="text-sm text-muted-foreground">No {tab} reviews.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {filtered.map((r) => (
            <div key={r.id} className="bg-card border border-border rounded-xl p-5">
              <Quote className="h-5 w-5 text-accent mb-2" />
              <p className="text-sm">{r.body}</p>
              <div className="flex items-center gap-1 mt-3 text-accent">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`h-3.5 w-3.5 ${i < r.rating ? "fill-current" : "opacity-30"}`} />
                ))}
              </div>
              <div className="mt-3 pb-3 border-b border-border">
                <p className="font-semibold text-sm">{r.name}</p>
                {r.company && <p className="text-xs text-muted-foreground">{r.company}</p>}
                <p className="text-[10px] text-muted-foreground mt-1">{new Date(r.created_at).toLocaleString()}</p>
              </div>
              {tab === "pending" ? (
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => approve(r.id)}
                    className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 rounded-md bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700"
                  >
                    <Check className="h-4 w-4" /> Accept & post
                  </button>
                  <button
                    onClick={() => decline(r.id)}
                    className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 rounded-md bg-destructive text-destructive-foreground text-sm font-semibold hover:opacity-90"
                  >
                    <X className="h-4 w-4" /> Decline
                  </button>
                </div>
              ) : (
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase text-emerald-600">Live on home page</span>
                  <button
                    onClick={() => decline(r.id)}
                    className="text-xs text-destructive font-medium hover:underline"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
