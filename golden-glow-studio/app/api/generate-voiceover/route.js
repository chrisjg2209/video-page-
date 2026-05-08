// app/api/generate-voiceover/route.js
// Calls ElevenLabs to generate a real broadcast-quality voiceover.
// Returns the audio as base64 so the browser can play it directly.

import { DEMO_MODE, DEMO_AUDIO_URL } from "@/lib/demo";

export async function POST(request) {
  try {
    const { script } = await request.json();

    if (!script || script.trim().length < 5) {
      return Response.json({ error: "Script is required." }, { status: 400 });
    }

    if (DEMO_MODE) {
      return Response.json({ success: true, audioUrl: DEMO_AUDIO_URL, sizeBytes: 0 });
    }

    const voiceId = process.env.ELEVENLABS_VOICE_ID || "21m00Tcm4TlvDq8ikWAM";
    const apiKey = process.env.ELEVENLABS_API_KEY;

    if (!apiKey) {
      return Response.json(
        { error: "ELEVENLABS_API_KEY is not configured." },
        { status: 500 }
      );
    }

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": apiKey,
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

    if (!response.ok) {
      const errText = await response.text();
      console.error("[ElevenLabs] error:", errText);
      return Response.json(
        { error: `ElevenLabs error: ${response.status}` },
        { status: 500 }
      );
    }

    // Convert audio stream to base64 data URL the browser can play.
    const audioBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(audioBuffer).toString("base64");
    const dataUrl = `data:audio/mpeg;base64,${base64}`;

    return Response.json({
      success: true,
      audioUrl: dataUrl,
      sizeBytes: audioBuffer.byteLength,
    });
  } catch (error) {
    console.error("[generate-voiceover] error:", error);
    return Response.json(
      { error: error.message || "Failed to generate voiceover" },
      { status: 500 }
    );
  }
}
