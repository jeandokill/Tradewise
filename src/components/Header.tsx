import { Link, useRouter } from "@tanstack/react-router";
import { ShoppingCart, Menu, X, LogOut, LayoutDashboard, User as UserIcon, Bell } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useCart } from "@/lib/cart";
import { useAdmin } from "@/lib/admin";
import { toast } from "sonner";
import logo from "@/assets/tradewise-logo.png";

const nav = [
  { to: "/", label: "Home" },
  { to: "/categories", label: "Categories" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
];

export function Header() {
  const { count } = useCart();
  const { user, isAdmin, signOut, notifications, unreadCount, markAllRead, markRead } = useAdmin();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setBellOpen(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  const onLogout = async () => {
    await signOut();
    setMenuOpen(false);
    toast.success("Logged out");
    router.navigate({ to: "/" });
  };

  const initial = (user?.user_metadata?.full_name as string | undefined)?.charAt(0).toUpperCase()
    ?? user?.email?.charAt(0).toUpperCase() ?? "U";

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-background/85 border-b border-border">
      <div className="container mx-auto px-4 flex items-center justify-between h-16 md:h-20">
        <Link to="/" className="flex items-center shrink-0" aria-label="Tradewise home">
          <img src={logo} alt="Tradewise" className="h-12 md:h-16 w-auto" />
        </Link>

        <nav className="hidden md:flex items-center gap-7">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors"
              activeProps={{ className: "text-primary font-semibold" }}
              activeOptions={{ exact: n.to === "/" }}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {user && (
            <div className="relative" ref={bellRef}>
              <button
                onClick={() => setBellOpen((o) => !o)}
                className="relative h-10 w-10 inline-flex items-center justify-center rounded-md hover:bg-secondary"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-5 min-w-5 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>
              {bellOpen && (
                <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-1rem)] bg-card border border-border rounded-lg shadow-elegant overflow-hidden z-50 animate-fade-up">
                  <div className="px-4 py-2.5 border-b border-border flex items-center justify-between">
                    <p className="text-sm font-semibold">Notifications</p>
                    {unreadCount > 0 && (
                      <button onClick={markAllRead} className="text-xs text-primary font-medium hover:underline">Mark all read</button>
                    )}
                  </div>
                  {notifications.length === 0 ? (
                    <p className="p-6 text-center text-xs text-muted-foreground">No notifications yet.</p>
                  ) : (
                    <ul className="max-h-96 overflow-y-auto divide-y divide-border">
                      {notifications.slice(0, 15).map((n) => (
                        <li
                          key={n.id}
                          onClick={() => !n.read && markRead(n.id)}
                          className={`p-3 cursor-pointer hover:bg-secondary/50 ${!n.read ? "bg-primary/5" : ""}`}
                        >
                          <p className="text-sm font-medium">{n.title}</p>
                          {n.body && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>}
                          <p className="text-[10px] text-muted-foreground mt-1">{new Date(n.created_at).toLocaleString()}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          )}
          {user ? (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="h-10 w-10 rounded-full bg-gradient-brand text-white flex items-center justify-center font-bold text-sm hover:opacity-90"
                aria-label="Account menu"
              >
                {initial}
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-card border border-border rounded-lg shadow-elegant overflow-hidden z-50 animate-fade-up">
                  <div className="px-4 py-3 border-b border-border">
                    <p className="text-xs text-muted-foreground">Signed in as</p>
                    <p className="text-sm font-semibold truncate">{user.email}</p>
                  </div>
                  <Link
                    to={isAdmin ? "/admin" : "/dashboard"}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-secondary"
                  >
                    <LayoutDashboard className="h-4 w-4" /> {isAdmin ? "Admin dashboard" : "My dashboard"}
                  </Link>
                  {!isAdmin && (
                    <Link to="/dashboard" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-secondary">
                      <UserIcon className="h-4 w-4" /> My orders
                    </Link>
                  )}
                  <button
                    onClick={onLogout}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 border-t border-border"
                  >
                    <LogOut className="h-4 w-4" /> Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              to="/login"
              className="hidden sm:inline-flex items-center px-4 py-2 text-sm font-medium rounded-md border border-input hover:bg-secondary transition-colors"
            >
              Login
            </Link>
          )}
          <Link
            to="/cart"
            className="relative inline-flex items-center justify-center h-10 w-10 rounded-md hover:bg-secondary transition-colors"
            aria-label="Cart"
          >
            <ShoppingCart className="h-5 w-5" />
            {count > 0 && (
              <span className="absolute -top-1 -right-1 h-5 min-w-5 px-1 rounded-full bg-accent text-accent-foreground text-xs font-bold flex items-center justify-center">
                {count}
              </span>
            )}
          </Link>
          <button
            onClick={() => setOpen(!open)}
            className="md:hidden h-10 w-10 inline-flex items-center justify-center rounded-md hover:bg-secondary"
            aria-label="Menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t border-border bg-background animate-slide-in">
          <nav className="container mx-auto px-4 py-4 flex flex-col gap-1">
            {nav.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                onClick={() => setOpen(false)}
                className="py-3 px-2 rounded-md text-sm font-medium hover:bg-secondary"
              >
                {n.label}
              </Link>
            ))}
            {user ? (
              <>
                <Link to={isAdmin ? "/admin" : "/dashboard"} onClick={() => setOpen(false)} className="py-3 px-2 rounded-md text-sm font-medium hover:bg-secondary">
                  {isAdmin ? "Admin dashboard" : "My dashboard"}
                </Link>
                <button onClick={() => { setOpen(false); onLogout(); }} className="text-left py-3 px-2 rounded-md text-sm font-medium text-destructive hover:bg-destructive/10">
                  Logout
                </button>
              </>
            ) : (
              <Link to="/login" onClick={() => setOpen(false)} className="py-3 px-2 rounded-md text-sm font-medium hover:bg-secondary">
                Login / Sign up
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
