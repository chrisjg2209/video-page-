// app/api/generate-script/route.js
import Anthropic from "@anthropic-ai/sdk";
import { SCRIPT_PROMPT } from "@/lib/prompts";
import { DEMO_MODE, demoScript } from "@/lib/demo";

const TONES = {
  warm: { label: "Warm & inviting", desc: "Friendly neighborhood feel" },
  luxury: { label: "Premium & refined", desc: "Upscale clientele" },
  energetic: { label: "Bright & energetic", desc: "Bold and memorable" },
  trustworthy: { label: "Calm & trustworthy", desc: "Reassuring tone" },
};

export async function POST(request) {
  try {
    const { description, tone = "warm", duration = 30 } = await request.json();

    if (!description || description.trim().length < 10) {
      return Response.json(
        { error: "Description must be at least 10 characters." },
        { status: 400 }
      );
    }

    if (DEMO_MODE) {
      return Response.json({ success: true, data: demoScript({ description, tone, duration }) });
    }

    const toneConfig = TONES[tone] || TONES.warm;

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 2500,
      messages: [
        {
          role: "user",
          content: SCRIPT_PROMPT({ description, tone: toneConfig, duration }),
        },
      ],
    });

    const text = message.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("");

    // Strip any accidental markdown fencing
    const clean = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);

    return Response.json({ success: true, data: parsed });
  } catch (error) {
    console.error("[generate-script] error:", error);
    return Response.json(
      { error: error.message || "Failed to generate script" },
      { status: 500 }
    );
  }
}
