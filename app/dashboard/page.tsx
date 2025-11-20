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

type AnalysisRow = {
  id: string;
  user_id: string;
  video_id: string;
  feedback: string | null;
  drills: string | string[] | null;
  created_at: string;
};

const PLAN_LIMITS: Record<Plan, number> = {
  swing: 9999,
  minor: 3,
  major: 10,
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
  const [analyses, setAnalyses] = useState<Record<string, AnalysisRow>>({});
  const [analyzingVideoId, setAnalyzingVideoId] = useState<string | null>(null);

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

  // Load profile, videos, analyses
  useEffect(() => {
    if (!userId) return;

    async function loadAll() {
      try {
        // 1) Profile
        const { data: existing, error: profileError } = await supabase
          .from("profiles")
          .select("user_id, plan, created_at")
          .eq("user_id", userId)
          .maybeSingle();

        if (profileError) throw profileError;

        let profile: Profile;

        if (!existing) {
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

        // 2) Videos
        const { data: videoData, error: videoError } = await supabase
          .from("videos")
          .select("id, file_path, created_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: false });

        if (videoError) throw videoError;

        const allVideos = (videoData || []) as VideoRow[];
        setVideos(allVideos);

        // Weekly count
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const countLastWeek = allVideos.filter((v) => {
          return new Date(v.created_at) >= sevenDaysAgo;
        }).length;
        setWeeklyCount(countLastWeek);

        // 3) Analyses
        const { data: analysisData, error: analysisError } = await supabase
          .from("swing_analyses")
          .select("id, user_id, video_id, feedback, drills, created_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: false });

        if (analysisError) throw analysisError;

        const byVideo: Record<string, AnalysisRow> = {};
        (analysisData || []).forEach((row) => {
          byVideo[row.video_id] = row as AnalysisRow;
        });
        setAnalyses(byVideo);
      } catch (err: any) {
        console.error(err);
        setError("Could not load your profile, videos, or analyses.");
      }
    }

    loadAll();
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

      const timestamp = Date.now();
      const safeName = file.name.replace(/\s+/g, "-");
      const path = `${userId}/${timestamp}-${safeName}`;

      const { error: uploadError } = await supabase.storage
        .from("swings")
        .upload(path, file);

      if (uploadError) throw uploadError;

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
      setVideos((prev) => [newVideo, ...prev]);
      setFile(null);
      setMessage("Upload complete! Your swing has been saved.");
      setWeeklyCount((prev) => prev + 1);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  function getVideoUrl(filePath: string) {
    const { data } = supabase.storage.from("swings").getPublicUrl(filePath);
    return data.publicUrl;
  }

  async function handleAnalyze(video: VideoRow) {
    if (!userId) return;

    setError(null);
    setMessage(null);
    setAnalyzingVideoId(video.id);

    try {
      const videoUrl = getVideoUrl(video.file_path);

      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoUrl }),
      });

      if (!res.ok) {
        throw new Error("Analysis request failed");
      }

      const data = await res.json();
      const feedback: string = data.feedback || "";
      const drills: string[] = data.drills || [];

      // Save to Supabase
      const { data: inserted, error: insertError } = await supabase
        .from("swing_analyses")
        .insert({
          user_id: userId,
          video_id: video.id,
          feedback,
          drills: JSON.stringify(drills),
        })
        .select("id, user_id, video_id, feedback, drills, created_at")
        .single();

      if (insertError) throw insertError;

      const row = inserted as AnalysisRow;
      setAnalyses((prev) => ({
        ...prev,
        [video.id]: row,
      }));
      setMessage("Analysis complete! Scroll down to see your feedback.");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Analysis failed.");
    } finally {
      setAnalyzingVideoId(null);
    }
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
              const analysis = analyses[v.id];

              let drillsList: string[] = [];
              if (analysis?.drills) {
                if (typeof analysis.drills === "string") {
                  try {
                    drillsList = JSON.parse(analysis.drills);
                  } catch {
                    drillsList = [analysis.drills];
                  }
                } else {
                  drillsList = analysis.drills;
                }
              }

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

                  <div style={{ marginBottom: 8 }}>
                    <button
                      onClick={() => handleAnalyze(v)}
                      disabled={!!analysis || analyzingVideoId === v.id}
                    >
                      {analysis
                        ? "Analysis Complete"
                        : analyzingVideoId === v.id
                        ? "Analyzing..."
                        : "Analyze Swing"}
                    </button>
                  </div>

                  {analysis && (
                    <div
                      style={{
                        background: "#f6f6f6",
                        padding: 12,
                        borderRadius: 4,
                      }}
                    >
                      <h3 style={{ marginTop: 0, marginBottom: 8 }}>
                        AI Feedback
                      </h3>
                      <p style={{ whiteSpace: "pre-wrap" }}>
                        {analysis.feedback}
                      </p>

                      {drillsList.length > 0 && (
                        <>
                          <h4 style={{ marginBottom: 4 }}>Recommended Drills</h4>
                          <ul>
                            {drillsList.map((d, i) => (
                              <li key={i}>{d}</li>
                            ))}
                          </ul>
                        </>
                      )}
                    </div>
                  )}

                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: "inline-block", marginTop: 8 }}
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
