// app/api/publish-instagram/route.js
// Publishes a video to Instagram via Meta Graph API.
// 
// The Meta Graph API publishing flow has TWO STEPS:
//   1. Create a media container with the video URL
//   2. Publish the container
// Step 1 returns a container ID that takes 30-60 seconds to "process"
// before step 2 can publish it.
//
// Required scopes: instagram_basic, instagram_content_publish
// Required: Instagram Business or Creator account linked to a Facebook Page
//
// This handles BOTH "publish now" and "schedule for later".
// For scheduling, we don't actually use Meta's scheduled_publish_time
// (limited to 75 days max and some accounts don't have access);
// instead we store the schedule in your own DB and trigger this route
// at the scheduled time via a Vercel Cron job. For v1 we just publish now
// or return the container ID for later manual publish.

import { DEMO_MODE } from "@/lib/demo";

export async function POST(request) {
  try {
    const { videoUrl, caption, hashtags = [], publishNow = true } = await request.json();

    if (!videoUrl) {
      return Response.json({ error: "videoUrl is required." }, { status: 400 });
    }

    if (DEMO_MODE) {
      return Response.json({
        success: true,
        mediaId: `demo-media-${Date.now()}`,
        message: "Demo publish — no real Instagram post was created.",
      });
    }

    const accessToken = process.env.META_ACCESS_TOKEN;
    const igBusinessId = process.env.META_INSTAGRAM_BUSINESS_ID;

    if (!accessToken || !igBusinessId) {
      return Response.json(
        { error: "Meta credentials are not configured." },
        { status: 500 }
      );
    }

    // Build the full caption with hashtags
    const fullCaption = [
      caption,
      "",
      hashtags.map((h) => `#${h}`).join(" "),
    ]
      .filter(Boolean)
      .join("\n");

    // STEP 1 — Create the media container
    const containerResponse = await fetch(
      `https://graph.facebook.com/v21.0/${igBusinessId}/media`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          media_type: "REELS",
          video_url: videoUrl,
          caption: fullCaption,
          access_token: accessToken,
        }),
      }
    );

    if (!containerResponse.ok) {
      const err = await containerResponse.text();
      console.error("[Meta container] error:", err);
      return Response.json(
        { error: `Meta container creation failed: ${err}` },
        { status: 500 }
      );
    }

    const containerData = await containerResponse.json();
    const containerId = containerData.id;

    if (!publishNow) {
      // Just return the container ID — caller can publish later
      return Response.json({
        success: true,
        containerId,
        status: "container_created",
        message: "Container ready. Call publish-instagram with publishNow=true and containerId to push live.",
      });
    }

    // STEP 2 — Wait for the container to finish processing.
    // Meta needs 30–60s to process video. We poll status.
    let attempts = 0;
    const maxAttempts = 30; // up to 90 seconds
    let containerStatus = "IN_PROGRESS";

    while (attempts < maxAttempts && containerStatus !== "FINISHED") {
      await new Promise((r) => setTimeout(r, 3000));
      const statusResp = await fetch(
        `https://graph.facebook.com/v21.0/${containerId}?fields=status_code&access_token=${accessToken}`
      );
      if (statusResp.ok) {
        const statusData = await statusResp.json();
        containerStatus = statusData.status_code;
        if (containerStatus === "ERROR" || containerStatus === "EXPIRED") {
          return Response.json(
            { error: `Container processing failed: ${containerStatus}` },
            { status: 500 }
          );
        }
      }
      attempts++;
    }

    if (containerStatus !== "FINISHED") {
      return Response.json(
        { error: "Container processing timed out. Try again." },
        { status: 504 }
      );
    }

    // STEP 3 — Publish the container
    const publishResponse = await fetch(
      `https://graph.facebook.com/v21.0/${igBusinessId}/media_publish`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creation_id: containerId,
          access_token: accessToken,
        }),
      }
    );

    if (!publishResponse.ok) {
      const err = await publishResponse.text();
      return Response.json(
        { error: `Meta publish failed: ${err}` },
        { status: 500 }
      );
    }

    const publishData = await publishResponse.json();

    return Response.json({
      success: true,
      mediaId: publishData.id,
      message: "Published to Instagram successfully.",
    });
  } catch (error) {
    console.error("[publish-instagram] error:", error);
    return Response.json(
      { error: error.message || "Failed to publish to Instagram" },
      { status: 500 }
    );
  }
}
