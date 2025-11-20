"use client";

import { useEffect, useState, FormEvent, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

type VideoRow = {
  id: string;
  created_at: string;
  file_path: string;
  original_name?: string | null; // optional
};

type AnalysisRow = {
  id: string;
  video_id: string;
  feedback: string | null;
  drills: any; // we'll normalize at runtime
};

type SelectedVideo = {
  id: string;
  created_at: string;
  file_path: string;
  original_name: string | null;
  publicUrl: string;
};

export default function DashboardPage() {
  const router = useRouter();

  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [videos, setVideos] = useState<SelectedVideo[]>([]);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [analyses, setAnalyses] = useState<Record<string, AnalysisRow>>({});
  const [uploading, setUploading] = useState(false);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);

  // Load user, videos, and analyses on mount
  useEffect(() => {
    async function init() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setUserEmail(user.email ?? null);

      // Load videos for this user
      const { data: videoRows, error: videoError } = await supabase
        .from("videos")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (videoError) {
        console.error("Error loading videos:", videoError);
        setGlobalError("Could not load your swings.");
        return;
      }

      const withUrls: SelectedVideo[] =
        (videoRows as VideoRow[] | null)?.map((v) => {
          const { data } = supabase.storage
            .from("swings")
            .getPublicUrl(v.file_path);
          return {
            id: v.id,
            created_at: v.created_at,
            file_path: v.file_path,
            original_name: v.original_name ?? null,
            publicUrl: data.publicUrl,
          };
        }) ?? [];

      setVideos(withUrls);
      if (withUrls.length > 0) {
        setSelectedVideoId(withUrls[0].id);
      }

      // Load analyses for this user
      const { data: analysisRows, error: analysisError } = await supabase
        .from("swing_analyses")
        .select("*")
        .eq("user_id", user.id);

      if (analysisError) {
        console.error("Error loading analyses:", analysisError);
        return;
      }

      const map: Record<string, AnalysisRow> = {};
      (analysisRows as AnalysisRow[] | null)?.forEach((a) => {
        map[a.video_id] = a;
      });

      setAnalyses(map);
    }

    void init();
  }, [router]);

  const selectedVideo =
    (selectedVideoId && videos.find((v) => v.id === selectedVideoId)) || null;
  const selectedAnalysis = selectedVideo
    ? analyses[selectedVideo.id] ?? null
    : null;

  function handleFileChange() {
    const input = fileInputRef.current;
    if (input && input.files && input.files.length > 0) {
      setSelectedFileName(input.files[0].name);
    } else {
      setSelectedFileName(null);
    }
  }

  // Upload a new swing video
  async function handleUpload(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setGlobalError(null);

    const input = fileInputRef.current;
    if (!input || !input.files || input.files.length === 0) {
      setGlobalError("Please choose a video file first.");
      return;
    }

    const file = input.files[0];
    setUploading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("swings")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Insert DB row — only columns we know exist: user_id, file_path
      const { data: insertRow, error: insertError } = await supabase
        .from("videos")
        .insert({
          user_id: user.id,
          file_path: fileName,
        })
        .select("*")
        .single();

      if (insertError) throw insertError;

      const { data } = supabase.storage
        .from("swings")
        .getPublicUrl(insertRow.file_path);

      const newVideo: SelectedVideo = {
        id: insertRow.id,
        created_at: insertRow.created_at,
        file_path: insertRow.file_path,
        original_name: insertRow.original_name ?? null,
        publicUrl: data.publicUrl,
      };

      setVideos((prev) => [newVideo, ...prev]);
      setSelectedVideoId(newVideo.id);
      input.value = "";
      setSelectedFileName(null);
    } catch (err: any) {
      console.error("Upload error:", err);
      const msg =
        err?.message || err?.error?.message || "Upload failed. Please try again.";
      setGlobalError(msg);
    } finally {
      setUploading(false);
    }
  }

  // Analyze a swing using the API + save analysis to DB
  async function handleAnalyze(video: SelectedVideo) {
    setGlobalError(null);
    setAnalyzingId(video.id);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoUrl: video.publicUrl }),
      });

      if (!res.ok) {
        throw new Error("Report request failed");
      }

      const data = await res.json();
      const feedback: string = data.feedback ?? "";
      const drills: any = data.drills ?? null;

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const { data: upsertRow, error: upsertError } = await supabase
        .from("swing_analyses")
        .upsert({
          user_id: user.id,
          video_id: video.id,
          feedback,
          drills,
        })
        .select("*")
        .single();

      if (upsertError) throw upsertError;

      setAnalyses((prev) => ({
        ...prev,
        [video.id]: upsertRow,
      }));
    } catch (err: any) {
      console.error("Analyze error:", err);
      const msg =
        err?.message ||
        err?.error?.message ||
        "Could not generate a swing report. Please try again.";
      setGlobalError(msg);
    } finally {
      setAnalyzingId(null);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f3f4f6",
        color: "#111827",
        fontFamily: "-apple-system, BlinkMacSystemFont, system-ui, sans-serif",
      }}
    >
      {/* Header with site nav */}
      <header
        style={{
          borderBottom: "1px solid #e5e7eb",
          marginBottom: 24,
          background: "#ffffff",
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            padding: "12px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 24,
          }}
        >
          {/* Left: logo + title */}
          <Link
            href="/"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              textDecoration: "none",
            }}
          >
            <img
              src="/logo.png"
              alt="Broken Bats Hitting Club logo"
              style={{ width: 60, height: 60, objectFit: "contain" }}
            />
            <div>
              <div
                style={{
                  fontSize: 11,
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  color: "#6b7280",
                }}
              >
                Broken Bats Hitting Club
              </div>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 600,
                  color: "#111827",
                }}
              >
                Swing Analysis Dashboard
              </div>
            </div>
          </Link>

          {/* Middle: main site nav */}
          <nav
            style={{
              display: "flex",
              alignItems: "center",
              gap: 20,
              fontSize: 14,
              flex: "0 0 auto",
            }}
          >
            <Link href="/" style={{ textDecoration: "none", color: "#111827" }}>
              Home
            </Link>
            <Link
              href="/about-us"
              style={{ textDecoration: "none", color: "#111827" }}
            >
              About Us
            </Link>
            <Link
              href="/swing-lab"
              style={{ textDecoration: "none", color: "#111827" }}
            >
              Swing Lab
            </Link>
            <Link
              href="/drills"
              style={{ textDecoration: "none", color: "#111827" }}
            >
              Drills
            </Link>
          </nav>

          {/* Right: user + logout */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              fontSize: 13,
              flex: "0 0 auto",
            }}
          >
            {userEmail && (
              <span style={{ color: "#6b7280" }}>Logged in as {userEmail}</span>
            )}
            <button
              onClick={handleLogout}
              style={{
                padding: "6px 12px",
                borderRadius: 999,
                border: "1px solid #d1d5db",
                background: "#ffffff",
                cursor: "pointer",
                fontSize: 13,
              }}
            >
              Log Out
            </button>
          </div>
        </div>
      </header>

      <main
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "0 24px 40px",
        }}
      >
        {globalError && (
          <div
            style={{
              marginBottom: 16,
              padding: "10px 14px",
              borderRadius: 8,
              border: "1px solid #fecaca",
              background: "#fef2f2",
              color: "#991b1b",
              fontSize: 14,
            }}
          >
            {globalError}
          </div>
        )}

        {/* Upload card */}
        <section
          style={{
            marginBottom: 24,
            background: "#ffffff",
            borderRadius: 12,
            padding: 20,
            boxShadow: "0 10px 25px rgba(15,23,42,0.06)",
            border: "1px solid #e5e7eb",
          }}
        >
          <h2
            style={{
              fontSize: 18,
              marginTop: 0,
              marginBottom: 8,
            }}
          >
            Upload a Swing
          </h2>
          <p
            style={{
              fontSize: 14,
              color: "#4b5563",
              marginTop: 0,
              marginBottom: 16,
            }}
          >
            Choose a short clip that clearly shows the full swing (side view is
            best). Once it&apos;s uploaded, select the swing below and click{" "}
            <strong>Analyze Swing</strong> to get a detailed report.
          </p>

          <form
            onSubmit={handleUpload}
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 12,
              alignItems: "center",
            }}
          >
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              name="swingFile"
              accept="video/*"
              onChange={handleFileChange}
              style={{ display: "none" }}
            />

            {/* Visible "Select" button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              style={{
                padding: "8px 16px",
                borderRadius: 999,
                border: "1px solid #d1d5db",
                background: "#ffffff",
                color: "#111827",
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              {selectedFileName ? "Change Video File" : "Select Video File"}
            </button>

            {/* File name / status text */}
            <span
              style={{
                fontSize: 13,
                color: "#6b7280",
                minWidth: 160,
              }}
            >
              {selectedFileName || "No file selected yet."}
            </span>

            {/* Upload button */}
            <button
              type="submit"
              disabled={uploading}
              style={{
                padding: "8px 16px",
                borderRadius: 999,
                border: "none",
                background: "#111827",
                color: "#f9fafb",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {uploading ? "Uploading..." : "Upload Swing Video"}
            </button>
          </form>
        </section>

        {/* If no swings yet */}
        {videos.length === 0 && (
          <section
            style={{
              background: "#ffffff",
              borderRadius: 12,
              padding: 20,
              border: "1px solid #e5e7eb",
              fontSize: 14,
              color: "#6b7280",
            }}
          >
            No swings uploaded yet. Start by uploading a video above.
          </section>
        )}

        {/* Swings + report layout */}
        {videos.length > 0 && selectedVideo && (
          <section
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1.2fr) minmax(0, 1fr)",
              gap: 20,
              alignItems: "flex-start",
            }}
          >
            {/* Left: video list + player */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {/* Video list */}
              <div
                style={{
                  background: "#ffffff",
                  borderRadius: 12,
                  padding: 12,
                  border: "1px solid #e5e7eb",
                  maxHeight: 220,
                  overflowY: "auto",
                }}
              >
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    marginBottom: 8,
                  }}
                >
                  Your Swings
                </div>
                {videos.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVideoId(v.id)}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      padding: "8px 10px",
                      borderRadius: 8,
                      border:
                        v.id === selectedVideoId
                          ? "1px solid #111827"
                          : "1px solid transparent",
                      background:
                        v.id === selectedVideoId ? "#e5e7eb" : "transparent",
                      cursor: "pointer",
                      fontSize: 13,
                    }}
                  >
                    <div style={{ fontWeight: 500 }}>
                      {v.original_name || "Uploaded swing"}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "#6b7280",
                      }}
                    >
                      {new Date(v.created_at).toLocaleString()}
                    </div>
                  </button>
                ))}
              </div>

              {/* Player + Analyze button */}
              <div
                style={{
                  background: "#ffffff",
                  borderRadius: 12,
                  padding: 12,
                  border: "1px solid #e5e7eb",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 8,
                  }}
                >
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                    }}
                  >
                    Selected Swing
                  </div>
                  <button
                    onClick={() => handleAnalyze(selectedVideo)}
                    disabled={analyzingId === selectedVideo.id}
                    style={{
                      padding: "6px 12px",
                      borderRadius: 999,
                      border: "none",
                      background: "#111827",
                      color: "#f9fafb",
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    {analyzingId === selectedVideo.id
                      ? "Analyzing..."
                      : "Analyze Swing"}
                  </button>
                </div>

                <video
                  src={selectedVideo.publicUrl}
                  controls
                  style={{
                    width: "100%",
                    borderRadius: 8,
                    background: "#000000",
                  }}
                >
                  Your browser does not support the video tag.
                </video>
              </div>
            </div>

            {/* Right: Swing Report */}
            <div
              style={{
                background: "#ffffff",
                borderRadius: 12,
                padding: 16,
                border: "1px solid #e5e7eb",
                // let this grow and use page scroll
              }}
            >
              <h2
                style={{
                  fontSize: 18,
                  marginTop: 0,
                  marginBottom: 8,
                }}
              >
                Swing Report
              </h2>

              {!selectedAnalysis && (
                <p
                  style={{
                    fontSize: 14,
                    color: "#6b7280",
                  }}
                >
                  No report yet for this swing. Click{" "}
                  <strong>Analyze Swing</strong> to generate one.
                </p>
              )}

              {selectedAnalysis && (
                <>
                  {/* Feedback text */}
                  <div
                    style={{
                      fontSize: 14,
                      color: "#111827",
                      whiteSpace: "pre-wrap",
                      marginBottom: 16,
                    }}
                  >
                    {selectedAnalysis.feedback}
                  </div>

                  {/* Normalized drills list */}
                  {(() => {
                    let drills: string[] = [];
                    const raw = selectedAnalysis.drills;

                    if (Array.isArray(raw)) {
                      drills = raw as string[];
                    } else if (typeof raw === "string" && raw.trim() !== "") {
                      try {
                        const parsed = JSON.parse(raw);
                        if (Array.isArray(parsed)) {
                          drills = parsed;
                        } else {
                          drills = [raw];
                        }
                      } catch {
                        drills = [raw];
                      }
                    }

                    if (drills.length === 0) return null;

                    return (
                      <div>
                        <div
                          style={{
                            fontSize: 14,
                            fontWeight: 600,
                            marginBottom: 4,
                          }}
                        >
                          Recommended Drills
                        </div>
                        <ul
                          style={{
                            paddingLeft: 18,
                            margin: 0,
                            fontSize: 14,
                            color: "#111827",
                          }}
                        >
                          {drills.map((d, idx) => (
                            <li key={idx}>{d}</li>
                          ))}
                        </ul>
                      </div>
                    );
                  })()}
                </>
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
