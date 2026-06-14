import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Mail, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [{ title: "Forgot password — Tradewise" }] }),
  component: ForgotPassword,
});

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: "https://tradewise.rw/reset-password",
      });
      if (error) throw error;
      setSent(true);
      toast.success("Reset link sent — check your inbox");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send reset link");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-gradient-to-br from-secondary/30 to-background">
      <div className="w-full max-w-md bg-card rounded-2xl shadow-elegant p-8">
        <h1 className="text-2xl font-bold mb-1">Forgot password</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Enter your email and we'll send you a link to set a new password.
        </p>
        {sent ? (
          <div className="text-sm text-muted-foreground space-y-3">
            <p>If an account exists for <b>{email}</b>, a reset link is on its way.</p>
            <p>Didn't get it? Check your spam folder, or wait a minute and try again.</p>
            <Link to="/login" className="text-primary inline-block mt-2">Back to login</Link>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="relative">
              <Mail className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                className="w-full pl-10 pr-3 py-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <button disabled={loading} type="submit" className="w-full py-3 rounded-md bg-gradient-brand text-white font-semibold hover:opacity-90 disabled:opacity-60 inline-flex items-center justify-center gap-2">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Send reset link
            </button>
            <Link to="/login" className="block text-center text-sm text-muted-foreground hover:text-primary">Back to login</Link>
          </form>
        )}
      </div>
    </div>
  );
}
