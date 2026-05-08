## Admin Dashboard Plan

Build a secure `/admin` area in the same app, gated by a proper roles system, that lets admins manage riders, edit profiles on their behalf, fulfill merch/QR orders, manually confirm payments, and view platform metrics.

### 1. Roles & security (DB)

New migration:
- `app_role` enum: `admin`, `support`, `user`
- `user_roles` table: `id`, `user_id (uuid)`, `role (app_role)`, `created_at`, unique `(user_id, role)`
- `has_role(_user_id uuid, _role app_role)` SECURITY DEFINER function
- `is_admin(_user_id uuid)` helper (admin OR support, configurable)
- Enable RLS on `user_roles`:
  - Users can read their own roles
  - Only admins can insert/update/delete roles
- Extend RLS on existing tables so admins bypass owner-only restrictions:
  - `profiles`: add admin SELECT/UPDATE/DELETE policies via `has_role(auth.uid(), 'admin')`
  - `payment_methods`: admin ALL policy
  - `merch_orders`: admin ALL policy + add fulfillment columns: `paid_at`, `printed_at`, `shipped_at`, `tracking_note`, `confirmed_by (uuid)`
- Seed: instructions to promote first admin manually via SQL (one-time insert into `user_roles`)

### 2. Auth gating (frontend)

- `src/routes/_admin.tsx` pathless layout route:
  - `beforeLoad`: ensure session exists, then call a server fn `requireAdmin()` that uses `requireSupabaseAuth` middleware + checks `has_role`. Redirects non-admins to `/dashboard`.
  - Renders admin shell (sidebar + header + `<Outlet />`)
- All admin pages live under `src/routes/_admin/admin.*.tsx`

### 3. Admin pages

```
/admin                       Overview (metrics)
/admin/riders                Riders list + search/filter
/admin/riders/$id            Rider detail: edit profile, payment methods, status, regenerate qr_slug
/admin/orders                Merch orders queue (pending → paid → printed → shipped)
/admin/orders/$id            Order detail: confirm payment, mark printed/shipped, link to rider
/admin/roles                 Manage admins (list user_roles, promote/demote by email)
```

**Overview metrics** (single aggregated server fn):
- Total riders, active profiles, draft, pending_payment
- Orders by status, revenue (sum amount_kes of paid)
- Signups last 7/30 days (chart)
- Recent activity feed

**Riders page**:
- Paginated table (50/page), search by name/phone/plate/slug, filter by status
- Row actions: View, Edit, Suspend (set status=`suspended`), Activate, Open public QR page

**Rider detail**:
- Reuse the same form schema as `/profile/create` but in admin mode (admin can edit any rider)
- Tabs: Profile · Payment Methods · Orders · QR · Danger zone (suspend/delete)
- "Regenerate QR slug" button (creates new uuid, invalidates old sticker)

**Orders page**:
- Kanban-style or table grouped by status
- Bulk actions: mark printed, mark shipped
- "Manually confirm payment" → sets `status='paid'`, `paid_at=now()`, `confirmed_by=admin.id`, and if linked profile is `pending_payment` → flips to `active`

**Roles page**:
- List current admins/support
- Add by email (server fn looks up `auth.users` via admin client, inserts into `user_roles`)
- Remove role (cannot remove last admin)

### 4. Server functions

All in `src/lib/admin.functions.ts`, each chained `.middleware([requireSupabaseAuth])` + internal admin check:
- `requireAdmin()` — guard helper
- `getAdminMetrics()`
- `listRiders({ search, status, page })`
- `getRider(id)`
- `updateRider(id, patch)` / `setRiderStatus(id, status)` / `regenerateQrSlug(id)`
- `listOrders({ status, page })`
- `confirmOrderPayment(orderId)` — atomic: update order + activate profile
- `updateOrderFulfillment(orderId, { printed_at?, shipped_at?, tracking_note? })`
- `listAdmins()` / `grantRole(email, role)` / `revokeRole(userId, role)`

Privileged lookups (e.g., email → user_id) use `supabaseAdmin` from `client.server` inside the handler only after `has_role` check passes.

### 5. Navigation & UX

- `SiteHeader`: when current user has admin role (resolved via a small `useIsAdmin` hook calling a cached server fn), show "Admin" link
- Admin shell uses shadcn `Sidebar` (collapsible icon mode) with sections: Overview, Riders, Orders, Roles
- Reuse existing design tokens (orange primary, lime accent); add subtle "Admin" badge in header

### 6. Files to add/change

New:
- `supabase/migrations/<ts>_admin_roles.sql`
- `src/lib/admin.functions.ts`
- `src/hooks/use-is-admin.ts`
- `src/components/AdminSidebar.tsx`
- `src/routes/_admin.tsx`
- `src/routes/_admin/admin.index.tsx`
- `src/routes/_admin/admin.riders.tsx`
- `src/routes/_admin/admin.riders.$id.tsx`
- `src/routes/_admin/admin.orders.tsx`
- `src/routes/_admin/admin.orders.$id.tsx`
- `src/routes/_admin/admin.roles.tsx`

Edit:
- `src/components/SiteHeader.tsx` (conditional Admin link)
- Existing migrations untouched; new migration adds policies

### 7. Out of scope (this round)

- Lipana webhook integration (manual confirm covers it for now)
- Audit log table (can be added later; for now `confirmed_by` on orders is the trail)
- Email notifications to riders on status changes

After approval I'll run the migration first, then implement server fns and pages, then wire navigation.
