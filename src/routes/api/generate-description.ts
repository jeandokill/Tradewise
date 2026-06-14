import { createFileRoute } from "@tanstack/react-router";

type Body = {
  name?: string;
  category?: string;
  kind?: "car" | "part" | "generic";
  imageUrl?: string;
  imageBase64?: string; // data URL (data:image/png;base64,...) or raw base64
};

export const Route = createFileRoute("/api/generate-description")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as Body;
        const { name = "", category = "", kind = "part", imageUrl, imageBase64 } = body;

        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const sys =
          "You are a concise, persuasive e-commerce copywriter. Write 2-4 sentences. No emojis. Plain prose.";
        const promptText =
          kind === "car"
            ? `Write a vivid product description for an electric vehicle${name ? ` called "${name}"` : ""}${category ? ` (${category})` : ""}. ${imageUrl || imageBase64 ? "Use the attached image to describe what the vehicle looks like and infer body style, color, and standout visual features." : ""} Highlight range/driving experience and one standout feature.`
            : kind === "part"
            ? `Write a vivid product description for an auto spare part${name ? ` called "${name}"` : ""}${category ? ` in the "${category}" category` : ""}. ${imageUrl || imageBase64 ? "Use the attached image to describe what the part looks like and infer material, finish, and notable design details." : ""} Mention build quality, compatibility, and one key benefit.`
            : `Write a vivid product/category description${name ? ` for "${name}"` : ""}${category ? ` (${category})` : ""}. ${imageUrl || imageBase64 ? "Analyze the attached image carefully — identify exactly what it shows (product type, materials, colors, style, standout visual details) and describe it accurately. Do not assume it is a car or auto part unless the image clearly shows one." : "Keep the tone inviting and concrete."} Highlight what makes it appealing to a shopper.`;

        // Build multimodal content
        const content: Array<Record<string, unknown>> = [{ type: "text", text: promptText }];
        let imgUrl: string | undefined;
        if (imageBase64) {
          imgUrl = imageBase64.startsWith("data:")
            ? imageBase64
            : `data:image/jpeg;base64,${imageBase64}`;
        } else if (imageUrl) {
          imgUrl = imageUrl;
        }
        if (imgUrl) content.push({ type: "image_url", image_url: { url: imgUrl } });

        const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${key}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              { role: "system", content: sys },
              { role: "user", content },
            ],
          }),
        });

        if (!res.ok) {
          const text = await res.text().catch(() => "");
          return new Response(text || "AI request failed", { status: res.status });
        }
        const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
        const description = data.choices?.[0]?.message?.content?.trim() ?? "";
        return new Response(JSON.stringify({ description }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});
