"use client";

import { useEffect, useState } from "react";
import { createClientForBrowser } from "@/lib/supabaseClient";

export default function LoginClient({
  error,
  details,
}: {
  error?: string;
  details?: string;
}) {
  const [loading, setLoading] = useState(false);

  const showError = error && error !== "dev_force_oauth";

  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      const supabase = createClientForBrowser();
      supabase.auth.signOut();
    }
  }, []);

  const signInWithGoogle = async () => {
    setLoading(true);
    const supabase = createClientForBrowser();
    const origin = window.location.origin;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${origin}/auth/callback`,
        queryParams: { prompt: "consent" },
      },
    });

    if (error) {
      console.error("OAuth error:", error);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-10">
      <div className="w-full max-w-md border rounded-xl p-6">
        <h1 className="text-2xl font-bold mb-2">Login</h1>
        <p className="text-sm opacity-80 mb-6">
          Sign in to view the protected dorms page.
        </p>

        {showError && (
            <div className="mb-4 text-sm text-red-500">
                <div>
                <strong>Error:</strong> {error}
                </div>
                {details && <div className="mt-1">{details}</div>}
            </div>
            )}

        <button
          onClick={signInWithGoogle}
          disabled={loading}
          className="w-full border rounded-lg py-2 font-semibold"
        >
          {loading ? "Redirecting..." : "Sign in with Google"}
        </button>
      </div>
    </div>
  );
}
