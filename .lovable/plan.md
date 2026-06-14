# Tradewise — Real Backend Integration Plan

This converts the demo (localStorage seeded data) into a real Cloud-backed app.

## 1. Authentication (real)
- Enable email/password signup + login on `/login` and add `/signup`.
- Add **Continue with Google** button (managed Google OAuth via Lovable Cloud — no setup needed).
- Add `profiles` table (auto-created on signup via trigger) and a `user_roles` table with `admin` role.
- Admin access: the email `admin@tradewise.rw` is auto-granted the `admin` role on signup. Anyone with that role can access `/admin`.
- `_authenticated` + `_admin` route guards using TanStack `beforeLoad`.
- Disable email confirmation (so demo signup works immediately).

## 2. Database schema
New tables (all with RLS + GRANTs):
- `profiles` (user_id, full_name, avatar_url)
- `user_roles` (user_id, role) + `has_role()` security-definer function
- `categories` (name, slug, description, image_url)
- `products` (category_id, name, slug, description, price, stock, image_url, is_vehicle, is_featured, is_new)
- `hero_slides` (image_url, title, subtitle, cta_label, cta_link, sort_order, active)
- `orders` (user_id, total, status, items_count, shipping_address, payment_method)
- `order_items` (order_id, product_id, qty, price)
- `notifications` (user_id NULL=admin-broadcast, title, body, read, type, link)

Storage bucket `product-images` (public read) for uploaded images.

## 3. Admin dashboard — real CRUD
Replace `src/lib/admin.tsx` localStorage with Supabase queries (via server fns or direct client w/ RLS).
- **Hero**: create/edit/delete/reorder/toggle slides; upload image from PC or paste URL.
- **Categories**: full CRUD with image upload.
- **Products**: full CRUD; pick category; image upload; toggle vehicle/featured/new.
- **Orders**: list real orders, filter, change status (admin only).
- **Users**: list from `profiles`.
- **Settings**: store name etc. (kept local for now).

## 4. AI description generator (real, image-aware)
- Server fn `generateDescription` using Lovable AI Gateway (`google/gemini-2.5-flash-image` for vision).
- Accepts: image (URL or base64 uploaded from PC) + product name + type (vehicle/part).
- Returns generated description text.
- Available in admin product editor AND on public product/part detail pages ("Generate with AI" button).

## 5. Overview metrics — real, zero-start
- All KPIs (total orders, revenue, signups, products) computed from DB → start at 0.
- Charts (revenue/orders/users) built from real `orders` + `profiles` rows over last 14 days.
- Order status pie chart from real `orders.status`.
- Refresh on mount + on realtime change.

## 6. Realtime notifications bell
- Enable realtime on `notifications` table.
- Bell subscribes to inserts where `user_id IS NULL` (admin broadcast) or matches current user.
- Unread badge updates live; click row → mark read; "Mark all read" button.
- DB trigger: on new `orders` insert → insert notification "New order …". On new `auth.users` (via profiles trigger) → "New signup …".

## 7. Public site changes
- Homepage hero, categories, featured products read from DB (fall back to empty state if nothing seeded).
- Cart checkout → inserts real `orders` row when user is logged in (guests can still checkout demo-style).
- Product/category pages query DB.

## Technical notes
- All sensitive ops (admin writes, AI gen) use `createServerFn` with `requireSupabaseAuth` + role check.
- Image uploads: client → Supabase Storage `product-images` bucket → store public URL.
- `attachSupabaseAuth` wired in `src/start.ts` for bearer forwarding.
- Google OAuth via `supabase--configure_social_auth` (`providers: ["google"]`).
- All new public-schema tables get explicit GRANTs.

## Scope note
This is a large change touching ~25 files and a major migration. After approval I'll execute it in one pass: migration → auth → admin CRUD → AI → metrics → realtime. Expect a single long build.

Confirm to proceed.