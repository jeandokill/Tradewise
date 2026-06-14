import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type Notif = {
  id: string;
  title: string;
  body: string | null;
  type: string;
  link: string | null;
  read: boolean;
  created_at: string;
};

type AuthCtx = {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  loading: boolean;
  roleLoading: boolean;
  signOut: () => Promise<void>;

  notifications: Notif[];
  unreadCount: number;
  markAllRead: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  refreshNotifications: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AdminProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [roleLoading, setRoleLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notif[]>([]);

  const refreshNotifications = useCallback(async () => {
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    setNotifications((data ?? []) as Notif[]);
  }, []);

  const checkRole = useCallback(async (uid: string) => {
    setRoleLoading(true);
    const { data } = await supabase.rpc("has_role", { _user_id: uid, _role: "admin" });
    setIsAdmin(Boolean(data));
    setRoleLoading(false);
  }, []);

  useEffect(() => {
    let currentUid: string | null = null;

    // Listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange((evt, sess) => {
      setSession(sess);
      setUser(sess?.user ?? null);
      const nextUid = sess?.user?.id ?? null;
      // Noisy events that fire on tab focus / token refresh — don't re-check role
      if (evt === "TOKEN_REFRESHED" || evt === "INITIAL_SESSION") return;
      if (nextUid && nextUid !== currentUid) {
        currentUid = nextUid;
        setRoleLoading(true);
        setTimeout(() => { checkRole(nextUid); refreshNotifications(); }, 0);
      } else if (!nextUid) {
        currentUid = null;
        setIsAdmin(false);
        setRoleLoading(false);
        setNotifications([]);
      }
    });

    // Then hydrate existing session
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      if (data.session?.user) {
        currentUid = data.session.user.id;
        checkRole(data.session.user.id);
        refreshNotifications();
      } else {
        setRoleLoading(false);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [checkRole, refreshNotifications]);

  // Realtime notifications
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("notifications-bell")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        () => { refreshNotifications(); },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "notifications" },
        () => { refreshNotifications(); },
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, refreshNotifications]);

  const signOut = async () => { await supabase.auth.signOut(); };

  const markAllRead = async () => {
    const ids = notifications.filter((n) => !n.read).map((n) => n.id);
    if (ids.length === 0) return;
    await supabase.from("notifications").update({ read: true }).in("id", ids);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };
  const markRead = async (id: string) => {
    await supabase.from("notifications").update({ read: true }).eq("id", id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  return (
    <Ctx.Provider value={{ user, session, isAdmin, loading, roleLoading, signOut, notifications, unreadCount, markAllRead, markRead, refreshNotifications }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAdmin() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAdmin outside AdminProvider");
  return c;
}
