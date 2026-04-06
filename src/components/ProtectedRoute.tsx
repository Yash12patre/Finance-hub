import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import type { Enums } from "@/integrations/supabase/types";

interface Props {
  children: React.ReactNode;
  allowedRoles?: Enums<"app_role">[];
}

export function ProtectedRoute({ children, allowedRoles }: Props) {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
