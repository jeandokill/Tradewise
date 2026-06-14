import { createFileRoute } from "@tanstack/react-router";

const BASE_URL = "https://tradewise.rw";

interface SitemapEntry {
  path: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const entries: SitemapEntry[] = [
          { path: "/", changefreq: "weekly", priority: "1.0" },
          { path: "/about", changefreq: "monthly", priority: "0.7" },
          { path: "/contact", changefreq: "monthly", priority: "0.7" },
          { path: "/categories", changefreq: "weekly", priority: "0.9" },
          { path: "/cart", changefreq: "monthly", priority: "0.3" },
          { path: "/checkout", changefreq: "monthly", priority: "0.3" },
          { path: "/login", changefreq: "monthly", priority: "0.3" },
          { path: "/privacy", changefreq: "yearly", priority: "0.4" },
          { path: "/terms", changefreq: "yearly", priority: "0.4" },
        ];

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        // Fetch all vehicles (car categories)
        const { data: vehicles } = await supabaseAdmin
          .from("products")
          .select("id, updated_at")
          .eq("is_vehicle", true);

        for (const v of vehicles ?? []) {
          entries.push({
            path: `/categories/${v.id}`,
            lastmod: v.updated_at ? v.updated_at.split("T")[0] : undefined,
            changefreq: "weekly",
            priority: "0.8",
          });
        }

        // Fetch all parts
        const { data: parts } = await supabaseAdmin
          .from("products")
          .select("id, updated_at")
          .eq("is_vehicle", false);

        for (const p of parts ?? []) {
          entries.push({
            path: `/parts/${p.id}`,
            lastmod: p.updated_at ? p.updated_at.split("T")[0] : undefined,
            changefreq: "weekly",
            priority: "0.8",
          });
        }

        const urls = entries.map((e) =>
          [
            `  <url>`,
            `    <loc>${BASE_URL}${e.path}</loc>`,
            e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
            e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
            e.priority ? `    <priority>${e.priority}</priority>` : null,
            `  </url>`,
          ]
            .filter(Boolean)
            .join("\n"),
        );

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
