"use client";

import {
  useEffect,
  useState,
  ChangeEvent,
  FormEvent,
} from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

type VideoRow = {
  id: string;
  file_path: string;
  created_at: string;
};

type Plan = "minor" | "major" | "swing";

type Profile = {
  user_id: string;
  plan: Plan;
  created_at: string;
};

const PLAN_LIMITS: Record<Plan, number> = {
  swing: 9999, // essentially unlimited for now
  minor: 3,    // 3 uploads per week
  major: 10,   // 10 uploads per week
};

const PLAN_LABELS: Record<Plan, string> = {
  swing: "Swing Analysis (per-clip)",
  minor: "Minor League – 3 uploads/week",
  major: "Major League – 10 uploads/week",
};

export default function DashboardPage() {
  const router = useRouter();

  const [loadingUser, setLoadingUser] = useState(true);
  const [email, setEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [weeklyCount, setWeeklyCount] = useState<number>(0);

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

  // Load or create profile + weekly upload count + videos
  useEffect(() => {
    if (!userId) return;

    async function loadProfileAndStats() {
      try {
        // 1) Load or create profile
        const { data: existing, error: profileError } = await supabase
          .from("profiles")
          .select("user_id, plan, created_at")
          .eq("user_id", userId)
          .maybeSingle();

        if (profileError) throw profileError;

        let profile: Profile;

        if (!existing) {
          // Create default profile as Major League for now
          const { data: inserted, error: insertError } = await supabase
            .from("profiles")
            .insert({
              user_id: userId,
              plan: "major",
            })
            .select("user_id, plan, created_at")
            .single();

          if (insertError) throw insertError;
          profile = inserted as Profile;
        } else {
          profile = existing as Profile;
        }

        setProfile(profile);

        // 2) Load videos for this user
        const { data: videoData, error: videoError } = await supabase
          .from("videos")
          .select("id, file_path, created_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: false });

        if (videoError) throw videoError;

        const allVideos = (videoData || []) as VideoRow[];
        setVideos(allVideos);

        // 3) Count videos from last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const countLastWeek = allVideos.filter((v) => {
          return new Date(v.created_at) >= sevenDaysAgo;
        }).length;

        setWeeklyCount(countLastWeek);
      } catch (err: any) {
        console.error(err);
        setError("Could not load your profile or videos.");
      }
    }

    loadProfileAndStats();
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
    if (!userId || !profile) {
      setError("You must be logged in to upload.");
      return;
    }

    const plan = profile.plan;
    const limit = PLAN_LIMITS[plan];

    if (weeklyCount >= limit) {
      setError(
        `You have reached your weekly limit for the ${PLAN_LABELS[plan]} plan (${limit} uploads per rolling 7 days).`
      );
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

      const newVideo = data as VideoRow;

      // Update local state
      setVideos((prev) => [newVideo, ...prev]);
      setFile(null);
      setMessage("Upload complete! Your swing has been saved.");

      // Bump weekly count
      setWeeklyCount((prev) => prev + 1);
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

  const plan = profile?.plan ?? "major";
  const limit = PLAN_LIMITS[plan];
  const uploadsLeft = Math.max(limit - weeklyCount, 0);

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Welcome{email ? `, ${email}` : ""}.</p>

      <p style={{ marginTop: 8 }}>
        <strong>Current Plan:</strong> {PLAN_LABELS[plan]}
      </p>
      <p>
        <strong>Uploads this week:</strong> {weeklyCount} / {limit} &nbsp;|&nbsp;
        <strong>Remaining:</strong> {uploadsLeft}
      </p>

      <button
        style={{ marginTop: 16, marginBottom: 32 }}
        onClick={handleLogout}
      >
        Log Out
      </button>

      <section style={{ marginBottom: 32 }}>
        <h2>Upload a Swing Video</h2>
        <p>Select a clip from your phone or computer to save it.</p>

        <form
          onSubmit={handleUpload}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
            maxWidth: 400,
          }}
        >
          <input type="file" accept="video/*" onChange={handleFileChange} />

          <button type="submit" disabled={uploading}>
            {uploading ? "Uploading..." : "Upload Swing"}
          </button>
        </form>

        {message && (
          <p style={{ marginTop: 8, color: "green" }}>{message}</p>
        )}
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
                    <strong>
                      {new Date(v.created_at).toLocaleString()}
                    </strong>
                  </div>

                  <video
                    src={url}
                    controls
                    style={{
                      maxWidth: "100%",
                      width: 320,
                      display: "block",
                      marginBottom: 8,
                    }}
                  />

                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
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
