import { formatRWF } from "@/lib/currency";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Trash2, X, Upload, Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { uploadImage } from "@/lib/upload";

export const Route = createFileRoute("/admin/products")({
  component: ProductsAdmin,
});

type Prod = {
  id: string;
  category_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  stock: number;
  image_url: string | null;
  is_vehicle: boolean;
  is_featured: boolean;
  is_new: boolean;
  is_bestseller: boolean;
  hide_price: boolean;
  compatible_with: string[] | null;
};
type Cat = { id: string; name: string };

const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

function ProductsAdmin() {
  const [products, setProducts] = useState<Prod[]>([]);
  const [cats, setCats] = useState<Cat[]>([]);
  const [editing, setEditing] = useState<Prod | null>(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const [{ data: p }, { data: c }] = await Promise.all([
      supabase.from("products").select("*").order("created_at", { ascending: false }),
      supabase.from("categories").select("id,name").order("name"),
    ]);
    setProducts((p ?? []) as Prod[]);
    setCats((c ?? []) as Cat[]);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const remove = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setProducts((p) => p.filter((x) => x.id !== id));
    toast.success("Deleted");
  };

  const save = async (draft: Prod) => {
    const baseSlug = (draft.slug || slugify(draft.name) || "product").slice(0, 60);
    const isExisting = !!products.find((p) => p.id === draft.id);

    // Try saving; on slug unique-violation, retry with a short random suffix (up to 5 times)
    for (let attempt = 0; attempt < 6; attempt++) {
      const slug = attempt === 0 ? baseSlug : `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`;
      const payload = { ...draft, slug };
      const { error } = isExisting
        ? await supabase.from("products").update(payload).eq("id", draft.id)
        : await (async () => {
            const { id: _ignore, ...insert } = payload; void _ignore;
            return supabase.from("products").insert(insert);
          })();
      if (!error) {
        toast.success(isExisting ? "Updated" : "Created");
        setEditing(null); load();
        return;
      }
      // 23505 = unique_violation
      const code = (error as { code?: string }).code;
      if (code !== "23505" || !/slug/i.test(error.message)) {
        return toast.error(error.message);
      }
    }
    toast.error("Couldn't generate a unique slug, please edit it manually");
  };

  const startNew = () => setEditing({
    id: "new", category_id: cats[0]?.id ?? null, name: "", slug: "", description: "",
    price: 0, stock: 10, image_url: "", is_vehicle: false, is_featured: false, is_new: true, is_bestseller: false, hide_price: false, compatible_with: [],
  });

  const filtered = products.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()));
  const catName = (id: string | null) => cats.find((c) => c.id === id)?.name ?? "—";

  if (loading) return <div className="text-sm text-muted-foreground">Loading…</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl md:text-2xl font-bold">Products</h2>
          <p className="text-sm text-muted-foreground">{products.length} products</p>
        </div>
        <button onClick={startNew} className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90">
          <Plus className="h-4 w-4" /> Add product
        </button>
      </div>

      <div className="relative max-w-md">
        <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search products…"
          className="w-full pl-9 pr-3 py-2 rounded-md border border-input bg-background text-sm" />
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-xs uppercase">
              <tr>
                <th className="text-left p-3">Product</th>
                <th className="text-left p-3 hidden sm:table-cell">Category</th>
                <th className="text-right p-3">Price</th>
                <th className="text-right p-3 hidden md:table-cell">Stock</th>
                <th className="text-right p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-t border-border hover:bg-secondary/30">
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      {p.image_url ? <img src={p.image_url} alt="" className="h-10 w-10 rounded-md object-cover bg-secondary/30 shrink-0" /> : <div className="h-10 w-10 rounded-md bg-secondary/40 shrink-0" />}
                      <div className="min-w-0">
                        <p className="font-medium truncate">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{p.is_vehicle ? "Vehicle" : "Part"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 hidden sm:table-cell"><span className="text-xs px-2 py-0.5 rounded bg-secondary">{catName(p.category_id)}</span></td>
                  <td className="p-3 text-right font-semibold">{p.hide_price ? <span className="text-xs text-muted-foreground italic">Contact sales</span> : formatRWF(p.price)}</td>
                  <td className="p-3 text-right hidden md:table-cell">
                    <span className={`text-xs font-bold ${p.stock < 20 ? "text-amber-600" : "text-emerald-600"}`}>{p.stock}</span>
                  </td>
                  <td className="p-3 text-right">
                    <div className="inline-flex gap-1">
                      <button onClick={() => setEditing(p)} className="px-2.5 py-1 rounded-md text-xs font-medium bg-primary text-primary-foreground hover:opacity-90">Edit</button>
                      <button onClick={() => remove(p.id)} className="h-7 w-7 inline-flex items-center justify-center rounded-md text-destructive hover:bg-destructive/10">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={5} className="p-8 text-center text-sm text-muted-foreground">{products.length === 0 ? "No products yet. Click 'Add product' to create your first one." : "No matches"}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editing && <Editor product={editing} cats={cats} vehicles={products.filter((p) => p.is_vehicle && p.id !== editing.id)} onSave={save} onClose={() => setEditing(null)} />}
    </div>
  );
}

