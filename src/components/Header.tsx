import { LogOut, ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { signOut, type User } from "firebase/auth";
import { Link, useLocation } from "react-router-dom";
import { auth, db } from "../../lib/firebase/firebase";
import { doc, getDoc } from "firebase/firestore";
import { subscribeToAuth } from "../../lib/firebase/auth";

const Header = ({ setLoading }: { setLoading: (loading: boolean) => void }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [imgError, setImgError] = useState(false);
  const location = useLocation();
  const showBack =
    location.pathname !== "/dashboard" && location.pathname !== "/";

  useEffect(() => {
    const unsubscribe = subscribeToAuth((currentUser) => {
      if (currentUser) {
        setUser(currentUser);

        getDoc(doc(db, "users", currentUser.uid)).then((docSnap) => {
          if (docSnap.exists() && docSnap.data().isAdmin) {
            setIsAdmin(true);
          }
        });
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    const response = confirm("Are you sure you want to logout?");
    if (response) {
      await signOut(auth);
    }
  };
  const getInitials = (name?: string) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-sm border-b border-outline-variant/30">
      <div className="flex justify-between items-center w-full px-6 py-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-4">
          {showBack && (
            <Link
              to="/dashboard"
              className="p-2 text-on-surface-variant hover:bg-surface-container-low hover:text-primary rounded-xl transition-colors"
              title="Back to Dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
          )}
          <Link
            to="/dashboard"
            className="flex items-center gap-3 cursor-pointer"
          >
            <img src="./sbssu-logo.png" alt="Logo" className="w-6 h-6" />
            <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 font-headline">
              SBSSU Forms
            </span>
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-3 mr-4">
            {user?.photoURL && !imgError ? (
              <img
                src={user.photoURL}
                alt="Profile"
                onError={() => setImgError(true)}
                className="w-10 h-10 rounded-full border-2 border-primary/20 bg-primary/5 object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full border-2 border-primary/20 bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                {getInitials(user?.displayName || "")}
              </div>
            )}

            <div className="flex flex-col">
              <span className="text-sm font-bold font-headline leading-none mb-1 flex items-center gap-2">
                {user?.displayName}
                {isAdmin && (
                  <span className="bg-red-100 text-red-700 text-[10px] font-extrabold px-1.5 py-0.5 rounded border border-red-200 uppercase tracking-wider">
                    ADMIN MODE
                  </span>
                )}
              </span>
              <span className="text-xs text-on-surface-variant font-body">
                {user?.email}
              </span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="p-2.5 text-on-surface-variant hover:text-error hover:bg-error/10 rounded-xl transition-colors bg-surface-container-low"
            title="Sign Out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Header;
