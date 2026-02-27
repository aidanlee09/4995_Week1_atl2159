"use client";

import { useEffect, useState } from "react";
import { createClientForBrowser } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

interface Dorm {
  id: string;
  university_id: string;
  short_name: string;
  full_name: string;
  created_at: string;
  updated_at: string;
}

export default function DormsClient() {
  const [dorms, setDorms] = useState<Dorm[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchDorms = async () => {
      try {
        const supabase = createClientForBrowser();
        const { data, error } = await supabase.from("dorms").select("*");

        if (error) throw error;

        setDorms(data || []);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "An unknown error occurred.");
      } finally {
        setLoading(false);
      }
    };

    fetchDorms();
  }, []);

  if (loading) return <div className="text-center mt-8">Loading dorms...</div>;
  if (error) return <div className="text-center mt-8 text-red-500">Error: {error}</div>;

  return (
    <div className="min-h-screen p-8 md:p-12 lg:p-24 relative flex flex-col items-center">
      {/* Top Right Action Buttons */}
      <div className="absolute top-6 right-6 flex space-x-3">
        <button
          onClick={() => router.push("/rate-captions")}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-all active:scale-95 text-sm"
        >
          Rate Captions
        </button>
        <button
          onClick={() => router.push("/upload")}
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-all active:scale-95 text-sm"
        >
          Upload Image
        </button>
      </div>

      <h1 className="text-6xl font-black mb-16 text-black tracking-tight mt-12 md:mt-0">Columbia Dorms</h1>

      {dorms.length === 0 ? (
        <p className="text-slate-800">No dorms found.</p>
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl">
          {dorms.map((dorm) => (
            <li key={dorm.id} className="border border-sky-200 rounded-lg p-6 bg-white shadow-md text-slate-800 flex flex-col">
              <h2 className="text-xl font-bold text-black mb-0">{dorm.short_name}</h2>
              <p className="text-sm text-slate-500 mb-4 italic font-medium">{dorm.full_name}</p>
              
              <div className="space-y-1">
                {Object.entries(dorm)
                  .filter(([key]) => key !== "short_name" && key !== "full_name")
                  .map(([key, value]) => (
                  <p key={key} className="text-xs text-slate-400">
                    <strong className="text-slate-600 font-semibold uppercase tracking-tighter mr-1">{key}:</strong> {String(value)}
                  </p>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
