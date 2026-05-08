import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useIsStaff } from "@/hooks/use-is-admin";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/AdminSidebar";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_admin")({ component: AdminLayout });

function AdminLayout() {
  const { user, loading, signOut } = useAuth();
  const { checking, isStaff } = useIsStaff();
  const nav = useNavigate();

  useEffect(() => {
    if (!loading && !user) nav({ to: "/login", search: { redirect: "/admin" } });
  }, [loading, user, nav]);

  useEffect(() => {
    if (!checking && user && !isStaff) nav({ to: "/dashboard" });
  }, [checking, user, isStaff, nav]);

  if (loading || checking) {
    return <div className="min-h-screen grid place-items-center text-muted-foreground">Loading…</div>;
  }
  if (!user || !isStaff) return null;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AdminSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-14 flex items-center justify-between border-b px-4">
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              <span className="font-bold">ScanTap Admin</span>
            </div>
            <Button variant="outline" size="sm" onClick={signOut}>Sign out</Button>
          </header>
          <main className="flex-1 p-6 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
