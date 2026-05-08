#!/usr/bin/env node
// scripts/finalize.js
// Standalone: take a Runway taskId, fetch a fresh signed URL, generate
// an ElevenLabs voiceover, mux with ffmpeg, save to ~/Desktop.
// Usage: node scripts/finalize.js <taskId> ["optional script text"]

const fs = require("fs");
const path = require("path");
const os = require("os");
const { spawn } = require("child_process");
const ffmpegPath = require("ffmpeg-static");

const env = fs
  .readFileSync(".env.local", "utf8")
  .split("\n")
  .reduce((acc, line) => {
    const i = line.indexOf("=");
    if (i > 0) acc[line.slice(0, i).trim()] = line.slice(i + 1).trim();
    return acc;
  }, {});

const taskId = process.argv[2];
const script =
  process.argv[3] ||
  "Get every penny of your deposit back. At Golden Glow, our move-out cleaning leaves your home spotless from baseboards to ceiling fans. Trusted across South Florida, on time, every time. Book your free quote today at goldenglow-jd.com.";

if (!taskId) {
  console.error("Usage: node scripts/finalize.js <taskId> [\"script text\"]");
  process.exit(1);
}

(async () => {
  console.log("Fetching fresh video URL from Runway...");
  const r = await fetch(`https://api.dev.runwayml.com/v1/tasks/${taskId}`, {
    headers: {
      Authorization: `Bearer ${env.RUNWAY_API_KEY}`,
      "X-Runway-Version": "2024-11-06",
    },
  });
  const data = await r.json();
  if (data.status !== "SUCCEEDED") {
    console.error(`Task is ${data.status}, not SUCCEEDED. Aborting.`);
    process.exit(1);
  }
  const videoUrl = data.output[0];

  console.log("Downloading silent video...");
  const vresp = await fetch(videoUrl);
  const vbuf = Buffer.from(await vresp.arrayBuffer());
  const videoPath = path.join(os.tmpdir(), `_gg-${taskId}-video.mp4`);
  fs.writeFileSync(videoPath, vbuf);

  console.log("Generating voiceover with ElevenLabs...");
  const voiceId = env.ELEVENLABS_VOICE_ID || "21m00Tcm4TlvDq8ikWAM";
  const ar = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": env.ELEVENLABS_API_KEY,
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text: script,
        model_id: "eleven_turbo_v2_5",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.35,
          use_speaker_boost: true,
        },
      }),
    }
  );
  if (!ar.ok) {
    console.error("ElevenLabs failed:", ar.status, await ar.text());
    process.exit(1);
  }
  const abuf = Buffer.from(await ar.arrayBuffer());
  const audioPath = path.join(os.tmpdir(), `_gg-${taskId}-audio.mp3`);
  fs.writeFileSync(audioPath, abuf);

  console.log("Muxing with ffmpeg...");
  const outPath = path.join(os.homedir(), "Desktop", "golden-glow-final.mp4");
  await new Promise((resolve, reject) => {
    const ff = spawn(ffmpegPath, [
      "-y",
      "-i", videoPath,
      "-i", audioPath,
      "-c:v", "copy",
      "-c:a", "aac",
      "-shortest",
      outPath,
    ]);
    let err = "";
    ff.stderr.on("data", (d) => (err += d.toString()));
    ff.on("close", (code) =>
      code === 0 ? resolve() : reject(new Error(err.slice(-600)))
    );
  });

  console.log(`\n✓ Saved: ${outPath}`);
})().catch((e) => {
  console.error("\nError:", e.message || e);
  process.exit(1);
});
