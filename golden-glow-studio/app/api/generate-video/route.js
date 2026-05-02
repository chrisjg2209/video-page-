// app/api/generate-video/route.js
// Kicks off a Runway Gen-3 generation. Returns a task ID we can poll.
//
// IMPORTANT: Runway's API is async — generation takes 60–180 seconds.
// We start the task here, return immediately, then the UI polls
// /api/check-video-status to know when it's done.
//
// For multi-scene videos, you'd loop this for each scene and stitch
// with FFmpeg. To keep this v1 simple, we generate ONE 10-second clip
// using the strongest scene from the storyboard. Future v2: stitch all scenes.

export async function POST(request) {
  try {
    const { videoPrompt, duration = 10 } = await request.json();

    if (!videoPrompt) {
      return Response.json(
        { error: "videoPrompt is required." },
        { status: 400 }
      );
    }

    const apiKey = process.env.RUNWAY_API_KEY;
    if (!apiKey) {
      return Response.json(
        { error: "RUNWAY_API_KEY is not configured." },
        { status: 500 }
      );
    }

    // Runway Gen-3 Alpha Turbo — text to video
    // Docs: https://docs.dev.runwayml.com
    const response = await fetch("https://api.dev.runwayml.com/v1/image_to_video", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "X-Runway-Version": "2024-11-06",
      },
      body: JSON.stringify({
        model: "gen3a_turbo",
        promptText: videoPrompt,
        duration: duration === 5 ? 5 : 10, // Runway supports 5 or 10s
        ratio: "768:1280", // vertical for Instagram Reels
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
