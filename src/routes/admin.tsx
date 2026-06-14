import { createFileRoute, Link, Outlet, useRouter, useRouterState } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  LayoutDashboard, Images, FolderTree, Package, ShoppingBag, Users, Settings as SettingsIcon,
  Bell, LogOut, Menu, X, Home, MessageSquare,
} from "lucide-react";
import { useAdmin } from "@/lib/admin";
import logo from "@/assets/tradewise-logo.png";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — Tradewise" }, { name: "robots", content: "noindex" }] }),
  component: AdminShell,
});

const navItems: { to: string; label: string; icon: typeof LayoutDashboard; exact?: boolean }[] = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/hero", label: "Hero Section", icon: Images },
  { to: "/admin/categories", label: "Categories", icon: FolderTree },
  { to: "/admin/products", label: "Products", icon: Package },
  { to: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { to: "/admin/reviews", label: "Reviews", icon: MessageSquare },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/settings", label: "Settings", icon: SettingsIcon },
];


function AdminShell() {
  const { user, isAdmin, loading, roleLoading } = useAdmin();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (loading || roleLoading) return;
    if (!user) router.navigate({ to: "/login" });
    else if (!isAdmin) router.navigate({ to: "/dashboard" });
  }, [user, isAdmin, loading, roleLoading, router]);

  if (loading || roleLoading || !user || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary/30">
        <p className="text-sm text-muted-foreground">Checking admin access…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/30 flex">
      <aside className="hidden lg:flex w-64 shrink-0 bg-card border-r border-border flex-col">
        <SidebarContent />
      </aside>
      {open && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <aside className="relative w-72 max-w-[85%] bg-card border-r border-border flex flex-col animate-slide-in">
            <button onClick={() => setOpen(false)} className="absolute top-3 right-3 h-9 w-9 rounded-md hover:bg-secondary inline-flex items-center justify-center">
              <X className="h-5 w-5" />
            </button>
            <SidebarContent onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      )}
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar onMenu={() => setOpen(true)} />
        <main className="flex-1 p-4 md:p-6 max-w-full overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { signOut } = useAdmin();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const router = useRouter();

  return (
    <>
      <div className="p-4 border-b border-border flex items-center gap-2">
        <img src={logo} alt="Tradewise" className="h-10 w-auto" />
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Admin</span>
      </div>
      <nav className="p-3 flex-1 overflow-y-auto">
        {navItems.map((n) => {
          const active = n.exact ? path === n.to : path.startsWith(n.to);
          return (
            <Link key={n.to} to={n.to as "/admin"} onClick={onNavigate}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium mb-1 transition-colors ${active ? "bg-primary text-primary-foreground" : "text-foreground/80 hover:bg-secondary"}`}>
              <n.icon className="h-4 w-4" /> {n.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-3 border-t border-border space-y-1">
        <Link to="/" onClick={onNavigate} className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-foreground/80 hover:bg-secondary">
          <Home className="h-4 w-4" /> View store
        </Link>
        <button onClick={async () => { await signOut(); router.navigate({ to: "/login" }); }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-destructive hover:bg-destructive/10">
          <LogOut className="h-4 w-4" /> Logout
        </button>
      </div>
    </>
  );
}

function Topbar({ onMenu }: { onMenu: () => void }) {
  const { notifications, unreadCount, markAllRead, markRead, user } = useAdmin();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const fn = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  const initial = (user?.email ?? "A").charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-30 bg-card/90 backdrop-blur border-b border-border h-14 md:h-16 px-3 md:px-6 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <button onClick={onMenu} className="lg:hidden h-10 w-10 inline-flex items-center justify-center rounded-md hover:bg-secondary" aria-label="Menu">
          <Menu className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-base md:text-lg font-bold">Admin Dashboard</h1>
          <p className="text-[11px] text-muted-foreground hidden sm:block">Manage your Tradewise store</p>
        </div>
      </div>
      <div className="flex items-center gap-2" ref={ref}>
        <div className="relative">
          <button onClick={() => setOpen((o) => !o)}
            className="relative h-10 w-10 inline-flex items-center justify-center rounded-md hover:bg-secondary" aria-label="Notifications">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 h-5 min-w-5 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>
          {open && (
            <div className="absolute right-0 mt-2 w-80 max-w-[90vw] bg-card border border-border rounded-lg shadow-elegant overflow-hidden z-50 animate-fade-up">
              <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                <h3 className="font-semibold text-sm">Notifications</h3>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="text-xs text-primary font-medium hover:underline">Mark all read</button>
                )}
              </div>
              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 && (
                  <p className="p-6 text-center text-sm text-muted-foreground">No notifications yet</p>
                )}
                {notifications.map((n) => (
                  <button key={n.id} onClick={() => markRead(n.id)}
                    className={`w-full text-left px-4 py-3 border-b border-border last:border-0 hover:bg-secondary/40 ${!n.read ? "bg-primary/5" : ""}`}>
                    <div className="flex items-start gap-2">
                      {!n.read && <span className="mt-1.5 h-2 w-2 rounded-full bg-primary shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{n.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{n.body}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">{new Date(n.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="h-9 w-9 rounded-full bg-gradient-brand text-white flex items-center justify-center font-bold text-sm">{initial}</div>
      </div>
    </header>
  );
}
