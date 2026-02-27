"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Session } from "@supabase/supabase-js";

interface Caption {
  id: string;
  content: string;
  // Add other fields if known, but 'content' is the primary one based on CaptionRater.tsx
}

interface ImageUploaderProps {
  session: Session;
}

export default function ImageUploader({ session }: ImageUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cdnUrl, setCdnUrl] = useState<string | null>(null);
  const [imageId, setImageId] = useState<string | null>(null);
  const [captions, setCaptions] = useState<Caption[]>([]);
  const router = useRouter();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
      setCdnUrl(null);
      setImageId(null);
      setCaptions([]);
      setStatus(null);
    }
  };

  const handleUploadAndGenerate = async () => {
    if (!file) {
      setError("Please select a file first.");
      return;
    }

    setLoading(true);
    setError(null);
    setCaptions([]);
    setStatus("Generating presigned URL...");

    try {
      // Step 1: Generate Presigned URL
      const contentType = file.type || "image/jpeg";
      const presignedResponse = await fetch("https://api.almostcrackd.ai/pipeline/generate-presigned-url", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contentType: contentType,
        }),
      });

      if (!presignedResponse.ok) {
        const errorData = await presignedResponse.json().catch(() => ({}));
        throw new Error(errorData.message || `API error (Step 1): ${presignedResponse.status}`);
      }

      const { presignedUrl, cdnUrl: finalCdnUrl } = await presignedResponse.json();

      // Step 2: Upload Image Bytes
      setStatus("Uploading image bytes...");
      const uploadResponse = await fetch(presignedUrl, {
        method: "PUT",
        headers: {
          "Content-Type": contentType,
        },
        body: file,
      });

      if (!uploadResponse.ok) {
        throw new Error(`Upload failed (Step 2): ${uploadResponse.statusText}`);
      }

      // Step 3: Register Image URL
      setStatus("Registering image in pipeline...");
      const registerResponse = await fetch("https://api.almostcrackd.ai/pipeline/upload-image-from-url", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageUrl: finalCdnUrl,
          isCommonUse: false,
        }),
      });

      if (!registerResponse.ok) {
        const errorData = await registerResponse.json().catch(() => ({}));
        throw new Error(errorData.message || `API error (Step 3): ${registerResponse.status}`);
      }

      const { imageId: registeredImageId } = await registerResponse.json();
      setImageId(registeredImageId);
      setCdnUrl(finalCdnUrl);

      // Step 4: Generate Captions
      setStatus("Generating captions...");
      const generateResponse = await fetch("https://api.almostcrackd.ai/pipeline/generate-captions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageId: registeredImageId,
        }),
      });

      if (!generateResponse.ok) {
        const errorData = await generateResponse.json().catch(() => ({}));
        throw new Error(errorData.message || `API error (Step 4): ${generateResponse.status}`);
      }

      const captionData = await generateResponse.json();
      setCaptions(captionData);
      setStatus("Captions generated successfully!");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred during the process.");
      setStatus(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24">
      <button
        onClick={() => router.back()}
        className="absolute top-4 left-4 bg-slate-500 hover:bg-slate-700 text-white font-bold py-2 px-4 rounded transition-colors shadow-sm"
      >
        &larr; Back
      </button>
      <h1 className="text-4xl font-bold mb-8 text-black">Upload & Caption</h1>
      
      <div className="border border-sky-200 rounded-lg p-8 w-full max-w-2xl bg-white shadow-xl flex flex-col items-center">
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="mb-6 block w-full text-sm text-slate-600
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-sky-50 file:text-sky-700
            hover:file:bg-sky-100 cursor-pointer"
        />

        {file && (
          <p className="mb-4 text-sm text-slate-500">
            Selected: {file.name} ({file.type})
          </p>
        )}

        <button
          onClick={handleUploadAndGenerate}
          disabled={!file || loading}
          className={`w-full font-bold py-3 px-4 rounded transition-all transform hover:scale-[1.01] active:scale-95 shadow-md ${
            !file || loading
              ? "bg-slate-200 cursor-not-allowed text-slate-400"
              : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white"
          }`}
        >
          {loading ? "Processing..." : "Generate Captions"}
        </button>

        {status && !error && (
          <p className="mt-4 text-sm text-blue-600 animate-pulse font-medium">{status}</p>
        )}

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm w-full text-center">
            <strong>Error:</strong> {error}
          </div>
        )}

        {cdnUrl && (
          <div className="mt-8 space-y-6 w-full">
            <div className="flex flex-col items-center">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Uploaded Image</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={cdnUrl} alt="Uploaded" className="max-h-72 rounded-xl shadow-lg border border-slate-200 transition-opacity duration-500" />
            </div>

            {captions.length > 0 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <h2 className="text-xl font-bold text-slate-800 flex items-center justify-center">
                  ✨ Generated Captions
                </h2>
                <div className="grid gap-3">
                  {captions.map((caption, idx) => (
                    <div 
                      key={caption.id || idx} 
                      className="p-4 bg-sky-50 border border-sky-100 rounded-lg hover:border-blue-400 transition-colors group shadow-sm"
                    >
                      <p className="text-slate-700 text-lg text-center font-medium leading-relaxed group-hover:text-slate-900">
                        "{caption.content}"
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
