// lib/prompts.js
// Central place to manage all Claude prompts. Easy to tweak voice & quality.

export const BUSINESS_CONTEXT = `Golden Glow is a residential cleaning company in South Florida (goldenglow-jd.com), offering:
- Deep cleaning
- Standard maintenance cleaning
- Move-in / move-out cleaning
Custom quote-based pricing with a live estimator on the website.
Voice: warm, professional, locally rooted, trustworthy.`;

export const SCRIPT_PROMPT = ({ description, tone, duration }) => `You are a senior creative director producing a ${duration}-second Instagram promotional video for Golden Glow.

BUSINESS CONTEXT:
${BUSINESS_CONTEXT}

OWNER'S BRIEF:
"${description}"

TONE DIRECTION: ${tone.label} — ${tone.desc}

Produce a complete production package. Return ONLY a valid JSON object — no markdown fences, no preamble, no commentary. Use this exact shape:

{
  "title": "internal working title for this video (5-8 words)",
  "hook": "the opening 3-second hook line — punchy, scroll-stopping",
  "script": "the FULL voiceover script as one continuous block. Natural spoken cadence with commas for breath. Include the hook at the start. End with a clear call to action mentioning Golden Glow. Word count must match the duration: roughly 2-2.5 words per second.",
  "wordCount": estimated_word_count_as_number,
  "scenes": [
    {
      "timecode": "0:00–0:03",
      "visual": "specific, filmable description of what's on screen — concrete details a video model can render",
      "voiceover": "exact words said over this scene",
      "videoPrompt": "an OPTIMIZED prompt for Runway ML Gen-3 — cinematic, specific shot type, lighting, motion. Example style: 'Cinematic close-up of sunlight glinting off a freshly polished granite countertop, slow camera dolly forward, golden hour light, photorealistic'"
    }
    /* 4–6 scenes total covering the full duration */
  ],
  "caption": "Instagram caption — 2 to 4 short lines with line breaks, ending in CTA with goldenglow-jd.com",
  "hashtags": ["array", "of", "10-12", "hashtags", "no #", "mix of broad cleaning + South Florida local like fortlauderdale, miamicleaning, browardcounty"],
  "cta": "the one-line call to action used at the end of the script",
  "musicVibe": "1-line description of the music/sound track that should go under this — genre, energy, instruments",
  "bestPostTime": "suggested best posting time in ET, with a 1-sentence reason"
}

CRITICAL: videoPrompt fields must be optimized for AI video generation — concrete subjects, lighting, camera movement, and style cues. Avoid abstract concepts. Each clip is exactly 5 seconds.`;
