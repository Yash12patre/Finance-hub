import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, FileText, Users, LogOut } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, role, signOut } = useAuth();
  const location = useLocation();

  const navItems = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["admin", "analyst", "viewer"] },
    { to: "/records", label: "Records", icon: FileText, roles: ["admin", "analyst", "viewer"] },
    { to: "/users", label: "Users", icon: Users, roles: ["admin"] },
  ];

  const filteredNav = navItems.filter((item) => !role || item.roles.includes(role));

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-background">
        <div className="container mx-auto flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-6">
            <h1 className="font-semibold text-lg">Finance Dashboard</h1>
            <nav className="flex items-center gap-1">
              {filteredNav.map((item) => (
                <Link key={item.to} to={item.to}>
                  <Button
                    variant={location.pathname === item.to ? "secondary" : "ghost"}
                    size="sm"
                    className="gap-2"
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">{user?.email}</span>
            {role && <Badge variant="secondary" className="capitalize">{role}</Badge>}
            <Button variant="ghost" size="icon" onClick={signOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>
      <main className="container mx-auto p-4">{children}</main>
    </div>
  );
}
