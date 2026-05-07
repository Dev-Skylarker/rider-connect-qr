import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Copy, Phone, MessageCircle, Sparkles } from "lucide-react";
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

  if (loading) return <div className="min-h-screen grid place-items-center bg-background text-muted-foreground">Loading…</div>;
  if (!profile) {
    return (
      <div className="min-h-screen grid place-items-center bg-background p-6 text-center">
        <div className="max-w-sm">
          <h1 className="text-2xl font-bold">QR not active</h1>
          <p className="text-muted-foreground mt-2">This QR isn't linked to an active rider profile yet.</p>
          <Link to="/" className="inline-block mt-6"><Button>Get your own QR</Button></Link>
        </div>
      </div>
    );
  }

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/15 via-background to-background">
      <div className="container mx-auto max-w-md px-4 py-8">
        {/* Profile card */}
        <div className="rounded-3xl bg-card border shadow-lg overflow-hidden">
          <div className="bg-primary p-6 text-primary-foreground text-center">
            <div className="mx-auto h-20 w-20 rounded-full bg-primary-foreground text-primary grid place-items-center text-3xl font-black overflow-hidden">
              {profile.photo_url ? <img src={profile.photo_url} alt="" className="h-full w-full object-cover" /> : (profile.display_name || profile.full_name || "R").charAt(0)}
            </div>
            <h1 className="mt-3 text-2xl font-black">{profile.display_name || profile.full_name}</h1>
            <p className="opacity-90 text-sm">{profile.vehicle_type} · {profile.plate_number}</p>
            <p className="opacity-80 text-sm">{profile.route} · {profile.city}</p>
          </div>
          {profile.bio && <p className="px-6 py-4 text-sm text-muted-foreground border-b">{profile.bio}</p>}

          {/* Pay options */}
          <div className="p-5 space-y-3">
            <div className="text-xs uppercase font-bold text-muted-foreground">Pay {profile.display_name || profile.full_name}</div>
            {methods.length === 0 && <p className="text-sm text-muted-foreground">No payment methods listed.</p>}
            {methods.map((m) => {
              const main = m.method_type === "paybill" ? `${m.paybill_number} · ${m.account_number}` : m.account_number || "";
              return (
                <button
                  key={m.id}
                  onClick={() => copy(m.method_type === "paybill" ? `Paybill ${m.paybill_number} Acc ${m.account_number}` : main, m.method_type.toUpperCase())}
                  className="w-full flex items-center justify-between rounded-xl border bg-background p-4 hover:border-primary transition"
                >
                  <div className="text-left">
                    <div className="font-semibold capitalize flex items-center gap-2">
                      {m.method_type}
                      {m.is_primary && <span className="text-[10px] bg-secondary text-secondary-foreground rounded px-2 py-0.5">PRIMARY</span>}
                    </div>
                    <div className="text-sm text-muted-foreground">{main}</div>
                    {m.account_name && <div className="text-xs text-muted-foreground">{m.account_name}</div>}
                  </div>
                  <Copy className="h-5 w-5 text-primary" />
                </button>
              );
            })}
          </div>

          {/* Quick contact */}
          {profile.phone && (
            <div className="px-5 pb-5 grid grid-cols-2 gap-2">
              <a href={`tel:${profile.phone}`}><Button variant="outline" className="w-full"><Phone className="h-4 w-4 mr-1" />Call</Button></a>
              <a href={`https://wa.me/${profile.phone.replace(/\D/g, "")}`}><Button variant="outline" className="w-full"><MessageCircle className="h-4 w-4 mr-1" />WhatsApp</Button></a>
            </div>
          )}
        </div>

        {/* Minimal advert */}
        <div className="mt-6 rounded-2xl border bg-secondary/40 p-5 text-center">
          <div className="inline-flex items-center gap-1 text-xs font-bold bg-accent rounded-full px-2 py-0.5"><Sparkles className="h-3 w-3" /> SCANTAP</div>
          <p className="mt-2 text-sm font-medium">Are you a rider too? Get your own QR sticker.</p>
          <Link to="/signup" className="inline-block mt-3"><Button size="sm">Apply for your QR</Button></Link>
        </div>

        <div className="mt-3 text-center text-xs text-muted-foreground">
          <Link to="/contact" className="underline">Need help? Contact support</Link>
        </div>
      </div>
    </div>
  );
}
