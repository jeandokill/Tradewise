import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Lock, Loader2, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Reset password — Tradewise" }] }),
  component: ResetPassword,
});

function ResetPassword() {
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Supabase parses the recovery token in the URL hash automatically and
    // emits a PASSWORD_RECOVERY event. We just enable the form on that event.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    // Fallback — if already in a session via the link, allow the form
    supabase.auth.getSession().then(({ data }) => { if (data.session) setReady(true); });
    return () => subscription.unsubscribe();
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Password updated — please log in");
      await supabase.auth.signOut();
      router.navigate({ to: "/login" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-gradient-to-br from-secondary/30 to-background">
      <div className="w-full max-w-md bg-card rounded-2xl shadow-elegant p-8">
        <h1 className="text-2xl font-bold mb-1">Set a new password</h1>
        <p className="text-sm text-muted-foreground mb-6">Choose a strong password with at least 8 characters.</p>
        {!ready ? (
          <p className="text-sm text-muted-foreground">Verifying reset link…</p>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="relative">
              <Lock className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type={show ? "text" : "password"} required minLength={8}
                value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="New password"
                className="w-full pl-10 pr-11 py-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <button type="button" onClick={() => setShow((s) => !s)}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary">
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <button disabled={loading} type="submit" className="w-full py-3 rounded-md bg-gradient-brand text-white font-semibold hover:opacity-90 disabled:opacity-60 inline-flex items-center justify-center gap-2">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Update password
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
