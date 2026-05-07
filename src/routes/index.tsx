import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { QrCode, Smartphone, Wallet, Sparkles, ShieldCheck, Users } from "lucide-react";

export const Route = createFileRoute("/")({ component: Landing });

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 opacity-30"
          style={{ background: "radial-gradient(900px 400px at 80% -10%, var(--secondary), transparent), radial-gradient(700px 350px at 0% 100%, var(--primary), transparent)" }} />
        <div className="container mx-auto px-4 pt-16 pb-20 md:pt-24 md:pb-28 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs font-medium">
              <Sparkles className="h-3.5 w-3.5 text-accent-foreground" /> Built for boda riders in Kenya
            </div>
            <h1 className="mt-5 text-4xl md:text-6xl font-black leading-tight">
              One <span className="text-primary">scan.</span> Your number.<br />
              Their <span className="text-secondary-foreground bg-secondary px-2 rounded-md">payment.</span>
            </h1>
            <p className="mt-5 text-lg text-muted-foreground max-w-xl">
              ScanTap gives you a permanent QR sticker that links to your public profile.
              Customers scan, copy your M-Pesa or Till in one tap, and pay you directly.
              No card readers. No commissions on your earnings.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/signup"><Button size="lg" className="text-base">Get my QR sticker</Button></Link>
              <Link to="/how-it-works"><Button size="lg" variant="outline">How it works</Button></Link>
            </div>
          </div>

          {/* Sticker visual */}
          <div className="relative mx-auto">
            <div className="relative w-[280px] sm:w-[340px] aspect-square rounded-3xl bg-primary p-5 shadow-2xl overflow-hidden">
              <svg className="absolute inset-0 w-full h-full opacity-90" viewBox="0 0 340 340" preserveAspectRatio="none">
                <path d="M0,260 C90,200 180,320 340,240 L340,340 L0,340 Z" fill="var(--secondary)" />
                <path d="M0,290 C100,240 220,330 340,280 L340,340 L0,340 Z" fill="var(--secondary)" opacity="0.7" />
              </svg>
              <div className="relative flex items-start justify-between text-primary-foreground">
                <div className="text-2xl font-black tracking-tight">SCAN</div>
                <div className="h-10 w-10 rounded-md bg-primary-foreground text-primary grid place-items-center font-black">ST</div>
              </div>
              <div className="relative mt-4 rounded-2xl bg-accent p-4">
                <div className="aspect-square w-full rounded-md bg-white grid place-items-center">
                  <QrCode className="h-24 w-24 text-foreground" />
                </div>
              </div>
              <div className="relative mt-4 text-center text-primary-foreground italic font-semibold">for rider profile</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl md:text-4xl font-bold text-center">Why riders choose ScanTap</h2>
        <div className="mt-10 grid md:grid-cols-3 gap-6">
          {[
            { icon: QrCode, title: "Permanent QR", body: "One sticker, forever. Edit your profile anytime — the QR never changes." },
            { icon: Smartphone, title: "Tap-to-copy pay", body: "Customers copy your M-Pesa, Till, or Paybill in one tap and pay externally." },
            { icon: Wallet, title: "Zero commission", body: "We never touch your money. You get paid directly into your account." },
            { icon: ShieldCheck, title: "Secure profile", body: "Your data is protected with bank-grade authentication and access controls." },
            { icon: Users, title: "Build trust", body: "Photo, plate number, and route help customers verify it's really you." },
            { icon: Sparkles, title: "Always live", body: "Update your route or number any day — changes show instantly on scan." },
          ].map((f, i) => (
            <div key={i} className="rounded-2xl border bg-card p-6">
              <f.icon className="h-8 w-8 text-primary" />
              <div className="mt-4 font-semibold text-lg">{f.title}</div>
              <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Vision */}
      <section className="container mx-auto px-4 py-16">
        <div className="rounded-3xl border bg-secondary/40 p-10 md:p-14 text-center">
          <div className="inline-block rounded-full bg-accent px-3 py-1 text-xs font-bold">COMING NEXT</div>
          <h2 className="mt-4 text-3xl md:text-4xl font-bold">In-app payments and more service workers</h2>
          <p className="mt-4 max-w-2xl mx-auto text-muted-foreground">
            Soon you'll receive payments directly inside ScanTap with full receipts and history — and we're expanding QR profiles to mama-mboga, mechanics, salons, delivery riders, and every hardworking service across Kenya.
          </p>
          <Link to="/signup" className="inline-block mt-6">
            <Button size="lg">Join early — get your QR</Button>
          </Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
