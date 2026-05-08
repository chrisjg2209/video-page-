// app/api/generate-video/route.js
// Kicks off a Runway generation. Returns a task ID we can poll.
//
// IMPORTANT: Runway's API is async — generation takes 60–180 seconds.
// We start the task here, return immediately, then the UI polls
// /api/check-video-status to know when it's done.
//
// We use the text_to_video endpoint with gen4_turbo, which doesn't require a
// reference image. (gen3a_turbo only supports image_to_video and would
// reject this request without a promptImage.)

import { DEMO_MODE } from "@/lib/demo";

export async function POST(request) {
  try {
    const { videoPrompt, duration = 10 } = await request.json();

    if (!videoPrompt) {
      return Response.json(
        { error: "videoPrompt is required." },
        { status: 400 }
      );
    }

    if (DEMO_MODE) {
      return Response.json({
        success: true,
        taskId: `demo-${Date.now()}`,
        status: "queued",
      });
    }

    const apiKey = process.env.RUNWAY_API_KEY;
    if (!apiKey) {
      return Response.json(
        { error: "RUNWAY_API_KEY is not configured." },
        { status: 500 }
      );
    }

    const response = await fetch("https://api.dev.runwayml.com/v1/text_to_video", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "X-Runway-Version": "2024-11-06",
      },
      body: JSON.stringify({
        model: "gen4.5",
        promptText: videoPrompt,
        duration: duration === 5 ? 5 : 10,
        ratio: "720:1280",
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("[Runway] error:", errText);
      return Response.json(
        { error: `Runway error: ${response.status} — ${errText}` },
        { status: 500 }
      );
    }

    const data = await response.json();

    return Response.json({
      success: true,
      taskId: data.id,
      status: "queued",
    });
  } catch (error) {
    console.error("[generate-video] error:", error);
    return Response.json(
      { error: error.message || "Failed to generate video" },
      { status: 500 }
    );
  }
}
