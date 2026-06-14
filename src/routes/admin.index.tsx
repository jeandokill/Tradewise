import { formatRWF } from "@/lib/currency";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAdmin } from "@/lib/admin";
import { ShoppingBag, DollarSign, Users as UsersIcon, Package } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line,
} from "recharts";

export const Route = createFileRoute("/admin/")({
  component: Overview,
});

const STATUS_COLORS: Record<string, string> = {
  pending: "#f59e0b", awaiting_payment_review: "#f97316", paid: "#3b82f6", shipped: "#8b5cf6",
  delivered: "#10b981", cancelled: "#ef4444", refunded: "#6b7280", payment_declined: "#dc2626",
};

const RANGE_OPTIONS = [
  { key: "7d", label: "Last 7 days" },
  { key: "30d", label: "Last 30 days" },
  { key: "6m", label: "Last 6 months" },
  { key: "1y", label: "Last year" },
  { key: "lifetime", label: "Lifetime" },
] as const;

type RangeKey = typeof RANGE_OPTIONS[number]["key"];

type OrderRow = { id: string; total: number; status: string; created_at: string; customer_name: string | null };
type ProfileRow = { id: string; created_at: string };

function isWithinRange(dateStr: string, range: RangeKey) {
  const d = new Date(dateStr);
  const now = new Date();
  switch (range) {
    case "7d": return d >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case "30d": return d >= new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case "6m": return d >= new Date(now.getTime() - 183 * 24 * 60 * 60 * 1000);
    case "1y": return d >= new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    default: return true;
  }
}

function formatDateKey(d: Date, range: RangeKey) {
  if (range === "7d" || range === "30d") {
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }
  if (range === "6m") {
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }
  return d.toLocaleDateString(undefined, { month: "short", year: "2-digit" });
}

function buildBarData(orders: OrderRow[], range: RangeKey) {
  const now = new Date();
  const points: { label: string; orders: number; revenue: number }[] = [];

  if (range === "7d") {
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now); d.setDate(d.getDate() - i);
      const dayOrders = orders.filter((o) => new Date(o.created_at).toDateString() === d.toDateString());
      points.push({
        label: d.toLocaleDateString(undefined, { weekday: "short" }),
        orders: dayOrders.length,
        revenue: Math.round(dayOrders.reduce((s, o) => s + Number(o.total), 0)),
      });
    }
  } else if (range === "30d") {
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now); d.setDate(d.getDate() - i);
      const dayOrders = orders.filter((o) => new Date(o.created_at).toDateString() === d.toDateString());
      points.push({
        label: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
        orders: dayOrders.length,
        revenue: Math.round(dayOrders.reduce((s, o) => s + Number(o.total), 0)),
      });
    }
  } else if (range === "6m") {
    // weekly buckets
    for (let i = 25; i >= 0; i--) {
      const end = new Date(now); end.setDate(end.getDate() - i * 7);
      const start = new Date(end); start.setDate(start.getDate() - 6);
      const weekOrders = orders.filter((o) => {
        const od = new Date(o.created_at);
        return od >= start && od <= end;
      });
      points.push({
        label: end.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
        orders: weekOrders.length,
        revenue: Math.round(weekOrders.reduce((s, o) => s + Number(o.total), 0)),
      });
    }
  } else if (range === "1y") {
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthOrders = orders.filter((o) => {
        const od = new Date(o.created_at);
        return od.getFullYear() === d.getFullYear() && od.getMonth() === d.getMonth();
      });
      points.push({
        label: d.toLocaleDateString(undefined, { month: "short" }),
        orders: monthOrders.length,
        revenue: Math.round(monthOrders.reduce((s, o) => s + Number(o.total), 0)),
      });
    }
  } else {
    // lifetime — monthly buckets from first order
    const dates = orders.map((o) => new Date(o.created_at));
    const first = dates.length ? new Date(Math.min(...dates.map((d) => d.getTime()))) : new Date();
    const start = new Date(first.getFullYear(), first.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    let cur = new Date(start);
    while (cur <= end) {
      const monthOrders = orders.filter((o) => {
        const od = new Date(o.created_at);
        return od.getFullYear() === cur.getFullYear() && od.getMonth() === cur.getMonth();
      });
      points.push({
        label: cur.toLocaleDateString(undefined, { month: "short", year: "2-digit" }),
        orders: monthOrders.length,
        revenue: Math.round(monthOrders.reduce((s, o) => s + Number(o.total), 0)),
      });
      cur.setMonth(cur.getMonth() + 1);
    }
  }
  return points;
}

