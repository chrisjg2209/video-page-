// app/page.jsx
"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Sparkles, Wand2, Mic, Calendar, Instagram, Loader2, Play, Pause,
  Check, ChevronRight, Volume2, Clock, Hash, ArrowRight, Film, Edit3,
  AlertCircle, Video, Send, RotateCw,
} from "lucide-react";

const TONES = [
  { id: "warm", label: "Warm & inviting", desc: "Friendly neighborhood feel" },
  { id: "luxury", label: "Premium & refined", desc: "Upscale clientele" },
  { id: "energetic", label: "Bright & energetic", desc: "Bold & memorable" },
  { id: "trustworthy", label: "Calm & trustworthy", desc: "Reassuring tone" },
];

export default function GoldenGlowVideoStudio() {
  // Steps: describe → generating-script → review → generating-video → preview-video → scheduled
  const [step, setStep] = useState("describe");
  const [description, setDescription] = useState("");
  const [tone, setTone] = useState("warm");
  const [duration, setDuration] = useState(30);
  const [progressMsg, setProgressMsg] = useState("");
  const [error, setError] = useState("");

  const [result, setResult] = useState(null);
  const [editedScript, setEditedScript] = useState("");
  const [editingScript, setEditingScript] = useState(false);

  // Voiceover state
  const [voiceoverUrl, setVoiceoverUrl] = useState(null);
  const [voiceoverLoading, setVoiceoverLoading] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState(false);

  // Video state
  const [videoTaskId, setVideoTaskId] = useState(null);
  const [videoStatus, setVideoStatus] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [videoProgress, setVideoProgress] = useState(0);
  const [selectedSceneIdx, setSelectedSceneIdx] = useState(0);

  // Schedule state
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("18:00");
  const [publishing, setPublishing] = useState(false);
  const [publishedMediaId, setPublishedMediaId] = useState(null);

  const audioRef = useRef(null);

  // ─────────────── 1. SCRIPT GENERATION ───────────────
  const generateScript = async () => {
    if (!description.trim()) return;
    setError("");
    setStep("generating-script");

    const stages = [
      "Reading your brief...",
      "Crafting the hook...",
      "Building the storyboard...",
      "Optimizing for Instagram...",
    ];
    let stageIdx = 0;
    const stageInterval = setInterval(() => {
      stageIdx = (stageIdx + 1) % stages.length;
      setProgressMsg(stages[stageIdx]);
    }, 1200);
    setProgressMsg(stages[0]);

    try {
      const response = await fetch("/api/generate-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description, tone, duration }),
      });
      const data = await response.json();
      clearInterval(stageInterval);

      if (!data.success) throw new Error(data.error || "Script generation failed");

      setResult(data.data);
      setEditedScript(data.data.script);
      setStep("review");
    } catch (e) {
      clearInterval(stageInterval);
      setError(e.message);
      setStep("describe");
    }
  };

  // ─────────────── 2. VOICEOVER GENERATION ───────────────
  const generateVoiceover = async () => {
    setVoiceoverLoading(true);
    setError("");
    try {
      const response = await fetch("/api/generate-voiceover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ script: editedScript || result.script }),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error || "Voiceover failed");
      setVoiceoverUrl(data.audioUrl);
    } catch (e) {
      setError(e.message);
    }
    setVoiceoverLoading(false);
  };

  const playVoiceover = () => {
    if (!voiceoverUrl) {
      generateVoiceover();
      return;
    }
    if (audioRef.current) {
      if (audioPlaying) {
        audioRef.current.pause();
        setAudioPlaying(false);
      } else {
        audioRef.current.play();
        setAudioPlaying(true);
      }
    }
  };

  // ─────────────── 3. VIDEO GENERATION ───────────────
  const generateVideo = async () => {
    setError("");
    setStep("generating-video");
    setVideoProgress(0);

    try {
      const scene = result.scenes[selectedSceneIdx];
      const response = await fetch("/api/generate-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoPrompt: scene.videoPrompt, duration: 10 }),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error || "Video generation failed");

      setVideoTaskId(data.taskId);
      pollVideoStatus(data.taskId);
    } catch (e) {
      setError(e.message);
      setStep("review");
    }
  };

  const pollVideoStatus = async (taskId) => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/check-video-status?taskId=${taskId}`);
        const data = await response.json();
        if (!data.success) throw new Error(data.error);

        setVideoStatus(data.status);
        setVideoProgress(Math.round((data.progress || 0) * 100));

        if (data.status === "SUCCEEDED") {
          clearInterval(interval);
          setVideoUrl(data.videoUrl);
          setStep("preview-video");
        } else if (data.status === "FAILED" || data.status === "CANCELLED") {
          clearInterval(interval);
          setError(`Video generation ${data.status.toLowerCase()}: ${data.failure || "unknown error"}`);
          setStep("review");
        }
      } catch (e) {
        clearInterval(interval);
        setError(e.message);
        setStep("review");
      }
    }, 5000);
  };

  // ─────────────── 4. PUBLISH TO INSTAGRAM ───────────────
  const publishToInstagram = async () => {
    setPublishing(true);
    setError("");
    try {
      const response = await fetch("/api/publish-instagram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoUrl,
          caption: result.caption,
          hashtags: result.hashtags,
          publishNow: true,
        }),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error || "Publishing failed");

      setPublishedMediaId(data.mediaId);
      setStep("scheduled");
    } catch (e) {
      setError(e.message);
    }
    setPublishing(false);
  };

  const reset = () => {
    setStep("describe");
    setDescription("");
    setResult(null);
    setEditedScript("");
    setVoiceoverUrl(null);
    setVideoUrl(null);
    setVideoTaskId(null);
    setScheduleDate("");
    setEditingScript(false);
    setError("");
    setPublishedMediaId(null);
    setSelectedSceneIdx(0);
  };

  // ─────────────── RENDER ───────────────
  return (
    <div
      className="min-h-screen w-full relative"
      style={{
        background: "linear-gradient(135deg, #FFF8EC 0%, #FDEBC8 50%, #F9D49A 100%)",
        fontFamily: "'Fraunces', Georgia, serif",
      }}
    >
      <div
        className="absolute top-0 right-0 pointer-events-none opacity-40"
        style={{
          width: 500, height: 500,
          background: "radial-gradient(circle at 70% 30%, #F4A742 0%, transparent 60%)",
          filter: "blur(40px)",
        }}
      />

      <div className="relative max-w-5xl mx-auto px-6 py-10">
        {/* Header */}
        <header className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #E89B2D, #C76B1C)", boxShadow: "0 4px 14px rgba(199,107,28,0.3)" }}
            >
              <Sparkles size={20} color="#FFF8EC" strokeWidth={2.5} />
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 600, color: "#2A1810", letterSpacing: "-0.02em" }}>
                Golden Glow
              </div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#8B5A2B", letterSpacing: "0.15em", textTransform: "uppercase" }}>
                Video Studio
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.5)", border: "1px solid rgba(199,107,28,0.2)" }}>
            <Instagram size={14} color="#8B5A2B" />
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#8B5A2B", fontWeight: 500 }}>Instagram</span>
          </div>
        </header>

        {/* Error banner */}
        {error && (
          <div
            className="mb-6 p-4 rounded-2xl flex items-start gap-3"
            style={{ background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.25)" }}
          >
            <AlertCircle size={18} color="#B91C1C" className="flex-shrink-0 mt-0.5" />
            <div className="flex-1" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#7F1D1D" }}>
              {error}
            </div>
            <button onClick={() => setError("")} style={{ fontSize: 18, color: "#B91C1C" }}>×</button>
          </div>
        )}

        {/* ───── STEP: DESCRIBE ───── */}
        {step === "describe" && (
          <div className="animate-fadeIn">
            <div className="mb-10">
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#C76B1C", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 12, fontWeight: 600 }}>
                Step 01 — The Brief
              </div>
              <h1 style={{ fontSize: 56, fontWeight: 500, lineHeight: 1.05, color: "#2A1810", letterSpacing: "-0.03em", marginBottom: 16 }}>
                Describe the video.<br />
                <em style={{ color: "#C76B1C", fontStyle: "italic", fontWeight: 400 }}>We'll handle the rest.</em>
              </h1>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, color: "#5C3A1F", maxWidth: 540, lineHeight: 1.6 }}>
                Tell us what this ad is about. The studio writes the script with Claude, generates a real voiceover with ElevenLabs, creates the video with Runway, and publishes to Instagram via the Meta Graph API.
              </p>
            </div>

            <div
              className="rounded-3xl p-8 mb-6"
              style={{ background: "rgba(255,255,255,0.65)", backdropFilter: "blur(10px)", border: "1px solid rgba(199,107,28,0.15)", boxShadow: "0 8px 32px rgba(199,107,28,0.08)" }}
            >
              <label style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#8B5A2B", letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 600, display: "block", marginBottom: 12 }}>
                Your description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. A 30-second ad promoting our move-out cleaning service. Show the satisfaction of getting your full deposit back. Friendly, end with our website."
                rows={4}
                className="w-full resize-none outline-none"
                style={{ fontSize: 19, lineHeight: 1.5, color: "#2A1810", background: "transparent", border: "none" }}
              />

              <div className="border-t pt-6 mt-2" style={{ borderColor: "rgba(199,107,28,0.15)" }}>
                <label style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#8B5A2B", letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 600, display: "block", marginBottom: 14 }}>
                  Tone
                </label>
                <div className="grid grid-cols-2 gap-2 mb-6">
                  {TONES.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setTone(t.id)}
                      className="text-left p-4 rounded-2xl transition-all"
                      style={{
                        background: tone === t.id ? "linear-gradient(135deg, #E89B2D, #C76B1C)" : "rgba(255,255,255,0.5)",
                        border: tone === t.id ? "1px solid transparent" : "1px solid rgba(199,107,28,0.15)",
                        color: tone === t.id ? "#FFF8EC" : "#2A1810",
                      }}
                    >
                      <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 2 }}>{t.label}</div>
                      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, opacity: 0.75 }}>{t.desc}</div>
                    </button>
                  ))}
                </div>

                <label style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#8B5A2B", letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 600, display: "block", marginBottom: 14 }}>
                  Duration
                </label>
                <div className="flex gap-2">
                  {[15, 30, 45, 60].map((d) => (
                    <button
                      key={d}
                      onClick={() => setDuration(d)}
                      className="px-5 py-2.5 rounded-full transition-all"
                      style={{
                        background: duration === d ? "#2A1810" : "rgba(255,255,255,0.5)",
                        color: duration === d ? "#FDEBC8" : "#5C3A1F",
                        border: "1px solid " + (duration === d ? "#2A1810" : "rgba(199,107,28,0.15)"),
                        fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 500,
                      }}
                    >
                      {d}s
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={generateScript}
              disabled={!description.trim()}
              className="w-full flex items-center justify-center gap-3 py-5 rounded-2xl transition-all"
              style={{
                background: description.trim() ? "linear-gradient(135deg, #2A1810 0%, #5C3A1F 100%)" : "rgba(42,24,16,0.3)",
                color: "#FDEBC8",
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 16, fontWeight: 600, letterSpacing: "0.02em",
                cursor: description.trim() ? "pointer" : "not-allowed",
                boxShadow: description.trim() ? "0 8px 24px rgba(42,24,16,0.25)" : "none",
              }}
            >
              <Wand2 size={18} />
              Generate the video package
              <ArrowRight size={18} />
            </button>
          </div>
        )}

        {/* ───── STEP: GENERATING SCRIPT ───── */}
        {step === "generating-script" && (
          <LoadingState message={progressMsg} subMessage="This usually takes about 10 seconds" />
        )}

        {/* ───── STEP: REVIEW ───── */}
        {step === "review" && result && (
          <div className="animate-fadeIn">
            <div className="mb-8 flex items-end justify-between">
              <div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#C76B1C", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 12, fontWeight: 600 }}>
                  Step 02 — Review & Approve
                </div>
                <h2 style={{ fontSize: 42, fontWeight: 500, lineHeight: 1.05, color: "#2A1810", letterSpacing: "-0.03em" }}>
                  {result.title}
                </h2>
              </div>
              <button onClick={reset} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#8B5A2B", textDecoration: "underline" }}>
                Start over
              </button>
            </div>

            {/* Voiceover & Music */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="col-span-2 rounded-3xl p-7" style={{ background: "linear-gradient(135deg, #2A1810 0%, #4A2818 100%)", color: "#FDEBC8" }}>
                <div className="flex items-center gap-2 mb-5" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "#E89B2D", fontWeight: 600 }}>
                  <Mic size={13} /> Voiceover Script
                </div>

                {editingScript ? (
                  <textarea
                    value={editedScript}
                    onChange={(e) => { setEditedScript(e.target.value); setVoiceoverUrl(null); }}
                    rows={6}
                    className="w-full resize-none outline-none p-4 rounded-xl"
                    style={{ fontSize: 17, lineHeight: 1.55, background: "rgba(253,235,200,0.08)", color: "#FDEBC8", border: "1px solid rgba(232,155,45,0.3)" }}
                  />
                ) : (
                  <p style={{ fontSize: 19, lineHeight: 1.55, fontWeight: 400, fontStyle: "italic" }}>
                    "{editedScript || result.script}"
                  </p>
                )}

                <div className="flex items-center gap-3 mt-6 pt-5 flex-wrap" style={{ borderTop: "1px solid rgba(232,155,45,0.2)" }}>
                  <button
                    onClick={playVoiceover}
                    disabled={voiceoverLoading}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-full"
                    style={{ background: "linear-gradient(135deg, #E89B2D, #C76B1C)", color: "#2A1810", fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600 }}
                  >
                    {voiceoverLoading ? <Loader2 size={14} className="animate-spin" /> : audioPlaying ? <Pause size={14} /> : <Play size={14} />}
                    {voiceoverLoading ? "Generating..." : voiceoverUrl ? (audioPlaying ? "Pause" : "Play voiceover") : "Generate voiceover"}
                  </button>
                  <button
                    onClick={() => setEditingScript(!editingScript)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-full"
                    style={{ background: "rgba(253,235,200,0.1)", color: "#FDEBC8", fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500, border: "1px solid rgba(232,155,45,0.3)" }}
                  >
                    <Edit3 size={13} />
                    {editingScript ? "Done" : "Edit"}
                  </button>
                  <div className="ml-auto flex items-center gap-1.5" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#E89B2D" }}>
                    <Clock size={12} /> ~{duration}s · {result.wordCount} words
                  </div>
                </div>

                {voiceoverUrl && (
                  <audio
                    ref={audioRef}
                    src={voiceoverUrl}
                    onEnded={() => setAudioPlaying(false)}
                    onPause={() => setAudioPlaying(false)}
                    className="hidden"
                  />
                )}
              </div>

              <div className="rounded-3xl p-6" style={{ background: "rgba(255,255,255,0.65)", border: "1px solid rgba(199,107,28,0.15)" }}>
                <div className="flex items-center gap-2 mb-3" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "#8B5A2B", fontWeight: 600 }}>
                  <Volume2 size={13} /> Music
                </div>
                <p style={{ fontSize: 17, lineHeight: 1.4, color: "#2A1810" }}>{result.musicVibe}</p>
                <div className="mt-5 pt-5" style={{ borderTop: "1px solid rgba(199,107,28,0.15)" }}>
                  <div className="flex items-center gap-2 mb-2" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "#8B5A2B", fontWeight: 600 }}>
                    <Clock size={13} /> Best post time
                  </div>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, lineHeight: 1.5, color: "#5C3A1F" }}>
                    {result.bestPostTime}
                  </p>
                </div>
              </div>
            </div>

            {/* Storyboard with scene selector */}
            <div className="rounded-3xl p-7 mb-6" style={{ background: "rgba(255,255,255,0.65)", border: "1px solid rgba(199,107,28,0.15)" }}>
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "#8B5A2B", fontWeight: 600 }}>
                  <Film size={13} /> Storyboard
                </div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#C76B1C" }}>
                  Tap a scene to use it for video generation
                </div>
              </div>
              <div className="space-y-2">
                {result.scenes.map((scene, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedSceneIdx(i)}
                    className="w-full text-left grid grid-cols-12 gap-4 p-3 rounded-2xl transition-all"
                    style={{
                      background: selectedSceneIdx === i ? "rgba(232,155,45,0.15)" : "transparent",
                      border: selectedSceneIdx === i ? "1px solid rgba(232,155,45,0.4)" : "1px solid transparent",
                    }}
                  >
                    <div className="col-span-2">
                      <div style={{ fontSize: 14, fontWeight: 600, color: "#C76B1C", fontVariantNumeric: "tabular-nums" }}>
                        {scene.timecode}
                      </div>
                    </div>
                    <div className="col-span-5">
                      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: "#8B5A2B", fontWeight: 600, marginBottom: 4 }}>
                        Visual
                      </div>
                      <div style={{ fontSize: 15, lineHeight: 1.4, color: "#2A1810" }}>
                        {scene.visual}
                      </div>
                    </div>
                    <div className="col-span-5">
                      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: "#8B5A2B", fontWeight: 600, marginBottom: 4 }}>
                        Voiceover
                      </div>
                      <div style={{ fontSize: 15, lineHeight: 1.4, color: "#2A1810", fontStyle: "italic" }}>
                        "{scene.voiceover}"
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Caption + hashtags */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="rounded-3xl p-7" style={{ background: "rgba(255,255,255,0.65)", border: "1px solid rgba(199,107,28,0.15)" }}>
                <div className="flex items-center gap-2 mb-4" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "#8B5A2B", fontWeight: 600 }}>
                  <Instagram size={13} /> Caption
                </div>
                <p style={{ fontSize: 16, lineHeight: 1.55, color: "#2A1810", whiteSpace: "pre-line" }}>
                  {result.caption}
                </p>
              </div>
              <div className="rounded-3xl p-7" style={{ background: "rgba(255,255,255,0.65)", border: "1px solid rgba(199,107,28,0.15)" }}>
                <div className="flex items-center gap-2 mb-4" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "#8B5A2B", fontWeight: 600 }}>
                  <Hash size={13} /> Hashtags
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {result.hashtags.map((h, i) => (
                    <span key={i} className="px-3 py-1 rounded-full" style={{ background: "rgba(232,155,45,0.15)", color: "#8B5A2B", fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 500 }}>
                      #{h}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Generate video button */}
            <button
              onClick={generateVideo}
              className="w-full flex items-center justify-center gap-3 py-5 rounded-2xl transition-all"
              style={{
                background: "linear-gradient(135deg, #2A1810 0%, #5C3A1F 100%)",
                color: "#FDEBC8",
                fontFamily: "'DM Sans', sans-serif", fontSize: 16, fontWeight: 600,
                boxShadow: "0 8px 24px rgba(42,24,16,0.25)",
              }}
            >
              <Video size={18} />
              Generate the video with Runway
              <ArrowRight size={18} />
            </button>
            <p className="text-center mt-3" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#8B5A2B" }}>
              Generation takes ~60–180 seconds. Costs ~$0.30 in Runway credits.
            </p>
          </div>
        )}

        {/* ───── STEP: GENERATING VIDEO ───── */}
        {step === "generating-video" && (
          <div className="flex flex-col items-center justify-center py-32 animate-fadeIn">
            <div className="relative mb-8">
              <div className="absolute inset-0 rounded-full animate-ping" style={{ background: "rgba(232,155,45,0.3)" }} />
              <div className="relative w-20 h-20 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, #E89B2D, #C76B1C)", boxShadow: "0 8px 32px rgba(199,107,28,0.4)" }}>
                <Video size={32} color="#FFF8EC" />
              </div>
            </div>
            <div style={{ fontSize: 32, fontWeight: 500, color: "#2A1810", letterSpacing: "-0.02em", marginBottom: 8 }}>
              Generating your video...
            </div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#8B5A2B", marginBottom: 24 }}>
              Status: {videoStatus || "queued"} · {videoProgress}%
            </div>
            <div className="w-80 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(199,107,28,0.15)" }}>
              <div className="h-full transition-all duration-500" style={{ width: `${videoProgress}%`, background: "linear-gradient(90deg, #E89B2D, #C76B1C)" }} />
            </div>
            <div className="mt-8 max-w-md text-center" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#8B5A2B" }}>
              Runway Gen-3 typically takes 60–180 seconds. You can leave this tab open.
            </div>
          </div>
        )}

        {/* ───── STEP: PREVIEW VIDEO + PUBLISH ───── */}
        {step === "preview-video" && videoUrl && (
          <div className="animate-fadeIn">
            <div className="mb-8">
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#C76B1C", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 12, fontWeight: 600 }}>
                Step 03 — Preview & Publish
              </div>
              <h2 style={{ fontSize: 42, fontWeight: 500, lineHeight: 1.05, color: "#2A1810", letterSpacing: "-0.03em" }}>
                Your video is ready.
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-6">
              <div className="rounded-3xl overflow-hidden" style={{ background: "#000", aspectRatio: "9/16" }}>
                <video src={videoUrl} controls className="w-full h-full object-cover" />
              </div>

              <div className="space-y-4">
                <div className="rounded-3xl p-6" style={{ background: "rgba(255,255,255,0.65)", border: "1px solid rgba(199,107,28,0.15)" }}>
                  <div className="flex items-center gap-2 mb-3" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "#8B5A2B", fontWeight: 600 }}>
                    <Calendar size={13} /> Publish to Instagram
                  </div>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#5C3A1F", lineHeight: 1.6, marginBottom: 16 }}>
                    Approve and publish this video to your Golden Glow Instagram. The caption and hashtags from the brief will be attached automatically.
                  </p>

                  <button
                    onClick={publishToInstagram}
                    disabled={publishing}
                    className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl"
                    style={{
                      background: publishing ? "rgba(42,24,16,0.5)" : "linear-gradient(135deg, #2A1810 0%, #5C3A1F 100%)",
                      color: "#FDEBC8",
                      fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 600,
                    }}
                  >
                    {publishing ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                    {publishing ? "Publishing... (30-90s)" : "Publish to Instagram now"}
                  </button>
                </div>

                <button onClick={() => setStep("review")} className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl" style={{ background: "rgba(255,255,255,0.5)", color: "#5C3A1F", fontFamily: "'DM Sans', sans-serif", fontSize: 14, border: "1px solid rgba(199,107,28,0.15)" }}>
                  <RotateCw size={14} /> Generate a different scene
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ───── STEP: PUBLISHED ───── */}
        {step === "scheduled" && result && (
          <div className="animate-fadeIn flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mb-8" style={{ background: "linear-gradient(135deg, #E89B2D, #C76B1C)", boxShadow: "0 8px 32px rgba(199,107,28,0.4)" }}>
              <Check size={36} color="#FFF8EC" strokeWidth={3} />
            </div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#C76B1C", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 14, fontWeight: 600 }}>
              Live on Instagram
            </div>
            <h2 style={{ fontSize: 48, fontWeight: 500, lineHeight: 1.05, color: "#2A1810", letterSpacing: "-0.03em", marginBottom: 16, maxWidth: 600 }}>
              "{result.title}" is published.
            </h2>
            {publishedMediaId && (
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#8B5A2B", marginBottom: 8 }}>
                Media ID: {publishedMediaId}
              </p>
            )}
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 17, color: "#5C3A1F", maxWidth: 480, lineHeight: 1.6, marginBottom: 32 }}>
              Check your Golden Glow Instagram — the post is live now.
            </p>
            <button
              onClick={reset}
              className="flex items-center gap-2 px-6 py-3 rounded-full"
              style={{ background: "#2A1810", color: "#FDEBC8", fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600 }}
            >
              <Wand2 size={15} /> Make another video
            </button>
          </div>
        )}

        <footer className="mt-20 pt-8 text-center" style={{ borderTop: "1px solid rgba(199,107,28,0.1)" }}>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#8B5A2B", letterSpacing: "0.1em" }}>
            Claude · ElevenLabs · Runway · Meta Graph API
          </p>
        </footer>
      </div>
    </div>
  );
}

function LoadingState({ message, subMessage }) {
  return (
    <div className="flex flex-col items-center justify-center py-32 animate-fadeIn">
      <div className="relative mb-8">
        <div className="absolute inset-0 rounded-full animate-ping" style={{ background: "rgba(232,155,45,0.3)" }} />
        <div className="relative w-20 h-20 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, #E89B2D, #C76B1C)", boxShadow: "0 8px 32px rgba(199,107,28,0.4)" }}>
          <Loader2 size={32} color="#FFF8EC" className="animate-spin" />
        </div>
      </div>
      <div style={{ fontFamily: "'Fraunces', serif", fontSize: 32, fontWeight: 500, color: "#2A1810", letterSpacing: "-0.02em", marginBottom: 8 }}>
        {message}
      </div>
      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#8B5A2B" }}>
        {subMessage}
      </div>
    </div>
  );
}
