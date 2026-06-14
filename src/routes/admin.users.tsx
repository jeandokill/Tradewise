import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/users")({
  component: UsersAdmin,
});

type Profile = {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  created_at: string;
};

function UsersAdmin() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("profiles").select("*").order("created_at", { ascending: false }).then(({ data }) => {
      setUsers((data ?? []) as Profile[]); setLoading(false);
    });
  }, []);

  const filtered = users.filter((u) =>
    (u.full_name ?? "").toLowerCase().includes(query.toLowerCase()) ||
    (u.email ?? "").toLowerCase().includes(query.toLowerCase())
  );

  if (loading) return <div className="text-sm text-muted-foreground">Loading…</div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl md:text-2xl font-bold">Users</h2>
        <p className="text-sm text-muted-foreground">{users.length} registered users</p>
      </div>
      <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name or email…"
        className="w-full max-w-md px-3 py-2 rounded-md border border-input bg-background text-sm" />
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-xs uppercase">
              <tr>
                <th className="text-left p-3">User</th>
                <th className="text-left p-3 hidden sm:table-cell">Email</th>
                <th className="text-left p-3 hidden md:table-cell">Joined</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => {
                const name = u.full_name ?? u.email ?? "User";
                const initials = name.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();
                return (
                  <tr key={u.id} className="border-t border-border hover:bg-secondary/30">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        {u.avatar_url
                          ? <img src={u.avatar_url} alt="" className="h-9 w-9 rounded-full object-cover" />
                          : <div className="h-9 w-9 rounded-full bg-gradient-brand text-white flex items-center justify-center font-bold text-xs">{initials}</div>}
                        <div>
                          <p className="font-medium">{name}</p>
                          <p className="text-xs text-muted-foreground sm:hidden">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 hidden sm:table-cell text-muted-foreground">{u.email}</td>
                    <td className="p-3 hidden md:table-cell text-xs text-muted-foreground">{new Date(u.created_at).toLocaleDateString()}</td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={3} className="p-8 text-center text-sm text-muted-foreground">No users yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
