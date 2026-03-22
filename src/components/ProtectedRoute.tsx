import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { subscribeToAuth } from "../../lib/firebase/forms";
import { Loader2 } from "lucide-react";
import type { User } from "firebase/auth";

export default function ProtectedRoute() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeToAuth((u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  if (loading) {
    return (
      <div className="  flex items-center justify-center bg-surface">
        <Loader2 className="animate-spin w-8 h-8 text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
