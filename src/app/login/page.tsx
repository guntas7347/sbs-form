import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Info } from "lucide-react";
import { subscribeToAuth } from "../../../lib/firebase/forms";
import { signInWithGoogle } from "../../../lib/firebase/auth";
export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const isRedirect = queryParams.has("redirect");
  const redirectParams = queryParams.get("redirect") || "/dashboard";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const unsub = subscribeToAuth((u) => {
      if (u) {
        navigate(redirectParams, { replace: true });
      }
    });
    return unsub;
  }, [navigate, redirectParams]);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError("");

    try {
      await signInWithGoogle();
      navigate(redirectParams);
    } catch (err: any) {
      setError("Failed to sign in. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex text-on-surface bg-surface-container-lowest">
      <div className="hidden lg:flex lg:w-1/2 signature-gradient p-12 flex-col justify-between text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10 z-0"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <img
              src="./sbssu-logo.png"
              alt="Logo"
              className="size-16 rounded-lg p-2"
            />{" "}
            <span className="text-2xl font-bold tracking-tight font-headline">
              SBSSU Forms
            </span>
          </div>
          <h1 className="text-5xl font-extrabold font-headline leading-tight mb-6">
            Access Your
            <br />
            Academic Gallery
          </h1>
          <p className="text-lg opacity-90 max-w-md leading-relaxed font-body">
            Manage and submit your official university documentation,
            scholarship applications, and administrative forms seamlessly.
          </p>
        </div>
        <div className="relative z-10 text-sm font-label opacity-80">
          Shaheed Bhagat Singh State University
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-24 bg-surface">
        <div className="w-full max-w-md">
          <div className="flex justify-center items-center items-center gap-3 mb-12 lg:hidden">
            <img
              className="size-10 p-2 bg-white"
              src="./sbssu-logo.png"
              alt="SBSSU Logo"
            />
            <span className="text-xl font-bold tracking-tight text-primary font-headline">
              SBSSU Forms
            </span>
          </div>

          <div className="mb-10 text-center lg:text-left">
            <h2 className="text-3xl font-extrabold font-headline mb-3 text-on-surface">
              {isRedirect ? "Authentication Required" : "Welcome back"}
            </h2>
            <p className="text-on-surface-variant font-body">
              {isRedirect
                ? "Please login to open the form."
                : "Sign in to continue to your dashboard."}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-error-container text-on-error-container text-sm font-medium flex items-center gap-3">
              <Info className="w-5 h-5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <div className="mb-8 relative">
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-3.5 px-4 bg-white border border-outline-variant hover:bg-surface-container-lowest hover:border-outline shadow-sm rounded-xl text-on-surface font-semibold font-label transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {!loading ? (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Sign in with Google
                </>
              ) : (
                <span className="flex items-center gap-2">Connecting...</span>
              )}
            </button>
          </div>

          <div className="p-5 rounded-xl bg-tertiary/5 border border-tertiary/10">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-tertiary flex-shrink-0 mt-0.5" />
              <div className="text-sm font-body text-on-surface-variant leading-relaxed">
                <span className="font-semibold text-tertiary">Note:</span> You
                can seamlessly login with both your official university email
                (e.g.{" "}
                <span className="font-mono text-xs bg-tertiary/10 px-1 py-0.5 rounded">
                  @sbssu.ac.in
                </span>
                ) or your personal Gmail account.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
