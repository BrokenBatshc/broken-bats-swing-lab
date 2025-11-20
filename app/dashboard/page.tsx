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
        // 1) Profile (for future tiers; default to Major for now)
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

        // Weekly count (limit still enforced in background)
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
        setError("Could not load your swings or reports.");
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
        `You have reached your upload limit for this period. Please wait before adding more swings.`
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
        throw new Error("Report request failed");
      }

      const data = await res.json();
      const feedback: string = data.feedback || "";
      const drills: string[] = data.drills || [];

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
      setMessage("Report complete! Scroll down to see your swing report.");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Report generation failed.");
    } finally {
      setAnalyzingVideoId(null);
    }
  }

  if (loadingUser) {
    return <p style={{ padding: 24 }}>Loading your dashboard...</p>;
  }

  // still computed for future plans, just not shown
  void PLAN_LIMITS;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f3f4f6",
        padding: "24px 12px",
        fontFamily: "-apple-system, BlinkMacSystemFont, system-ui, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: 960,
          margin: "0 auto",
        }}
      >
        {/* Header */}
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 24,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {/* Logo – put your logo at /public/logo.png or change the src */}
            <img
              src="/logo.png"
              alt="Broken Bats logo"
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                objectFit: "cover",
                border: "1px solid #e5e7eb",
                background: "#111827",
              }}
            />
            <div>
              <div
                style={{
                  fontSize: 14,
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  color: "#6b7280",
                }}
              >
                Broken Bats Hitting Club
              </div>
              <h1
                style={{
                  margin: "4px 0 0 0",
                  fontSize: 24,
                  fontWeight: 700,
                }}
              >
                Swing Analysis Dashboard
              </h1>
            </div>
          </div>

          <div style={{ textAlign: "right" }}>
            {email && (
              <div
                style={{
                  fontSize: 12,
                  color: "#6b7280",
                  marginBottom: 6,
                }}
              >
                Logged in as <strong>{email}</strong>
              </div>
            )}
            <button onClick={handleLogout}>Log Out</button>
          </div>
        </header>

        {/* Global status messages */}
        {(message || error) && (
          <div style={{ marginBottom: 16 }}>
            {message && (
              <div
                style={{
                  background: "#ecfdf3",
                  border: "1px solid #22c55e",
                  color: "#166534",
                  padding: "8px 12px",
                  borderRadius: 6,
                  marginBottom: 6,
                  fontSize: 14,
                }}
              >
                {message}
              </div>
            )}
            {error && (
              <div
                style={{
                  background: "#fef2f2",
                  border: "1px solid #ef4444",
                  color: "#991b1b",
                  padding: "8px 12px",
                  borderRadius: 6,
                  fontSize: 14,
                }}
              >
                {error}
              </div>
            )}
          </div>
        )}

        {/* Content layout */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 24,
          }}
        >
          {/* Upload card */}
          <section
            style={{
              background: "#ffffff",
              borderRadius: 12,
              padding: 20,
              boxShadow: "0 1px 3px rgba(15, 23, 42, 0.08)",
            }}
          >
            <h2
              style={{
                marginTop: 0,
                marginBottom: 8,
                fontSize: 18,
              }}
            >
              Upload a Swing
            </h2>
            <p
              style={{
                marginTop: 0,
                marginBottom: 16,
                fontSize: 14,
                color: "#4b5563",
                maxWidth: 640,
              }}
            >
              Choose a short clip that clearly shows the full swing (side view is
              best). Once it&apos;s uploaded, click{" "}
              <strong>Analyze Swing</strong> to get a detailed swing report and
              recommended drills.
            </p>

            <form
              onSubmit={handleUpload}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 12,
                maxWidth: 420,
              }}
            >
              <input
                type="file"
                accept="video/*"
                onChange={handleFileChange}
              />

              <button type="submit" disabled={uploading}>
                {uploading ? "Uploading..." : "Upload Swing Video"}
              </button>
            </form>
          </section>

          {/* Swings list */}
          <section
            style={{
              background: "#ffffff",
              borderRadius: 12,
              padding: 20,
              boxShadow: "0 1px 3px rgba(15, 23, 42, 0.08)",
            }}
          >
            {videos.length === 0 ? (
              <p
                style={{
                  fontSize: 14,
                  color: "#4b5563",
                }}
              >
                No swings uploaded yet. Start by uploading a video above.
              </p>
            ) : (
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
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
                        borderBottom: "1px solid #e5e7eb",
                      }}
                    >
                      <div
                        style={{
                          marginBottom: 8,
                          fontSize: 13,
                          color: "#6b7280",
                        }}
                      >
                        <strong>
                          {new Date(v.created_at).toLocaleString()}
                        </strong>
                      </div>

                      {/* Video + report side-by-side */}
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: 16,
                        }}
                      >
                        {/* Video column */}
                        <div
                          style={{
                            flex: "0 1 360px",
                            maxWidth: "100%",
                          }}
                        >
                          <video
                            src={url}
                            controls
                            style={{
                              maxWidth: "100%",
                              width: 360,
                              display: "block",
                              marginBottom: 8,
                              borderRadius: 8,
                              border: "1px solid #e5e7eb",
                            }}
                          />

                          <div style={{ marginBottom: 8 }}>
                            <button
                              onClick={() => handleAnalyze(v)}
                              disabled={
                                !!analysis || analyzingVideoId === v.id
                              }
                            >
                              {analysis
                                ? "Swing Report Ready"
                                : analyzingVideoId === v.id
                                ? "Creating Report..."
                                : "Analyze Swing"}
                            </button>
                          </div>
                        </div>

                        {/* Report column */}
                        {analysis && (
                          <div
                            style={{
                              flex: "1 1 260px",
                              minWidth: 260,
                              background: "#f9fafb",
                              borderRadius: 8,
                              padding: 12,
                              fontSize: 14,
                            }}
                          >
                            <h3
                              style={{
                                marginTop: 0,
                                marginBottom: 6,
                                fontSize: 15,
                              }}
                            >
                              Swing Report
                            </h3>
                            <p
                              style={{
                                whiteSpace: "pre-wrap",
                                marginTop: 0,
                                marginBottom: 8,
                              }}
                            >
                              {analysis.feedback}
                            </p>

                            {drillsList.length > 0 && (
                              <>
                                <h4
                                  style={{
                                    marginTop: 0,
                                    marginBottom: 4,
                                    fontSize: 14,
                                  }}
                                >
                                  Recommended Drills
                                </h4>
                                <ul
                                  style={{
                                    paddingLeft: 20,
                                    marginTop: 0,
                                    marginBottom: 0,
                                  }}
                                >
                                  {drillsList.map((d, i) => (
                                    <li key={i}>{d}</li>
                                  ))}
                                </ul>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
