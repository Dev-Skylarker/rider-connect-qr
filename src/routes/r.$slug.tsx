import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Copy, Phone, MessageCircle, Sparkles, MapPin, Truck, Star, Check, ArrowRight } from "lucide-react";
import { toast } from "sonner";

type Profile = {
  id: string; full_name: string | null; display_name: string | null; phone: string | null;
  vehicle_type: string | null; plate_number: string | null; route: string | null; city: string | null;
  photo_url: string | null; bio: string | null; status: string;
};
type PM = {
  id: string; method_type: "mpesa" | "till" | "paybill" | "bank"; label: string | null;
  account_name: string | null; account_number: string | null; paybill_number: string | null; is_primary: boolean;
};

export const Route = createFileRoute("/r/$slug")({
  component: PublicQR,
});

function PublicQR() {
  const { slug } = Route.useParams();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [methods, setMethods] = useState<PM[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: p } = await supabase
        .from("profiles")
        .select("id, full_name, display_name, phone, vehicle_type, plate_number, route, city, photo_url, bio, status")
        .eq("qr_slug", slug)
        .eq("status", "active")
        .maybeSingle();
      if (p) {
        setProfile(p as Profile);
        const { data: pms } = await supabase.from("payment_methods").select("*").eq("profile_id", p.id).order("is_primary", { ascending: false });
        setMethods((pms as PM[]) ?? []);
      }
      setLoading(false);
    })();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-gradient-to-b from-primary/5 via-background to-background text-muted-foreground">
        <div className="text-center">
          <div className="inline-block rounded-full bg-primary/10 p-4 mb-4">
            <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
          </div>
          <p>Loading rider profile…</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen grid place-items-center bg-gradient-to-b from-primary/5 via-background to-background p-6">
        <div className="max-w-md text-center">
          <div className="inline-block rounded-full bg-primary/10 p-4 mb-4">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-black mb-2">QR not active</h1>
          <p className="text-muted-foreground mb-6">This QR isn't linked to an active rider profile yet.</p>
          <Link to="/" className="inline-block">
            <Button size="lg" className="gap-2">
              Get your own QR <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const copy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    toast.success("Copied!");
    setTimeout(() => setCopied(null), 2000);
  };

  const methodTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      mpesa: "M-Pesa",
      till: "Till",
      paybill: "Paybill",
      bank: "Bank Transfer",
    };
    return labels[type] || type;
  };

  const getPaymentDisplay = (m: PM) => {
    if (m.method_type === "paybill") {
      return `Paybill ${m.paybill_number} Acc ${m.account_number}`;
    }
    return m.account_number || m.account_name || "N/A";
  };

  const riderName = profile.display_name || profile.full_name || "Rider";

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 via-background to-secondary/5">
      {/* Header with branding */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-bold text-primary">
            <div className="h-8 w-8 rounded-lg bg-primary text-primary-foreground grid place-items-center text-sm font-black">ST</div>
            <span>ScanTap</span>
          </Link>
          <div className="flex items-center gap-1 text-xs font-medium bg-secondary/10 text-secondary-foreground rounded-full px-2 py-1">
            <Check className="h-3 w-3" /> Verified
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-2xl px-4 py-6 sm:py-10">
        {/* Main card */}
        <div className="rounded-3xl bg-card border shadow-2xl overflow-hidden">
          {/* Header gradient */}
          <div className="relative h-32 sm:h-40 bg-gradient-to-r from-primary to-primary/80 overflow-hidden">
            <div className="absolute inset-0 opacity-20">
              <svg className="w-full h-full" viewBox="0 0 400 160" preserveAspectRatio="none">
                <path d="M0,80 Q100,40 200,80 T400,80 L400,160 L0,160 Z" fill="currentColor" opacity="0.1" />
              </svg>
            </div>
          </div>

          {/* Profile info */}
          <div className="px-6 sm:px-8 pb-8">
            {/* Profile picture */}
            <div className="flex flex-col items-center -mt-20 mb-6 relative z-10">
              <div className="h-32 w-32 sm:h-40 sm:w-40 rounded-full bg-card border-4 border-primary shadow-xl overflow-hidden">
                {profile.photo_url ? (
                  <img src={profile.photo_url} alt={riderName} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-primary to-primary/80 grid place-items-center text-primary-foreground">
                    <div className="text-6xl font-black">{riderName.charAt(0).toUpperCase()}</div>
                  </div>
                )}
              </div>

              {/* Name and role */}
              <h1 className="mt-6 text-3xl sm:text-4xl font-black text-center">{riderName}</h1>
              <div className="mt-2 flex items-center justify-center gap-2 text-sm text-muted-foreground font-medium">
                {profile.vehicle_type && <span>{profile.vehicle_type}</span>}
                {profile.plate_number && (
                  <>
                    <span className="text-primary">·</span>
                    <span className="font-bold text-primary">{profile.plate_number}</span>
                  </>
                )}
              </div>
            </div>

            {/* Route and location info */}
            <div className="grid grid-cols-2 gap-4 mb-8 px-0 sm:px-2">
              {profile.route && (
                <div className="rounded-xl bg-primary/5 border border-primary/10 p-4 text-center">
                  <div className="text-xs font-semibold text-muted-foreground mb-1">Route</div>
                  <div className="font-bold text-primary">{profile.route}</div>
                </div>
              )}
              {profile.city && (
                <div className="rounded-xl bg-secondary/5 border border-secondary/10 p-4 text-center">
                  <div className="text-xs font-semibold text-muted-foreground mb-1">City</div>
                  <div className="font-bold text-secondary-foreground">{profile.city}</div>
                </div>
              )}
            </div>

            {/* Bio */}
            {profile.bio && (
              <p className="text-center text-muted-foreground mb-8 leading-relaxed italic">
                "{profile.bio}"
              </p>
            )}

            {/* Payment methods section */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Truck className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-bold">Payment Methods</h2>
              </div>

              {methods.length === 0 ? (
                <div className="rounded-xl border-2 border-dashed bg-muted/20 p-8 text-center">
                  <p className="text-sm text-muted-foreground">No payment methods added yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {methods.map((m, idx) => (
                    <button
                      key={m.id}
                      onClick={() => copy(getPaymentDisplay(m), m.id)}
                      className="w-full group relative rounded-xl border bg-gradient-to-br from-card via-card to-muted/10 p-4 hover:border-primary/50 hover:shadow-lg transition-all duration-300 text-left"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-bold text-primary">{methodTypeLabel(m.method_type)}</span>
                            {m.is_primary && (
                              <span className="text-xs font-bold bg-secondary text-secondary-foreground rounded-full px-2 py-0.5 flex items-center gap-1">
                                <Star className="h-3 w-3 fill-current" /> PRIMARY
                              </span>
                            )}
                          </div>
                          <div className="font-mono font-semibold text-foreground">{getPaymentDisplay(m)}</div>
                          {m.account_name && <div className="text-xs text-muted-foreground mt-1">{m.account_name}</div>}
                        </div>
                        <div className="ml-4 flex-shrink-0">
                          {copied === m.id ? (
                            <div className="rounded-lg bg-green-500/10 text-green-600 p-2">
                              <Check className="h-5 w-5" />
                            </div>
                          ) : (
                            <div className="rounded-lg bg-primary/10 text-primary p-2 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                              <Copy className="h-5 w-5" />
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Quick actions */}
            {profile.phone && (
              <div className="grid grid-cols-2 gap-3">
                <a href={`tel:${profile.phone}`}>
                  <Button variant="outline" className="w-full h-12 font-semibold gap-2 hover:border-primary hover:text-primary">
                    <Phone className="h-5 w-5" />
                    <span>Call</span>
                  </Button>
                </a>
                <a href={`https://wa.me/${profile.phone.replace(/\D/g, "")}`}>
                  <Button variant="outline" className="w-full h-12 font-semibold gap-2 hover:border-secondary hover:text-secondary-foreground">
                    <MessageCircle className="h-5 w-5" />
                    <span>WhatsApp</span>
                  </Button>
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Additional info cards */}
        <div className="mt-8 grid sm:grid-cols-2 gap-4">
          <div className="rounded-2xl border bg-card p-6">
            <div className="inline-flex items-center justify-center h-10 w-10 rounded-lg bg-primary/10 mb-3">
              <MapPin className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-bold mb-1">Verified Rider</h3>
            <p className="text-sm text-muted-foreground">This profile is verified on ScanTap. Plate number and details have been confirmed.</p>
          </div>

          <div className="rounded-2xl border bg-card p-6">
            <div className="inline-flex items-center justify-center h-10 w-10 rounded-lg bg-secondary/10 mb-3">
              <Sparkles className="h-5 w-5 text-secondary-foreground" />
            </div>
            <h3 className="font-bold mb-1">Secure Payments</h3>
            <p className="text-sm text-muted-foreground">All payments go directly to the rider. No fees, no middleman, no commission.</p>
          </div>
        </div>

        {/* CTA for non-riders */}
        <div className="mt-8 rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/10 border border-primary/20 p-8 text-center">
          <h2 className="text-2xl font-bold mb-2">Are you a rider?</h2>
          <p className="text-muted-foreground mb-6">Get your own ScanTap QR sticker and start receiving payments instantly.</p>
          <Link to="/signup">
            <Button size="lg" className="gap-2 shadow-lg">
              Get your QR sticker <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
        </div>

        {/* Footer link */}
        <div className="mt-6 text-center text-xs text-muted-foreground">
          <Link to="/contact" className="hover:text-primary transition">
            Need help? Contact support
          </Link>
        </div>
      </div>
    </div>
  );
}
