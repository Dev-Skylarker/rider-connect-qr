import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Copy, Phone, MessageCircle, Sparkles, MapPin, Truck, Star, Check, ArrowRight, Share2, FileText } from "lucide-react";
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
  const startTime = useRef(Date.now());

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
      <div className="min-h-screen grid place-items-center bg-background text-muted-foreground">
        <div className="text-center">
          <div className="inline-block rounded-full bg-primary/10 p-4 mb-4">
            <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
          </div>
          <p className="text-sm">Loading…</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen grid place-items-center bg-background p-6">
        <div className="max-w-md text-center">
          <div className="inline-block rounded-full bg-primary/10 p-4 mb-4">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-black mb-2">QR not active</h1>
          <p className="text-muted-foreground mb-6 text-sm">This QR isn't linked to an active rider profile yet.</p>
          <Link to="/" className="inline-block">
            <Button size="lg" className="gap-2 bg-primary">
              Get your own QR <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(id);
      toast.success("Copied!");
      setTimeout(() => setCopied(null), 1500);
    }).catch(() => {
      toast.error("Copy failed");
    });
  };

  const createVCard = () => {
    const vcard = `BEGIN:VCARD
VERSION:3.0
FN:${profile.display_name || profile.full_name}
TEL:${profile.phone || ""}
NOTE:${profile.vehicle_type} • ${profile.plate_number} • ${profile.route}
URL:${typeof window !== 'undefined' ? window.location.href : ''}
END:VCARD`;

    const element = document.createElement('a');
    element.setAttribute('href', `data:text/plain;charset=utf-8,${encodeURIComponent(vcard)}`);
    element.setAttribute('download', `${profile.display_name || 'rider'}.vcf`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success("Contact saved!");
  };

  const methodTypeLabel = (type: string) => {
    const labels: Record<string, string> = { mpesa: "M-Pesa", till: "Till", paybill: "Paybill", bank: "Bank" };
    return labels[type] || type;
  };

  const getPaymentDisplay = (m: PM) => {
    if (m.method_type === "paybill") return `${m.paybill_number}|${m.account_number}`;
    return m.account_number || m.account_name || "N/A";
  };

  const openMpesaApp = (m: PM) => {
    const number = getPaymentDisplay(m);
    const schemes = [
      `com.safaricom.mpesa://payment/${number}`,
      `mpesa:///${number}`,
      `https://web.safaricom.co.ke/mpesa/`
    ];

    let opened = false;
    schemes.forEach((scheme, idx) => {
      setTimeout(() => {
        if (!opened && idx === schemes.length - 1) {
          window.location.href = schemes[schemes.length - 1];
        } else if (scheme.startsWith('http')) {
          window.location.href = scheme;
        } else {
          window.location.href = scheme;
        }
      }, idx * 100);
    });
    opened = true;
  };

  const riderName = profile.display_name || profile.full_name || "Rider";
  const primaryPayment = methods.find(m => m.is_primary) || methods[0];

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky header with glassmorphism */}
      <div className="sticky top-0 z-50 backdrop-blur-md bg-background/60 border-b border-white/10 supports-[backdrop-filter]:bg-white/40">
        <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-bold text-primary">
            <div className="h-7 w-7 rounded-lg bg-primary text-white grid place-items-center text-xs font-black">ST</div>
          </Link>
          <div className="text-xs font-medium text-muted-foreground flex items-center gap-1">
            <Check className="h-3 w-3 text-accent" /> Verified
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6">
        {/* Profile card with glassmorphism */}
        <div className="rounded-3xl backdrop-blur-xl bg-white/70 border border-white/60 shadow-2xl overflow-hidden">
          <div className="relative h-32 bg-gradient-to-r from-primary to-secondary overflow-hidden">
            <div className="absolute inset-0 opacity-30">
              <svg className="w-full h-full" viewBox="0 0 300 120" preserveAspectRatio="none">
                <path d="M0,60 Q75,30 150,60 T300,60 L300,120 L0,120 Z" fill="white" opacity="0.1" />
              </svg>
            </div>
          </div>

          <div className="px-6 pb-6">
            <div className="flex flex-col items-center -mt-16 mb-4 relative z-10">
              <div className="h-28 w-28 rounded-full bg-white border-4 border-primary shadow-xl overflow-hidden">
                {profile.photo_url ? (
                  <img src={profile.photo_url} alt={riderName} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-primary to-secondary grid place-items-center text-white">
                    <span className="text-5xl font-black">{riderName.charAt(0).toUpperCase()}</span>
                  </div>
                )}
              </div>

              <h1 className="mt-4 text-2xl font-black text-center text-foreground">{riderName}</h1>
              {profile.vehicle_type && (
                <p className="text-xs text-muted-foreground font-medium mt-1">
                  {profile.vehicle_type} • <span className="text-primary font-bold">{profile.plate_number}</span>
                </p>
              )}
            </div>

            {(profile.route || profile.city) && (
              <div className="grid grid-cols-2 gap-2 mb-5 text-center text-xs">
                {profile.route && (
                  <div className="rounded-lg bg-primary/8 border border-primary/15 py-2 px-2">
                    <div className="text-muted-foreground font-medium mb-0.5">Route</div>
                    <div className="font-bold text-foreground">{profile.route}</div>
                  </div>
                )}
                {profile.city && (
                  <div className="rounded-lg bg-accent/8 border border-accent/15 py-2 px-2">
                    <div className="text-muted-foreground font-medium mb-0.5">City</div>
                    <div className="font-bold text-foreground">{profile.city}</div>
                  </div>
                )}
              </div>
            )}

            {profile.bio && <p className="text-center text-xs text-muted-foreground mb-5 leading-relaxed italic">"{profile.bio}"</p>}

            {/* Primary action: Copy M-Pesa */}
            {primaryPayment && (
              <button
                onClick={() => copyToClipboard(getPaymentDisplay(primaryPayment), primaryPayment.id)}
                className="w-full mb-3 rounded-2xl bg-gradient-to-r from-primary to-secondary text-white font-black py-4 px-4 text-center text-sm active:scale-95 transition-transform shadow-lg hover:shadow-xl flex items-center justify-center gap-2 high-contrast"
              >
                {copied === primaryPayment.id ? (
                  <>
                    <Check className="h-5 w-5" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-5 w-5" />
                    Copy {methodTypeLabel(primaryPayment.method_type)}
                  </>
                )}
              </button>
            )}

            {/* Payment methods */}
            {methods.length > 1 && (
              <div className="space-y-2 mb-4">
                {methods.slice(1).map((m) => (
                  <button
                    key={m.id}
                    onClick={() => copyToClipboard(getPaymentDisplay(m), m.id)}
                    className="w-full rounded-xl border border-border bg-white/50 backdrop-blur-sm p-3 hover:border-primary transition-all text-left text-sm active:bg-primary/5"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-bold text-foreground text-xs">{methodTypeLabel(m.method_type)}</div>
                        <div className="text-xs font-mono text-muted-foreground mt-0.5">{getPaymentDisplay(m)}</div>
                      </div>
                      {copied === m.id ? <Check className="h-4 w-4 text-accent" /> : <Copy className="h-4 w-4 text-primary" />}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Open M-Pesa App link */}
            {primaryPayment && primaryPayment.method_type === "mpesa" && (
              <button
                onClick={() => openMpesaApp(primaryPayment)}
                className="w-full text-accent font-bold text-sm py-2 hover:underline active:opacity-70 transition-opacity mb-3"
              >
                Open M-Pesa App
              </button>
            )}

            {/* Save contact action */}
            <button
              onClick={createVCard}
              className="w-full rounded-xl border border-primary/20 bg-primary/5 py-3 px-4 text-foreground font-bold text-sm active:bg-primary/10 transition-colors flex items-center justify-center gap-2 mb-3"
            >
              <FileText className="h-4 w-4" />
              Save Contact
            </button>

            {/* Quick actions */}
            <div className="grid grid-cols-2 gap-2">
              {profile.phone && (
                <>
                  <a href={`tel:${profile.phone}`}>
                    <button className="w-full rounded-xl border border-border bg-white/50 backdrop-blur-sm py-3 text-foreground font-bold text-sm active:bg-primary/5 transition-colors flex items-center justify-center gap-1.5">
                      <Phone className="h-4 w-4" />
                      Call
                    </button>
                  </a>
                  <a href={`https://wa.me/${profile.phone.replace(/\D/g, "")}`}>
                    <button className="w-full rounded-xl border border-border bg-white/50 backdrop-blur-sm py-3 text-foreground font-bold text-sm active:bg-primary/5 transition-colors flex items-center justify-center gap-1.5">
                      <MessageCircle className="h-4 w-4" />
                      Chat
                    </button>
                  </a>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Trust badges */}
        <div className="mt-6 space-y-2">
          <div className="rounded-xl bg-white/40 backdrop-blur-sm border border-white/60 p-3 text-center text-xs text-muted-foreground">
            <span className="font-medium">Verified rider on ScanTap</span>
          </div>
          <div className="rounded-xl bg-white/40 backdrop-blur-sm border border-white/60 p-3 text-center text-xs text-muted-foreground">
            <span className="font-medium">Payments go directly • No commission</span>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-8 text-center">
          <p className="text-xs text-muted-foreground mb-3">Are you a rider too?</p>
          <Link to="/signup">
            <Button size="sm" className="w-full bg-primary">
              Get your QR sticker
            </Button>
          </Link>
        </div>

        <div className="mt-4 text-center">
          <Link to="/contact" className="text-xs text-muted-foreground hover:text-primary transition-colors">
            Support
          </Link>
        </div>
      </div>
    </div>
  );
}
