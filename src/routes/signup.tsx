import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { SiteHeader } from "@/components/SiteHeader";

export const Route = createFileRoute("/signup")({ component: Signup });

function Signup() {
  const nav = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = z.object({
      fullName: z.string().min(2).max(80),
      email: z.string().email(),
      password: z.string().min(8),
    }).safeParse({ fullName, email, password });
    if (!parsed.success) return toast.error("Check your inputs (password 8+ chars).");
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName }, emailRedirectTo: `${window.location.origin}/dashboard` },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Account created");
    nav({ to: "/dashboard" });
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="container mx-auto max-w-md px-4 py-16">
        <h1 className="text-3xl font-bold">Create rider account</h1>
        <p className="text-muted-foreground mt-1">Free to sign up. Pay only when you order your QR sticker.</p>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div><Label>Full name</Label><Input value={fullName} onChange={(e) => setFullName(e.target.value)} required maxLength={80} /></div>
          <div><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
          <div><Label>Password</Label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} /></div>
          <Button type="submit" className="w-full" disabled={loading}>{loading ? "Creating…" : "Create account"}</Button>
        </form>
        <div className="mt-4 text-sm text-center">
          Already have an account? <Link to="/login" className="text-primary">Login</Link>
        </div>
      </div>
    </div>
  );
}
