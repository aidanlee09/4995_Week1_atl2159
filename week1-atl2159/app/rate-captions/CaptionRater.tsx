"use client";

import { useEffect, useState } from "react";
import { createClientForBrowser } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation"; // Import useRouter

interface Caption {
  id: string;
  content: string;
  created_datetime_utc: string; // Added created_datetime_utc
}

export default function CaptionRater() {
  const [supabase] = useState(() => createClientForBrowser());
  const [currentCaption, setCurrentCaption] = useState<Caption | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter(); // Initialize useRouter

  useEffect(() => {
    const initialize = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;
        setUser(userData?.user || null);

        if (userData?.user) {
          await fetchRandomCaption();
        } else {
          setError("User not logged in. Please log in to rate captions.");
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "An unknown error occurred during initialization.");
        console.error("Initialization error:", err);
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, [supabase]);

  const fetchRandomCaption = async () => {
    setLoading(true);
    setError(null);
    try {
      // Changed table name back to 'captions' and selected 'content' field
      const { data, error } = await supabase
        .from("captions")
        .select("id, content, created_datetime_utc") // Added created_datetime_utc to select statement
        .limit(1);

      if (error) {
        console.error("Supabase fetch error:", error);
        setError(error.message);
        return;
      }

      if (data && data.length > 0) {
        setCurrentCaption(data[0] as Caption);
      } else {
        setCurrentCaption(null);
        setError("No captions found to rate.");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unknown error occurred while fetching caption.");
      console.error("Fetch random caption error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (voteType: "upvote" | "downvote") => {
    if (!user) {
      setError("You must be logged in to vote.");
      return;
    }
    if (!currentCaption) {
      setError("No caption to vote on.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.from("caption_votes").insert({
        profile_id: user.id,
        caption_id: currentCaption.id,
        vote_value: voteType === "upvote" ? 1 : -1,
        created_datetime_utc: currentCaption.created_datetime_utc, // Added created_datetime_utc
      });

      if (error) {
        console.error("Supabase insert error:", error);
        setError(error.message);
        return;
      }

      // After voting, fetch a new random caption
      await fetchRandomCaption();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unknown error occurred while recording vote.");
      console.error("Vote error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center mt-8">Loading...</div>;
  if (error) return <div className="text-center mt-8 text-red-500">Error: {error}</div>;
  if (!user) return <div className="text-center mt-8 text-red-500">Please log in to rate captions.</div>;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24">
      <button
        onClick={() => router.back()}
        className="absolute top-4 left-4 bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
      >
        &larr; Back to Dorms
      </button>
      <h1 className="text-4xl font-bold mb-8">Rate Captions</h1>
      {currentCaption ? (
        <div className="border rounded-lg p-8 w-full max-w-2xl bg-black shadow flex flex-col items-center">
          <p className="text-2xl mb-8 text-center">{currentCaption.content}</p>
          <div className="flex space-x-4">
            <button
              onClick={() => handleVote("upvote")}
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
            >
              Upvote
            </button>
            <button
              onClick={() => handleVote("downvote")}
              className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
            >
              Downvote
            </button>
          </div>
        </div>
      ) : (
        <p>No captions available for rating.</p>
      )}
    </div>
  );
}