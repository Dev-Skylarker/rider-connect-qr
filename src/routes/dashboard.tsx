import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { QRCodeSVG } from "qrcode.react";
import { Copy, ExternalLink, CheckCircle2, AlertCircle, Sparkles, Truck, FileQuestion } from "lucide-react";
import { toast } from "sonner";

type Profile = {
  id: string;
  full_name: string | null;
  display_name: string | null;
  phone: string | null;
  vehicle_type: string | null;
  plate_number: string | null;
  route: string | null;
  city: string | null;
  status: "draft" | "pending_payment" | "active" | "suspended";
  qr_slug: string;
  photo_url: string | null;
};

export const Route = createFileRoute("/dashboard")({ component: Dashboard });

function Dashboard() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) nav({ to: "/login", search: { redirect: "/dashboard" } });
  }, [loading, user, nav]);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle().then(({ data }) => {
      setProfile(data as Profile | null);
      setFetching(false);
    });
  }, [user]);

  if (loading || fetching) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="container mx-auto px-4 py-16 text-muted-foreground">Loading…</div>
      </div>
    );
  }

  const isComplete =
    profile && profile.full_name && profile.phone && profile.plate_number && profile.vehicle_type && profile.route;
  const isActive = profile?.status === "active";

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="container mx-auto px-4 py-10 max-w-5xl">
        {!isActive ? <OnboardingView profile={profile} isComplete={!!isComplete} /> : <ActiveView profile={profile!} />}
      </div>
      <SiteFooter />
    </div>
  );
}

function OnboardingView({ profile, isComplete }: { profile: Profile | null; isComplete: boolean }) {
  const status = profile?.status;
  return (
    <>
      <div className="rounded-3xl bg-primary text-primary-foreground p-8 md:p-10">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary-foreground/15 px-3 py-1 text-xs font-bold">
          <Sparkles className="h-3.5 w-3.5" /> {status === "pending_payment" ? "Awaiting payment confirmation" : "Welcome to ScanTap"}
        </div>
        <h1 className="mt-3 text-3xl md:text-4xl font-black">
          {status === "pending_payment" ? "Your QR is being prepared" : "Let's get your QR live"}
        </h1>
        <p className="mt-2 max-w-xl opacity-90">
          {status === "pending_payment"
            ? "We've received your order. Once your sticker ships and your profile is activated, you'll see your live QR here."
            : "Complete your profile and order your sticker. Customers scan it to pay you directly — no commission, ever."}
        </p>
        <div className="mt-5">
          <Link to="/profile/create">
            <Button size="lg" variant="secondary">
              {isComplete ? "Review & order QR" : "Create my profile"}
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mt-8">
        {[
          { icon: FileQuestion, t: "Why a profile?", b: "It's the page customers see when they scan. Your name, plate, route, and pay numbers — all in one place." },
          { icon: Truck, t: "About the merch", b: "A weatherproof QR sticker built for Kenyan roads. One-time fee covers production and delivery." },
          { icon: CheckCircle2, t: "What happens after?", b: "Once payment is confirmed, your QR goes live. Customers can scan it instantly." },
        ].map((c, i) => (
          <div key={i} className="rounded-2xl border bg-card p-5">
            <c.icon className="h-7 w-7 text-primary" />
            <div className="mt-3 font-semibold">{c.t}</div>
            <p className="mt-1 text-sm text-muted-foreground">{c.b}</p>
          </div>
        ))}
      </div>

      <div className="mt-10">
        <h2 className="text-2xl font-bold">Steps</h2>
        <ol className="mt-4 space-y-3">
          {[
            ["Sign up", true],
            ["Create your profile", !!profile?.full_name],
            ["Order your QR sticker", status === "pending_payment" || status === "active"],
            ["Get activated", status === "active"],
          ].map(([t, done], i) => (
            <li key={i} className="flex items-center gap-3 rounded-xl border bg-card p-4">
              {done ? <CheckCircle2 className="h-5 w-5 text-secondary-foreground" /> : <AlertCircle className="h-5 w-5 text-muted-foreground" />}
              <span className={done ? "" : "text-muted-foreground"}>{t}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-10">
        <h2 className="text-2xl font-bold">FAQs</h2>
        <div className="mt-4 space-y-3">
          {[
            ["How much does the sticker cost?", "KES 500 — one-time fee covering production and delivery anywhere in Kenya."],
            ["Will ScanTap take a cut of my fares?", "Never. Customers pay you directly through your wallet."],
            ["Can I update my number later?", "Yes — anytime, from this dashboard. The QR stays the same."],
          ].map(([q, a], i) => (
            <div key={i} className="rounded-xl border bg-card p-4">
              <div className="font-semibold">{q}</div>
              <p className="mt-1 text-sm text-muted-foreground">{a}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function ActiveView({ profile }: { profile: Profile }) {
  const url = typeof window !== "undefined" ? `${window.location.origin}/r/${profile.qr_slug}` : `/r/${profile.qr_slug}`;
  return (
    <div className="grid md:grid-cols-3 gap-6">
      <div className="md:col-span-2 rounded-2xl border bg-card p-6">
        <div className="flex items-center gap-2 text-secondary-foreground bg-secondary inline-flex rounded-full px-3 py-1 text-xs font-bold w-fit">
          <CheckCircle2 className="h-3.5 w-3.5" /> Active
        </div>
        <h1 className="mt-3 text-3xl font-bold">{profile.display_name || profile.full_name}</h1>
        <p className="text-muted-foreground">{profile.vehicle_type} · {profile.plate_number} · {profile.route}</p>

        <div className="mt-6 grid sm:grid-cols-2 gap-3">
          <Link to="/profile/create"><Button variant="outline" className="w-full">Edit profile</Button></Link>
          <a href={url} target="_blank" rel="noreferrer">
            <Button variant="secondary" className="w-full"><ExternalLink className="h-4 w-4 mr-2" />View public page</Button>
          </a>
        </div>

        <div className="mt-6 rounded-xl border p-4 bg-muted/40">
          <div className="text-xs text-muted-foreground">Public link</div>
          <div className="flex items-center gap-2 mt-1">
            <code className="text-sm break-all">{url}</code>
            <Button size="sm" variant="ghost" onClick={() => { navigator.clipboard.writeText(url); toast.success("Copied"); }}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-primary text-primary-foreground p-6 text-center">
        <div className="text-sm font-bold opacity-80">YOUR QR</div>
        <div className="mt-3 rounded-xl bg-accent p-3">
          <div className="bg-white rounded-md p-3 grid place-items-center">
            <QRCodeSVG value={url} size={180} />
          </div>
        </div>
        <div className="mt-3 italic font-semibold">for rider profile</div>
      </div>
    </div>
  );
}
