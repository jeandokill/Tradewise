import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Trash2, Eye, EyeOff, ArrowUp, ArrowDown, Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { uploadImage } from "@/lib/upload";

export const Route = createFileRoute("/admin/hero")({
  component: HeroEditor,
});

type Slide = {
  id: string;
  image_url: string;
  title: string;
  subtitle: string | null;
  cta_label: string | null;
  cta_link: string | null;
  sort_order: number;
  active: boolean;
};

function HeroEditor() {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data } = await supabase.from("hero_slides").select("*").order("sort_order");
    setSlides((data ?? []) as Slide[]);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const update = async (id: string, patch: Partial<Slide>) => {
    setSlides((s) => s.map((x) => (x.id === id ? { ...x, ...patch } : x)));
    const { error } = await supabase.from("hero_slides").update(patch).eq("id", id);
    if (error) toast.error(error.message);
  };
  const remove = async (id: string) => {
    if (!confirm("Delete this slide?")) return;
    const { error } = await supabase.from("hero_slides").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setSlides((s) => s.filter((x) => x.id !== id));
    toast.success("Slide deleted");
  };
  const add = async () => {
    const next = slides.length;
    const { data, error } = await supabase.from("hero_slides").insert({
      image_url: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1600",
      title: "New slide", subtitle: "Subtitle here", cta_label: "Learn more", cta_link: "/categories",
      sort_order: next, active: true,
    }).select().single();
    if (error) return toast.error(error.message);
    setSlides([...slides, data as Slide]);
    toast.success("Slide added");
  };
  const move = async (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= slides.length) return;
    const next = [...slides];
    [next[idx], next[target]] = [next[target], next[idx]];
    setSlides(next);
    await Promise.all(next.map((s, i) => supabase.from("hero_slides").update({ sort_order: i }).eq("id", s.id)));
  };

  if (loading) return <div className="text-sm text-muted-foreground">Loading…</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl md:text-2xl font-bold">Hero Carousel</h2>
          <p className="text-sm text-muted-foreground">{slides.length} slides</p>
        </div>
        <button onClick={add} className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90">
          <Plus className="h-4 w-4" /> Add slide
        </button>
      </div>

      {slides.length === 0 && (
        <div className="bg-card rounded-xl border border-border p-10 text-center">
          <p className="text-sm text-muted-foreground">No slides yet. Click "Add slide" to create your first homepage banner.</p>
        </div>
      )}

      <div className="grid gap-4">
        {slides.map((s, idx) => <SlideCard key={s.id} slide={s} idx={idx} total={slides.length} update={update} remove={remove} move={move} />)}
      </div>
    </div>
  );
}

function SlideCard({ slide: s, idx, total, update, remove, move }: {
  slide: Slide; idx: number; total: number;
  update: (id: string, patch: Partial<Slide>) => void;
  remove: (id: string) => void;
  move: (idx: number, dir: -1 | 1) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImage(file, "hero");
      update(s.id, { image_url: url });
      toast.success("Image uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally { setUploading(false); }
  };

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden grid md:grid-cols-[260px_1fr]">
      <div className="aspect-video md:aspect-auto bg-secondary/30 relative">
        <img src={s.image_url} alt={s.title} className="w-full h-full object-cover" />
        {!s.active && <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-xs font-bold">HIDDEN</div>}
      </div>
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className="text-xs font-bold uppercase text-muted-foreground">Slide #{idx + 1}</span>
          <div className="flex items-center gap-1">
            <IconBtn title="Move up" onClick={() => move(idx, -1)} disabled={idx === 0}><ArrowUp className="h-4 w-4" /></IconBtn>
            <IconBtn title="Move down" onClick={() => move(idx, 1)} disabled={idx === total - 1}><ArrowDown className="h-4 w-4" /></IconBtn>
            <IconBtn title="Toggle visibility" onClick={() => update(s.id, { active: !s.active })}>
              {s.active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </IconBtn>
            <IconBtn title="Delete" onClick={() => remove(s.id)} className="text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></IconBtn>
          </div>
        </div>
        <Field label="Title" value={s.title} onChange={(v) => update(s.id, { title: v })} />
        <Field label="Subtitle" value={s.subtitle ?? ""} onChange={(v) => update(s.id, { subtitle: v })} />
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="CTA label" value={s.cta_label ?? ""} onChange={(v) => update(s.id, { cta_label: v })} />
          <Field label="CTA link" value={s.cta_link ?? ""} onChange={(v) => update(s.id, { cta_link: v })} />
        </div>
        <div className="flex items-end gap-2">
          <div className="flex-1"><Field label="Image URL" value={s.image_url} onChange={(v) => update(s.id, { image_url: v })} /></div>
          <label className="inline-flex items-center gap-1 px-3 py-2 rounded-md border border-input bg-background text-xs font-medium hover:bg-secondary cursor-pointer">
            {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />} Upload
            <input type="file" accept="image/*" className="hidden" onChange={onFile} disabled={uploading} />
          </label>
        </div>
      </div>
    </div>
  );
}

function IconBtn({ children, className = "", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button {...props} className={`h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed ${className}`}>
      {children}
    </button>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
    </label>
  );
}
