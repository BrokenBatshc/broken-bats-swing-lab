"use client";

import { useEffect, useState, ChangeEvent, FormEvent } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

type VideoRow = {
  id: string;
  file_path: string;
  created_at: string;
};

export default function DashboardPage() {
  const router = useRouter();
  const [loadingUser, setLoadingUser] = useState(true);
  const [email, setEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [videos, setVideos] = useState<VideoRow[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load logged-in user
  useEffect(() => {
    async function loadUser() {
      const { data, error } = await supabase.auth.getUser();

      if (error || !data.user) {
        router.push("/login");
        return;
      }

      setEmail(data.user.email ?? null);
      setUserId(data.user.id);
      setLoadingUser(false);
    }

    loadUser();
  }, [router]);

  // Load videos once we know userId
  useEffect(() => {
    if (!userId) return;

    async function loadVideos() {
      const { data, error } = await supabase
        .from("videos")
        .select("id, file_path, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error(error);
        setError("Could not load your videos.");
        return;
      }

      setVideos(data || []);
    }

    loadVideos();
  }, [userId]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (files && files.length > 0) {
      setFile(files[0]);
    }
  }

  async function handleUpload(e: FormEvent) {
    e.preventDefault();
    setMessage(null);
    setError(null);

    if (!file) {
      setError("Please choose a file first.");
      return;
    }
    if (!userId) {
      setError("You must be logged in to upload.");
      return;
    }

    try {
      setUploading(true);

      // Unique path: userId/timestamp_filename
      const timestamp = Date.now();
      const safeName = file.name.replace(/\s+/g, "-");
      const path = `${userId}/${timestamp}-${safeName}`;

      // Upload to the "swings" bucket
      const { error: uploadError } = await supabase.storage
        .from("swings")
        .upload(path, file);

      if (uploadError) throw uploadError;

      // Save a row in the "videos" table
      const { data, error: insertError } = await supabase
        .from("videos")
        .insert({
          user_id: userId,
          file_path: path,
        })
        .select("id, file_path, created_at")
        .single();

      if (insertError) throw insertError;

      if (data) {
        setVideos((prev) => [data as VideoRow, ...prev]);
      }
      setFile(null);
      setMessage("Upload complete! Your swing has been saved.");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  // Helper to get a public URL for a file
  function getVideoUrl(filePath: string) {
    const { data } = supabase.storage.from("swings").getPublicUrl(filePath);
    return data.publicUrl;
  }

  if (loadingUser) {
    return <p>Loading your dashboard...</p>;
  }

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Welcome{email ? `, ${email}` : ""}.</p>
      <p>
        This is your Swing Lab home: uploads, feedback, and drills will all show
        up here.
      </p>

      <button style={{ marginTop: 16, marginBottom: 32 }} onClick={handleLogout}>
        Log Out
      </button>

      <section style={{ marginBottom: 32 }}>
        <h2>Upload a Swing Video</h2>
        <p>Select a clip from your phone or computer to save it.</p>

        <form
          onSubmit={handleUpload}
          style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 400 }}
        >
          <input type="file" accept="video/*" onChange={handleFileChange} />

          <button type="submit" disabled={uploading}>
            {uploading ? "Uploading..." : "Upload Swing"}
          </button>
        </form>

        {message && <p style={{ marginTop: 8, color: "green" }}>{message}</p>}
        {error && <p style={{ marginTop: 8, color: "red" }}>{error}</p>}
      </section>

      <section>
        <h2>Your Uploaded Swings</h2>
        {videos.length === 0 ? (
          <p>No swings uploaded yet.</p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0 }}>
            {videos.map((v) => {
              const url = getVideoUrl(v.file_path);
              return (
                <li
                  key={v.id}
                  style={{
                    marginBottom: 24,
                    paddingBottom: 16,
                    borderBottom: "1px solid #ddd",
                  }}
                >
                  <div style={{ marginBottom: 4 }}>
                    <strong>{new Date(v.created_at).toLocaleString()}</strong>
                  </div>
                  <div style={{ marginBottom: 8, fontSize: 12 }}>
                    Path: {v.file_path}
                  </div>

                  {/* Inline video player */}
                  <video
                    src={url}
                    controls
                    style={{ maxWidth: "100%", width: 320, display: "block", marginBottom: 8 }}
                  />

                  {/* Direct link, in case the player has issues */}
                  <a href={url} target="_blank" rel="noopener noreferrer">
                    Open video in new tab
                  </a>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

