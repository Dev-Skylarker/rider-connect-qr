import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

async function assertAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: admin role required");
}

export const listAdmins = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { data: roles, error } = await supabaseAdmin
      .from("user_roles")
      .select("id, user_id, role, created_at")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    const ids = Array.from(new Set((roles ?? []).map((r) => r.user_id)));
    const enriched: Array<{ id: string; user_id: string; role: string; created_at: string; email: string | null }> = [];
    for (const r of roles ?? []) {
      enriched.push({ id: r.id, user_id: r.user_id, role: r.role as string, created_at: r.created_at, email: null });
    }
    // Fetch emails individually (admin API)
    await Promise.all(
      ids.map(async (uid) => {
        const { data } = await supabaseAdmin.auth.admin.getUserById(uid);
        const email = data.user?.email ?? null;
        enriched.filter((e) => e.user_id === uid).forEach((e) => (e.email = email));
      })
    );
    return enriched;
  });

export const grantRoleByEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        email: z.string().email(),
        role: z.enum(["admin", "support"]),
      })
      .parse(input)
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    // Find user by email via admin listUsers (simple paginated scan — fine at small scale)
    let target: { id: string; email: string | null } | null = null;
    for (let page = 1; page <= 20; page++) {
      const { data: list, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 200 });
      if (error) throw new Error(error.message);
      const found = list.users.find((u) => u.email?.toLowerCase() === data.email.toLowerCase());
      if (found) { target = { id: found.id, email: found.email ?? null }; break; }
      if (list.users.length < 200) break;
    }
    if (!target) throw new Error(`No user found for ${data.email}`);
    const { error: insErr } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: target.id, role: data.role });
    if (insErr && !insErr.message.includes("duplicate")) throw new Error(insErr.message);
    return { ok: true, user_id: target.id, email: target.email };
  });

export const revokeRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    // Prevent removing the last admin
    const { data: target } = await supabaseAdmin.from("user_roles").select("role,user_id").eq("id", data.id).maybeSingle();
    if (!target) throw new Error("Role not found");
    if (target.role === "admin") {
      const { count } = await supabaseAdmin.from("user_roles").select("id", { count: "exact", head: true }).eq("role", "admin");
      if ((count ?? 0) <= 1) throw new Error("Cannot remove the last admin");
      if (target.user_id === context.userId) throw new Error("You cannot remove your own admin role");
    }
    const { error } = await supabaseAdmin.from("user_roles").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
