// lib/demo.js
// When DEMO_MODE=true, every external API call (Claude, ElevenLabs, Runway,
// Meta) is short-circuited with a deterministic stub so the UI flow can be
// exercised end-to-end without any keys, network calls, or spend.

export const DEMO_MODE = process.env.DEMO_MODE === "true";

// 1-second silent MP3 — short, valid, plays cleanly in <audio>.
export const DEMO_AUDIO_URL =
  "data:audio/mpeg;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQwAADB8AhBNAAACzfgaC3PgAAQAAAAAA0AAAACABnZW5yZQAAAAAAAA==";

// Public sample MP4 — used as the "generated" video in demo mode.
export const DEMO_VIDEO_URL =
  "https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4";

export function demoScript({ description, tone, duration }) {
  const desc = description.trim();
  return {
    title: "Sparkling Move-Out Promise",
    hook: "Get every penny of your deposit back.",
    script:
      "Get every penny of your deposit back. At Golden Glow, our move-out cleaning leaves your place spotless from baseboards to ceiling fans. South Florida's most trusted team, on time, every time. Book your free quote today at goldenglow-jd.com.",
    wordCount: Math.round(duration * 2.2),
    scenes: [
      {
        timecode: "0:00–0:05",
        visual: "Empty apartment, sun streaming through clean windows, dust motes vanishing as a microfiber cloth wipes the sill.",
        voiceover: "Get every penny of your deposit back.",
        videoPrompt: "Cinematic slow dolly into an empty sunlit apartment, golden morning light streaming through freshly cleaned windows, dust particles glinting, photorealistic.",
      },
      {
        timecode: "0:05–0:15",
        visual: "Close-up of a gloved hand polishing a stainless steel faucet until it gleams.",
        voiceover: "At Golden Glow, our move-out cleaning leaves your place spotless from baseboards to ceiling fans.",
        videoPrompt: "Extreme close-up of a gloved hand polishing a chrome faucet, water droplets catching the light, slow camera push, hyperrealistic.",
      },
      {
        timecode: "0:15–0:25",
        visual: "Wide shot of a clean kitchen with a Golden Glow team smiling near the door.",
        voiceover: "South Florida's most trusted team, on time, every time.",
        videoPrompt: "Wide cinematic shot of a pristine modern kitchen, two friendly cleaners in branded uniforms standing near the doorway, soft warm lighting, shallow depth of field.",
      },
      {
        timecode: "0:25–0:30",
        visual: "Logo card with website URL.",
        voiceover: "Book your free quote today at goldenglow-jd.com.",
        videoPrompt: "Elegant logo reveal animation, gold gradient text reading 'Golden Glow' on a cream background, soft shimmer, premium brand feel.",
      },
    ],
    caption:
      "Move-out day done right.\nDeep clean, stress-free, deposit secured.\nBook your free quote at goldenglow-jd.com.",
    hashtags: [
      "moveoutcleaning",
      "deepclean",
      "fortlauderdale",
      "miamicleaning",
      "browardcounty",
      "goldenglow",
      "cleaningservice",
      "southflorida",
      "spotless",
      "movingout",
      "depositback",
      "homecleaning",
    ],
    cta: "Book your free quote today at goldenglow-jd.com.",
    musicVibe: "Warm acoustic indie-pop, light percussion, optimistic and uplifting — think morning coffee energy.",
    bestPostTime: "Tuesday 6:30 PM ET — South Florida renters scroll Instagram during evening commute downtime.",
    _demoMeta: { description: desc, tone, duration },
  };
}

// Simulate a Runway task progressing to SUCCEEDED over ~10 seconds.
const taskStarts = new Map();
export function demoTaskProgress(taskId) {
  if (!taskStarts.has(taskId)) {
    taskStarts.set(taskId, Date.now());
  }
  const elapsed = (Date.now() - taskStarts.get(taskId)) / 1000;
  if (elapsed < 10) {
    return { status: "RUNNING", progress: Math.min(elapsed / 10, 0.95) };
  }
  return { status: "SUCCEEDED", progress: 1 };
}
