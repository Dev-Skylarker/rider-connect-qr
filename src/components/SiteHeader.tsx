import { Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { useIsStaff } from "@/hooks/use-is-admin";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  const { user, signOut } = useAuth();
  const { isStaff } = useIsStaff();
  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-black">
            ST
          </div>
          <span className="font-bold text-lg">ScanTap</span>
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm">
          <Link to="/about" className="hover:text-primary">About</Link>
          <Link to="/how-it-works" className="hover:text-primary">How it works</Link>
          <Link to="/faq" className="hover:text-primary">FAQ</Link>
        </nav>
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Link to="/dashboard"><Button variant="ghost" size="sm">Dashboard</Button></Link>
              <Button variant="outline" size="sm" onClick={signOut}>Sign out</Button>
            </>
          ) : (
            <>
              <Link to="/login"><Button variant="ghost" size="sm">Login</Button></Link>
              <Link to="/signup"><Button size="sm">Get started</Button></Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