function Editor({ product, cats, vehicles, onSave, onClose }: { product: Prod; cats: Cat[]; vehicles: Prod[]; onSave: (p: Prod) => void; onClose: () => void }) {
  const [draft, setDraft] = useState<Prod>(product);
  const [uploading, setUploading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    setUploading(true);
    try { const url = await uploadImage(f, "products"); setDraft({ ...draft, image_url: url }); toast.success("Uploaded"); }
    catch (err) { toast.error(err instanceof Error ? err.message : "Upload failed"); }
    finally { setUploading(false); }
  };

  const generateAi = async () => {
    if (!draft.name) return toast.error("Enter a name first");
    setAiLoading(true);
    try {
      const catName = cats.find((c) => c.id === draft.category_id)?.name;
      const res = await fetch("/api/generate-description", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: draft.name, category: catName,
          kind: draft.is_vehicle ? "car" : "part",
          imageUrl: draft.image_url || undefined,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setDraft({ ...draft, description: data.description });
      toast.success("AI description generated");
    } catch { toast.error("AI generation failed"); }
    finally { setAiLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-card rounded-xl border border-border max-w-2xl w-full my-8 animate-fade-up" onClick={(e) => e.stopPropagation()}>
        <div className="p-4 md:p-5 border-b border-border flex items-center justify-between">
          <h3 className="font-bold text-lg">{product.id === "new" ? "New product" : "Edit product"}</h3>
          <button onClick={onClose} className="h-9 w-9 rounded-md hover:bg-secondary inline-flex items-center justify-center"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-4 md:p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="grid sm:grid-cols-2 gap-3">
            <Inp label="Name" value={draft.name} onChange={(v) => setDraft({ ...draft, name: v, slug: draft.slug || slugify(v) })} />
            <Inp label="Slug" value={draft.slug} onChange={(v) => setDraft({ ...draft, slug: v })} />
            <label className="block">
              <span className="text-xs font-medium text-muted-foreground">Category</span>
              <select value={draft.category_id ?? ""} onChange={(e) => setDraft({ ...draft, category_id: e.target.value || null })}
                className="mt-1 w-full px-3 py-2 rounded-md border border-input bg-background text-sm">
                <option value="">— None —</option>
                {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>
            <Inp label="Price (USD)" type="number" value={String(draft.price)} onChange={(v) => setDraft({ ...draft, price: Number(v) || 0 })} />
            <Inp label="Stock" type="number" value={String(draft.stock)} onChange={(v) => setDraft({ ...draft, stock: Number(v) || 0 })} />
          </div>
          <div className="flex items-end gap-2">
            <div className="flex-1"><Inp label="Image URL" value={draft.image_url ?? ""} onChange={(v) => setDraft({ ...draft, image_url: v })} /></div>
            <label className="inline-flex items-center gap-1 px-3 py-2 rounded-md border border-input bg-background text-xs font-medium hover:bg-secondary cursor-pointer">
              {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />} Upload
              <input type="file" accept="image/*" className="hidden" onChange={onFile} />
            </label>
          </div>
          {draft.image_url && <img src={draft.image_url} alt="" className="h-32 w-full object-contain bg-secondary/30 rounded-md" />}
          <div className="flex flex-wrap gap-4">
            <Chk label="This is a vehicle" checked={draft.is_vehicle} onChange={(v) => setDraft({ ...draft, is_vehicle: v })} />
            <Chk label="Featured" checked={draft.is_featured} onChange={(v) => setDraft({ ...draft, is_featured: v })} />
            <Chk label="New arrival" checked={draft.is_new} onChange={(v) => setDraft({ ...draft, is_new: v })} />
            <Chk label="Best seller" checked={draft.is_bestseller} onChange={(v) => setDraft({ ...draft, is_bestseller: v })} />
            <Chk label="Hide price (show 'Contact sales' link instead)" checked={draft.hide_price} onChange={(v) => setDraft({ ...draft, hide_price: v })} />
          </div>
          {!draft.is_vehicle && vehicles.length > 0 && (
            <div>
              <span className="text-xs font-medium text-muted-foreground">Compatible vehicles</span>
              <p className="text-[11px] text-muted-foreground mb-2">Select the vehicles this part fits. Customers viewing those vehicles will see this part as a compatible spare.</p>
              <div className="max-h-40 overflow-y-auto rounded-md border border-input bg-background p-2 space-y-1">
                {vehicles.map((v) => {
                  const checked = (draft.compatible_with ?? []).includes(v.id);
                  return (
                    <label key={v.id} className="flex items-center gap-2 text-sm px-2 py-1 rounded hover:bg-secondary/40 cursor-pointer">
                      <input type="checkbox" checked={checked} onChange={(e) => {
                        const curr = new Set(draft.compatible_with ?? []);
                        if (e.target.checked) curr.add(v.id); else curr.delete(v.id);
                        setDraft({ ...draft, compatible_with: Array.from(curr) });
                      }} />
                      <span>{v.name}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-muted-foreground">Description</span>
              <button onClick={generateAi} disabled={aiLoading} className="text-xs font-semibold text-primary hover:underline disabled:opacity-50">
                {aiLoading ? "Generating…" : "✨ Generate with AI from image"}
              </button>
            </div>
            <textarea rows={5} value={draft.description ?? ""} onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
        </div>
        <div className="p-4 border-t border-border flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-md text-sm font-medium hover:bg-secondary">Cancel</button>
          <button onClick={() => onSave(draft)} className="px-4 py-2 rounded-md text-sm font-semibold bg-primary text-primary-foreground hover:opacity-90">Save</button>
        </div>
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
function Chk({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="inline-flex items-center gap-2 text-sm">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} /> {label}
    </label>
  );
}
