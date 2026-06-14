import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Trash2, X, Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { uploadImage } from "@/lib/upload";

export const Route = createFileRoute("/admin/categories")({
  component: CategoriesAdmin,
});

type Cat = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  sort_order: number;
};

const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

function CategoriesAdmin() {
  const [cats, setCats] = useState<Cat[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Cat | null>(null);

  const load = async () => {
    const { data } = await supabase.from("categories").select("*").order("sort_order");
    setCats((data ?? []) as Cat[]);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const remove = async (id: string) => {
    if (!confirm("Delete this category?")) return;
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setCats((c) => c.filter((x) => x.id !== id));
    toast.success("Category deleted");
  };

  const save = async (draft: Cat) => {
    const payload = { ...draft, slug: draft.slug || slugify(draft.name) };
    if (cats.find((c) => c.id === draft.id)) {
      const { error } = await supabase.from("categories").update(payload).eq("id", draft.id);
      if (error) return toast.error(error.message);
      toast.success("Category updated");
    } else {
      const { id: _ignore, ...insert } = payload;
      void _ignore;
      const { error } = await supabase.from("categories").insert(insert);
      if (error) return toast.error(error.message);
      toast.success("Category created");
    }
    setEditing(null); load();
  };

  const startNew = () => setEditing({
    id: "new", name: "", slug: "", description: "", image_url: "", sort_order: cats.length,
  });

  if (loading) return <div className="text-sm text-muted-foreground">Loading…</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl md:text-2xl font-bold">Categories</h2>
          <p className="text-sm text-muted-foreground">{cats.length} categories — top-level groupings for anything you sell (e.g. Cars, Spare Parts, Clothes, Shoes). You can add more anytime.</p>
        </div>
        <button onClick={startNew} className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90">
          <Plus className="h-4 w-4" /> Add category
        </button>
      </div>

      {cats.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-10 text-center">
          <p className="text-sm text-muted-foreground">No categories yet.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cats.map((c) => (
            <div key={c.id} className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="aspect-video bg-secondary/30">
                {c.image_url ? <img src={c.image_url} alt={c.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">No image</div>}
              </div>
              <div className="p-4 space-y-2">
                <h3 className="font-bold">{c.name}</h3>
                <p className="text-xs text-muted-foreground line-clamp-2">{c.description}</p>
                <div className="flex items-center gap-1 pt-2 border-t border-border">
                  <button onClick={() => setEditing(c)} className="flex-1 inline-flex items-center justify-center px-2 py-1.5 rounded-md text-xs font-medium bg-primary text-primary-foreground hover:opacity-90">Edit</button>
                  <button onClick={() => remove(c.id)} className="h-8 w-8 inline-flex items-center justify-center rounded-md text-destructive hover:bg-destructive/10">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && <Editor cat={editing} onSave={save} onClose={() => setEditing(null)} />}
    </div>
  );
}

function Editor({ cat, onSave, onClose }: { cat: Cat; onSave: (c: Cat) => void; onClose: () => void }) {
  const [draft, setDraft] = useState<Cat>(cat);
  const [uploading, setUploading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    setUploading(true);
    try { const url = await uploadImage(f, "categories"); setDraft({ ...draft, image_url: url }); toast.success("Uploaded"); }
    catch (err) { toast.error(err instanceof Error ? err.message : "Upload failed"); }
    finally { setUploading(false); }
  };

  const generateAi = async () => {
    if (!draft.name) return toast.error("Enter a name first");
    setAiLoading(true);
    try {
      const res = await fetch("/api/generate-description", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: draft.name, kind: "generic", imageUrl: draft.image_url || undefined }),
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
          <h3 className="font-bold text-lg">{cat.id === "new" ? "New category" : "Edit category"}</h3>
          <button onClick={onClose} className="h-9 w-9 rounded-md hover:bg-secondary inline-flex items-center justify-center"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-4 md:p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          <Inp label="Name" value={draft.name} onChange={(v) => setDraft({ ...draft, name: v, slug: draft.slug || slugify(v) })} />
          <Inp label="Slug" value={draft.slug} onChange={(v) => setDraft({ ...draft, slug: v })} />
          <div className="flex items-end gap-2">
            <div className="flex-1"><Inp label="Image URL" value={draft.image_url ?? ""} onChange={(v) => setDraft({ ...draft, image_url: v })} /></div>
            <label className="inline-flex items-center gap-1 px-3 py-2 rounded-md border border-input bg-background text-xs font-medium hover:bg-secondary cursor-pointer">
              {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />} Upload
              <input type="file" accept="image/*" className="hidden" onChange={onFile} />
            </label>
          </div>
          {draft.image_url && <img src={draft.image_url} alt="" className="h-32 w-full object-cover rounded-md" />}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-muted-foreground">Description</span>
              <button onClick={generateAi} disabled={aiLoading} className="text-xs font-semibold text-primary hover:underline disabled:opacity-50">
                {aiLoading ? "Generating…" : "✨ Generate with AI"}
              </button>
            </div>
            <textarea rows={4} value={draft.description ?? ""} onChange={(e) => setDraft({ ...draft, description: e.target.value })}
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

function Inp({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
    </label>
  );
}
