// app/api/check-video-status/route.js
// Polls Runway for the status of a generation task.
// The UI calls this every few seconds until status is "SUCCEEDED" or "FAILED".

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get("taskId");

    if (!taskId) {
      return Response.json({ error: "taskId is required." }, { status: 400 });
    }

    const apiKey = process.env.RUNWAY_API_KEY;
    if (!apiKey) {
      return Response.json(
        { error: "RUNWAY_API_KEY is not configured." },
        { status: 500 }
      );
    }

    const response = await fetch(
      `https://api.dev.runwayml.com/v1/tasks/${taskId}`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "X-Runway-Version": "2024-11-06",
        },
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      return Response.json(
        { error: `Runway status check failed: ${errText}` },
        { status: 500 }
      );
    }

    const data = await response.json();

    // status values: PENDING, RUNNING, SUCCEEDED, FAILED, CANCELLED, THROTTLED
    return Response.json({
      success: true,
      status: data.status,
      progress: data.progress || 0,
      videoUrl: data.output?.[0] || null,
      failure: data.failure || null,
    });
  } catch (error) {
    console.error("[check-video-status] error:", error);
    return Response.json(
      { error: error.message || "Failed to check status" },
      { status: 500 }
    );
  }
}
