import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Mail, Lock, User, Loader2, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAdmin } from "@/lib/admin";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Login / Sign up — Tradewise" }] }),
  component: AuthPage,
});

function AuthPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const { user, isAdmin, roleLoading } = useAdmin();
  const router = useRouter();

  useEffect(() => {
    if (user && !roleLoading) {
      router.navigate({ to: isAdmin ? "/admin" : "/dashboard" });
    }
  }, [user, isAdmin, roleLoading, router]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: name },
          },
        });
        if (error) throw error;
        toast.success("Account created — welcome!");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const onGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: window.location.origin },
      });
      if (error) throw error;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Google sign-in failed");
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-gradient-to-br from-secondary/30 to-background">
      <div className="w-full max-w-md bg-card rounded-2xl shadow-elegant p-8 animate-fade-up">
        <div className="flex bg-secondary rounded-lg p-1 mb-6">
          {(["login", "signup"] as const).map((m) => (
            <button key={m} onClick={() => setMode(m)}
              className={`flex-1 py-2 rounded-md text-sm font-semibold transition ${mode === m ? "bg-card shadow-card text-primary" : "text-muted-foreground"}`}>
              {m === "login" ? "Login" : "Sign up"}
            </button>
          ))}
        </div>
        <h1 className="text-2xl font-bold mb-1">{mode === "login" ? "Welcome back" : "Create account"}</h1>
        <p className="text-sm text-muted-foreground mb-6">{mode === "login" ? "Login to your Tradewise account" : "Join Tradewise today"}</p>

        <button
          type="button"
          onClick={onGoogle}
          className="w-full py-3 rounded-md border border-input bg-background text-sm font-semibold inline-flex items-center justify-center gap-2 hover:bg-secondary transition mb-4"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.26 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.83z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.83C6.71 7.31 9.14 5.38 12 5.38z"/>
          </svg>
          Continue with Google
        </button>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
          <div className="relative flex justify-center text-xs"><span className="bg-card px-2 text-muted-foreground">or with email</span></div>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          {mode === "signup" && (
            <Field icon={User} type="text" placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} />
          )}
          <Field icon={Mail} type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} />
          <div className="relative">
            <Lock className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password (min 6 chars)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
              className="w-full pl-10 pr-11 py-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {mode === "login" && (
            <div className="text-right">
              <Link to="/forgot-password" className="text-xs text-primary hover:underline">Forgot password?</Link>
            </div>
          )}
          <button disabled={loading} type="submit" className="w-full py-3 rounded-md bg-gradient-brand text-white font-semibold hover:opacity-90 disabled:opacity-60 inline-flex items-center justify-center gap-2">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {mode === "login" ? "Login" : "Create account"}
          </button>
        </form>
        <p className="text-xs text-center text-muted-foreground mt-6">
          By continuing you agree to our <Link to="/terms" className="text-primary">terms</Link> and <Link to="/privacy" className="text-primary">privacy policy</Link>.
        </p>
      </div>
    </div>
  );
}

function Field({ icon: Icon, ...props }: { icon: typeof Mail } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="relative">
      <Icon className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
      <input {...props} required
        className="w-full pl-10 pr-3 py-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
    </div>
  );
}
