import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { subscribeToAuth, checkIsAdmin } from "../../../lib/firebase/forms";
import Header from "../../components/Header";
import AdminDashboard from "../../components/dashboard/AdminDashboard";
import UserDashboard from "../../components/dashboard/UserDashboard";

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = subscribeToAuth(async (user) => {
      if (user) {
        setCurrentUser(user);
        const adminStatus = await checkIsAdmin(user.uid);
        setIsAdmin(adminStatus);
      } else {
        setCurrentUser(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-surface">
        <div className="flex items-center gap-3 text-primary font-bold">
          <Loader2 className="w-6 h-6 animate-spin" />
          Loading dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <Header setLoading={setLoading} />
      <main className="pt-32 pb-20 max-w-7xl mx-auto px-6">
        {isAdmin ? (
          <>
            <div className="mb-10">
              <AdminDashboard />
            </div>
            <UserDashboard currentUser={currentUser} />
          </>
        ) : (
          <UserDashboard currentUser={currentUser} />
        )}
      </main>
    </div>
  );
}
