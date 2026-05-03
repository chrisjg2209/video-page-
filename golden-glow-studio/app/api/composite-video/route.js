// app/api/composite-video/route.js
// Takes a silent Runway video URL + a script, generates a voiceover with
// ElevenLabs, and muxes them into a single MP4 using ffmpeg. Returns the
// final MP4 as the response body so the UI can drop it straight into a
// <video> tag via URL.createObjectURL(blob).

import ffmpegPath from "ffmpeg-static";
import { spawn } from "child_process";
import { writeFile, readFile, unlink } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { randomUUID } from "crypto";
import { DEMO_MODE } from "@/lib/demo";

export const maxDuration = 300;

export async function POST(request) {
  let videoPath, audioPath, outputPath;
  try {
    const { videoUrl, script } = await request.json();

    if (!videoUrl || !script) {
      return Response.json(
        { error: "videoUrl and script are required." },
        { status: 400 }
      );
    }

    if (DEMO_MODE) {
      const r = await fetch(videoUrl);
      const buf = Buffer.from(await r.arrayBuffer());
      return new Response(buf, {
        headers: { "Content-Type": "video/mp4", "Content-Length": String(buf.length) },
      });
    }

    const elevenKey = process.env.ELEVENLABS_API_KEY;
    if (!elevenKey) {
      return Response.json(
        { error: "ELEVENLABS_API_KEY is not configured." },
        { status: 500 }
      );
    }
    const voiceId = process.env.ELEVENLABS_VOICE_ID || "21m00Tcm4TlvDq8ikWAM";

    const elevenResp = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": elevenKey,
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

    if (!elevenResp.ok) {
      const err = await elevenResp.text();
      return Response.json(
        { error: `ElevenLabs failed: ${elevenResp.status} ${err}` },
        { status: 500 }
      );
    }
    const audioBuffer = Buffer.from(await elevenResp.arrayBuffer());

    const videoResp = await fetch(videoUrl);
    if (!videoResp.ok) {
      return Response.json(
        { error: `Video download failed: ${videoResp.status}` },
        { status: 500 }
      );
    }
    const videoBuffer = Buffer.from(await videoResp.arrayBuffer());

    const id = randomUUID();
    const dir = tmpdir();
    videoPath = join(dir, `${id}-video.mp4`);
    audioPath = join(dir, `${id}-audio.mp3`);
    outputPath = join(dir, `${id}-output.mp4`);

    await writeFile(videoPath, videoBuffer);
    await writeFile(audioPath, audioBuffer);

    await new Promise((resolve, reject) => {
      const ff = spawn(ffmpegPath, [
        "-y",
        "-i", videoPath,
        "-i", audioPath,
        "-c:v", "copy",
        "-c:a", "aac",
        "-shortest",
        outputPath,
      ]);
      let stderr = "";
      ff.stderr.on("data", (d) => { stderr += d.toString(); });
      ff.on("error", reject);
      ff.on("close", (code) => {
        if (code === 0) resolve();
        else reject(new Error(`ffmpeg exited with code ${code}: ${stderr.slice(-500)}`));
      });
    });

    const outputBuffer = await readFile(outputPath);

    return new Response(outputBuffer, {
      headers: {
        "Content-Type": "video/mp4",
        "Content-Length": String(outputBuffer.length),
      },
    });
  } catch (e) {
    console.error("[composite-video] error:", e);
    return Response.json(
      { error: e.message || "Failed to composite video" },
      { status: 500 }
    );
  } finally {
    for (const p of [videoPath, audioPath, outputPath]) {
      if (p) await unlink(p).catch(() => {});
    }
  }
}
