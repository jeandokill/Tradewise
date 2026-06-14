import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/settings")({
  component: SettingsAdmin,
});

type Settings = { storeName: string; supportEmail: string; currency: string; maintenance: boolean };
const DEFAULT: Settings = { storeName: "Tradewise", supportEmail: "support@tradewise.rw", currency: "USD", maintenance: false };

function SettingsAdmin() {
  const [draft, setDraft] = useState<Settings>(DEFAULT);
  useEffect(() => {
    try { const raw = localStorage.getItem("tw-settings"); if (raw) setDraft(JSON.parse(raw)); } catch { /* ignore */ }
  }, []);
  const save = () => { localStorage.setItem("tw-settings", JSON.stringify(draft)); toast.success("Settings saved"); };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-xl md:text-2xl font-bold">Settings</h2>
        <p className="text-sm text-muted-foreground">Manage your store configuration</p>
      </div>
      <div className="bg-card rounded-xl border border-border p-5 space-y-4">
        <h3 className="font-semibold">Store information</h3>
        <Inp label="Store name" value={draft.storeName} onChange={(v) => setDraft({ ...draft, storeName: v })} />
        <Inp label="Support email" type="email" value={draft.supportEmail} onChange={(v) => setDraft({ ...draft, supportEmail: v })} />
        <div>
          <span className="text-xs font-medium text-muted-foreground">Currency</span>
          <select value={draft.currency} onChange={(e) => setDraft({ ...draft, currency: e.target.value })}
            className="mt-1 w-full px-3 py-2 rounded-md border border-input bg-background text-sm">
            {["USD", "EUR", "RWF", "KES", "GBP"].map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={draft.maintenance} onChange={(e) => setDraft({ ...draft, maintenance: e.target.checked })} />
          Enable maintenance mode
        </label>
      </div>
      <div className="flex justify-end">
        <button onClick={save} className="px-5 py-2.5 rounded-md bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90">Save changes</button>
      </div>
    </div>
  );
}

function Inp({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
    </label>
  );
}
