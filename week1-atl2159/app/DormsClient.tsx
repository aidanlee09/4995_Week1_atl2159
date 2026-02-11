"use client";

import { useEffect, useState } from "react";
import { createClientForBrowser } from "@/lib/supabaseClient";

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
    <div className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-8">Dorms</h1>

      {dorms.length === 0 ? (
        <p>No dorms found.</p>
      ) : (
        <ul className="space-y-6">
          {dorms.map((dorm) => (
            <li key={dorm.id} className="border rounded-lg p-4 w-full max-w-xl bg-black shadow">
              {Object.entries(dorm).map(([key, value]) => (
                <p key={key}>
                  <strong>{key}:</strong> {String(value)}
                </p>
              ))}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