function Overview() {
  const { notifications } = useAdmin();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [productCount, setProductCount] = useState(0);
  const [range, setRange] = useState<RangeKey>("7d");

  const load = async () => {
    const [{ data: o }, { data: p }, { count }] = await Promise.all([
      supabase.from("orders").select("id,total,status,created_at,customer_name").order("created_at", { ascending: false }),
      supabase.from("profiles").select("id,created_at"),
      supabase.from("products").select("*", { count: "exact", head: true }),
    ]);
    setOrders((o ?? []) as OrderRow[]);
    setProfiles((p ?? []) as ProfileRow[]);
    setProductCount(count ?? 0);
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { load(); }, [notifications.length]);

  const filteredOrders = useMemo(() => orders.filter((o) => isWithinRange(o.created_at, range)), [orders, range]);

  const stats = useMemo(() => {
    const byStatus: Record<string, number> = {};
    let revenue = 0;
    filteredOrders.forEach((o) => {
      byStatus[o.status] = (byStatus[o.status] ?? 0) + 1;
      if (["paid", "shipped", "delivered"].includes(o.status)) revenue += Number(o.total);
    });
    return { byStatus, revenue };
  }, [filteredOrders]);

  const pieData = Object.entries(stats.byStatus).map(([name, value]) => ({ name, value }));
  const barData = useMemo(() => buildBarData(filteredOrders, range), [filteredOrders, range]);

  const signupsByDay = useMemo(() => {
    const days: { day: string; signups: number }[] = [];
    const now = new Date();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now); d.setDate(d.getDate() - i);
      const c = profiles.filter((u) => new Date(u.created_at).toDateString() === d.toDateString()).length;
      days.push({ day: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }), signups: c });
    }
    return days;
  }, [profiles]);

  const cards = [
    { label: "Total Orders", value: filteredOrders.length, icon: ShoppingBag, color: "from-blue-500 to-blue-600" },
    { label: "Revenue", value: formatRWF(stats.revenue), icon: DollarSign, color: "from-emerald-500 to-emerald-600" },
    { label: "Signups", value: profiles.length, icon: UsersIcon, color: "from-violet-500 to-violet-600" },
    { label: "Products", value: productCount, icon: Package, color: "from-amber-500 to-amber-600" },
  ];

  const rangeLabel = RANGE_OPTIONS.find((r) => r.key === range)?.label ?? "";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl md:text-2xl font-bold">Overview</h2>
        <p className="text-sm text-muted-foreground">Real-time metrics from your database</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {RANGE_OPTIONS.map((r) => (
          <button
            key={r.key}
            onClick={() => setRange(r.key)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium border transition-colors ${
              range === r.key
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-foreground border-border hover:border-primary/50"
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {cards.map((c) => (
          <div key={c.label} className="bg-card rounded-xl border border-border p-4 md:p-5">
            <div className={`h-9 w-9 rounded-lg bg-gradient-to-br ${c.color} text-white flex items-center justify-center mb-3`}>
              <c.icon className="h-4 w-4" />
            </div>
            <p className="text-xs text-muted-foreground">{c.label}</p>
            <p className="text-xl md:text-2xl font-bold mt-1">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-card rounded-xl border border-border p-4 md:p-5">
          <h3 className="font-semibold mb-4">Orders & Revenue — {rangeLabel}</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="label" fontSize={11} interval="preserveStartEnd" />
                <YAxis fontSize={12} />
                <Tooltip />
                <Bar dataKey="orders" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-4 md:p-5">
          <h3 className="font-semibold mb-4">Orders by status — {rangeLabel}</h3>
          <div className="h-64">
            {pieData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">No orders yet</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={70} label>
                    {pieData.map((d) => <Cell key={d.name} fill={STATUS_COLORS[d.name] ?? "#888"} />)}
                  </Pie>
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border p-4 md:p-5">
        <h3 className="font-semibold mb-4">New signups — last 14 days</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={signupsByDay}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="day" fontSize={11} />
              <YAxis fontSize={12} allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="signups" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border p-4 md:p-5">
        <h3 className="font-semibold mb-4">Recent orders — {rangeLabel}</h3>
        {filteredOrders.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">No orders in this period.</p>
        ) : (
          <div className="space-y-2">
            {filteredOrders.slice(0, 8).map((o) => (
              <div key={o.id} className="flex items-center justify-between text-sm py-2 border-b border-border last:border-0">
                <div>
                  <p className="font-medium">#{o.id.slice(0, 8)}</p>
                  <p className="text-xs text-muted-foreground">{o.customer_name ?? "—"}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatRWF(o.total)}</p>
                  <StatusBadge status={o.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const color = STATUS_COLORS[status] ?? "#888";
  return (
    <span className="inline-block text-[10px] font-bold uppercase px-2 py-0.5 rounded mt-0.5"
      style={{ backgroundColor: `${color}20`, color }}>{status}</span>
  );
}

