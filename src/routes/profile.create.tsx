import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Trash2, Plus } from "lucide-react";

export const Route = createFileRoute("/profile/create")({ component: CreateProfile });

type PM = {
  id?: string;
  method_type: "mpesa" | "till" | "paybill" | "bank";
  label: string;
  account_name: string;
  account_number: string;
  paybill_number: string;
  is_primary: boolean;
};

const emptyPM = (): PM => ({ method_type: "mpesa", label: "", account_name: "", account_number: "", paybill_number: "", is_primary: false });

const profileSchema = z.object({
  full_name: z.string().trim().min(2).max(80),
  display_name: z.string().trim().max(60).optional().or(z.literal("")),
  phone: z.string().trim().regex(/^\+?\d{9,15}$/, "Enter a valid phone"),
  vehicle_type: z.string().min(2).max(40),
  plate_number: z.string().trim().min(3).max(20),
  route: z.string().trim().min(2).max(100),
  city: z.string().trim().min(2).max(60),
  bio: z.string().max(280).optional().or(z.literal("")),
});

function CreateProfile() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const [data, setData] = useState({
    full_name: "", display_name: "", phone: "", vehicle_type: "Boda", plate_number: "", route: "", city: "Nairobi", bio: "",
  });
  const [methods, setMethods] = useState<PM[]>([{ ...emptyPM(), is_primary: true }]);
  const [step, setStep] = useState<"form" | "review">("form");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && !user) nav({ to: "/login", search: { redirect: "/profile/create" } });
  }, [loading, user, nav]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: p } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      if (p) {
        setData({
          full_name: p.full_name ?? "", display_name: p.display_name ?? "", phone: p.phone ?? "",
          vehicle_type: p.vehicle_type ?? "Boda", plate_number: p.plate_number ?? "",
          route: p.route ?? "", city: p.city ?? "Nairobi", bio: p.bio ?? "",
        });
      }
      const { data: pms } = await supabase.from("payment_methods").select("*").eq("profile_id", user.id);
      if (pms && pms.length) {
        setMethods(pms.map((m) => ({
          id: m.id, method_type: m.method_type as PM["method_type"], label: m.label ?? "",
          account_name: m.account_name ?? "", account_number: m.account_number ?? "",
          paybill_number: m.paybill_number ?? "", is_primary: m.is_primary,
        })));
      }
    })();
  }, [user]);

  function setPM(i: number, patch: Partial<PM>) {
    setMethods((arr) => arr.map((m, idx) => (idx === i ? { ...m, ...patch } : patch.is_primary ? { ...m, is_primary: false } : m)));
  }

  function validateAndReview() {
    const parsed = profileSchema.safeParse(data);
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    if (methods.length === 0) return toast.error("Add at least one payment method");
    if (!methods.some((m) => m.is_primary)) return toast.error("Mark one payment method as primary");
    for (const m of methods) {
      if (!m.account_number && m.method_type !== "paybill") return toast.error("Each payment method needs an account/till number");
      if (m.method_type === "paybill" && !m.paybill_number) return toast.error("Paybill needs a paybill number");
    }
    setStep("review");
  }

  async function saveAndPay() {
    if (!user) return;
    setSaving(true);
    // Upsert profile, mark pending_payment (no real Lipana yet — DB-only)
    const { error: pErr } = await supabase.from("profiles").update({
      full_name: data.full_name, display_name: data.display_name || null,
      phone: data.phone, vehicle_type: data.vehicle_type, plate_number: data.plate_number,
      route: data.route, city: data.city, bio: data.bio || null, status: "pending_payment",
    }).eq("id", user.id);
    if (pErr) { setSaving(false); return toast.error(pErr.message); }

    // Replace payment methods
    await supabase.from("payment_methods").delete().eq("profile_id", user.id);
    const insert = methods.map((m) => ({
      profile_id: user.id, method_type: m.method_type, label: m.label || null,
      account_name: m.account_name || null, account_number: m.account_number || null,
      paybill_number: m.paybill_number || null, is_primary: m.is_primary,
    }));
    const { error: mErr } = await supabase.from("payment_methods").insert(insert);
    if (mErr) { setSaving(false); return toast.error(mErr.message); }

    // Create merch order (pending — Lipana integration coming later)
    const { error: oErr } = await supabase.from("merch_orders").insert({ profile_id: user.id, amount_kes: 500, status: "pending" });
    if (oErr) { setSaving(false); return toast.error(oErr.message); }

    setSaving(false);
    toast.success("Profile saved. Order placed — payment integration coming soon.");
    nav({ to: "/dashboard" });
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="container mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-3xl font-bold">{step === "form" ? "Your rider profile" : "Review & order"}</h1>
        <p className="text-muted-foreground mt-1">
          {step === "form" ? "These details show on your public scan page." : "Confirm everything looks right, then place your QR sticker order."}
        </p>

        {step === "form" ? (
          <div className="mt-8 space-y-6">
            <section className="rounded-2xl border bg-card p-6 space-y-4">
              <h2 className="font-semibold">About you</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div><Label>Full name *</Label><Input value={data.full_name} onChange={(e) => setData({ ...data, full_name: e.target.value })} maxLength={80} /></div>
                <div><Label>Display name</Label><Input value={data.display_name} onChange={(e) => setData({ ...data, display_name: e.target.value })} maxLength={60} /></div>
                <div><Label>Phone *</Label><Input value={data.phone} onChange={(e) => setData({ ...data, phone: e.target.value })} placeholder="+2547…" /></div>
                <div><Label>City *</Label><Input value={data.city} onChange={(e) => setData({ ...data, city: e.target.value })} maxLength={60} /></div>
              </div>
              <div><Label>Short bio</Label><Textarea value={data.bio} onChange={(e) => setData({ ...data, bio: e.target.value })} maxLength={280} placeholder="Friendly, on time, knows every shortcut in town." /></div>
            </section>

            <section className="rounded-2xl border bg-card p-6 space-y-4">
              <h2 className="font-semibold">Your ride</h2>
              <div className="grid sm:grid-cols-3 gap-4">
                <div><Label>Vehicle type *</Label>
                  <Select value={data.vehicle_type} onValueChange={(v) => setData({ ...data, vehicle_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Boda">Boda (motorbike)</SelectItem>
                      <SelectItem value="Tuktuk">Tuktuk</SelectItem>
                      <SelectItem value="Taxi">Taxi</SelectItem>
                      <SelectItem value="Matatu">Matatu</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Plate number *</Label><Input value={data.plate_number} onChange={(e) => setData({ ...data, plate_number: e.target.value.toUpperCase() })} maxLength={20} /></div>
                <div><Label>Route *</Label><Input value={data.route} onChange={(e) => setData({ ...data, route: e.target.value })} maxLength={100} placeholder="CBD ↔ Westlands" /></div>
              </div>
            </section>

            <section className="rounded-2xl border bg-card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">Payment methods</h2>
                <Button type="button" size="sm" variant="outline" onClick={() => setMethods([...methods, emptyPM()])}><Plus className="h-4 w-4 mr-1" />Add</Button>
              </div>
              {methods.map((m, i) => (
                <div key={i} className="rounded-xl border p-4 space-y-3">
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div><Label>Type</Label>
                      <Select value={m.method_type} onValueChange={(v) => setPM(i, { method_type: v as PM["method_type"] })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mpesa">M-Pesa (phone)</SelectItem>
                          <SelectItem value="till">Till number</SelectItem>
                          <SelectItem value="paybill">Paybill</SelectItem>
                          <SelectItem value="bank">Bank</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div><Label>Label</Label><Input value={m.label} onChange={(e) => setPM(i, { label: e.target.value })} maxLength={40} placeholder="My Safaricom line" /></div>
                    <div><Label>Account name</Label><Input value={m.account_name} onChange={(e) => setPM(i, { account_name: e.target.value })} maxLength={80} /></div>
                    {m.method_type === "paybill" ? (
                      <>
                        <div><Label>Paybill</Label><Input value={m.paybill_number} onChange={(e) => setPM(i, { paybill_number: e.target.value })} maxLength={20} /></div>
                        <div className="sm:col-span-2"><Label>Account #</Label><Input value={m.account_number} onChange={(e) => setPM(i, { account_number: e.target.value })} maxLength={40} /></div>
                      </>
                    ) : (
                      <div><Label>{m.method_type === "till" ? "Till number" : m.method_type === "bank" ? "Account #" : "Phone"}</Label><Input value={m.account_number} onChange={(e) => setPM(i, { account_number: e.target.value })} maxLength={40} /></div>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-sm">
                      <input type="radio" name="primary" checked={m.is_primary} onChange={() => setPM(i, { is_primary: true })} />
                      Primary
                    </label>
                    {methods.length > 1 && (
                      <Button size="sm" variant="ghost" onClick={() => setMethods(methods.filter((_, idx) => idx !== i))}><Trash2 className="h-4 w-4" /></Button>
                    )}
                  </div>
                </div>
              ))}
            </section>

            <Button size="lg" className="w-full" onClick={validateAndReview}>Review & continue</Button>
          </div>
        ) : (
          <div className="mt-8 space-y-4">
            <div className="rounded-2xl border bg-card p-6">
              <h2 className="font-semibold">Profile</h2>
              <dl className="mt-3 grid sm:grid-cols-2 gap-3 text-sm">
                <Field k="Name" v={data.full_name} /><Field k="Phone" v={data.phone} />
                <Field k="Vehicle" v={`${data.vehicle_type} · ${data.plate_number}`} /><Field k="Route" v={data.route} />
                <Field k="City" v={data.city} />
              </dl>
            </div>
            <div className="rounded-2xl border bg-card p-6">
              <h2 className="font-semibold">Payment methods</h2>
              <ul className="mt-3 space-y-2 text-sm">
                {methods.map((m, i) => (
                  <li key={i} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <div className="font-medium capitalize">{m.method_type} {m.is_primary && <span className="ml-2 text-xs bg-secondary text-secondary-foreground rounded px-2 py-0.5">Primary</span>}</div>
                      <div className="text-muted-foreground">{m.method_type === "paybill" ? `${m.paybill_number} · ${m.account_number}` : m.account_number} {m.label && `· ${m.label}`}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl bg-primary text-primary-foreground p-6">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-sm opacity-90">QR sticker — one-time fee</div>
                  <div className="text-3xl font-black">KES 500</div>
                </div>
                <div className="text-xs opacity-80 text-right max-w-[160px]">In-app payment (Lipana) is coming soon. For now we'll save your order and follow up.</div>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setStep("form")} disabled={saving}>Back to edit</Button>
              <Button className="flex-1" onClick={saveAndPay} disabled={saving}>{saving ? "Saving…" : "Save & order QR"}</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="text-muted-foreground text-xs">{k}</dt>
      <dd className="font-medium">{v || "—"}</dd>
    </div>
  );
}
