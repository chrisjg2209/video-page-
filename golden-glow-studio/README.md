# Golden Glow Video Studio

AI-powered video generation and Instagram publishing for Golden Glow cleaning company.

**Pipeline:** Description → Claude (script) → ElevenLabs (voiceover) → Runway ML (video) → Meta Graph API (Instagram)

---

## Prerequisites

You'll need accounts and API keys for:

| Service | Purpose | Cost | Where to get key |
|---------|---------|------|------------------|
| **Anthropic** | Script generation | Pay-as-you-go (~$0.05/script) | https://console.anthropic.com |
| **ElevenLabs** | Voiceover | $5–22/mo | https://elevenlabs.io/app/settings/api-keys |
| **Runway ML** | Video generation | $15–35/mo | https://dev.runwayml.com |
| **Meta** | Instagram publishing | Free | https://developers.facebook.com (see SETUP.md) |
| **Vercel** | Hosting | Free tier works | https://vercel.com |

**Estimated monthly cost: $30–60** depending on volume.

---

## Setup (5 steps)

### 1. Clone and install

```bash
npm install
```

### 2. Set up environment variables

Copy `.env.example` to `.env.local` and fill in your keys:

```bash
cp .env.example .env.local
```

Then edit `.env.local`:

```
ANTHROPIC_API_KEY=sk-ant-...
ELEVENLABS_API_KEY=...
ELEVENLABS_VOICE_ID=21m00Tcm4TlvDq8ikWAM
RUNWAY_API_KEY=...
META_ACCESS_TOKEN=...
META_INSTAGRAM_BUSINESS_ID=...
```

See `SETUP.md` for detailed instructions on getting each key.

### 3. Run locally

```bash
npm run dev
```

Open http://localhost:3000

### 4. Test the pipeline

1. Enter a description: *"30-second ad for our move-out cleaning service"*
2. Click Generate
3. Review the script + storyboard
4. Preview the voiceover (real ElevenLabs audio)
5. Generate the video (Runway, takes ~2 min)
6. Schedule the Instagram post

### 5. Deploy to Vercel

```bash
npm install -g vercel
vercel
```

Add your environment variables in the Vercel dashboard under **Settings → Environment Variables**.

---

## Architecture

```
┌──────────────┐
│   Browser    │  ← React UI (your "Studio" interface)
└──────┬───────┘
       │
       ▼
┌──────────────────────────────────────────┐
│         Next.js API Routes               │  ← Keys live here, NEVER in browser
│  ┌────────────────────────────────────┐  │
│  │ /api/generate-script    → Claude   │  │
│  │ /api/generate-voiceover → 11Labs   │  │
│  │ /api/generate-video     → Runway   │  │
│  │ /api/check-video-status → Runway   │  │
│  │ /api/publish-instagram  → Meta     │  │
│  └────────────────────────────────────┘  │
└──────────────────────────────────────────┘
```

Why a backend matters: **never put API keys in browser code**. Anyone could steal them and rack up your bills. All key-protected calls go through `/api/*` routes which only run on the server.

---

## File structure

```
golden-glow-studio/
├── app/
│   ├── page.jsx                    # Main UI
│   ├── layout.jsx
│   ├── globals.css
│   └── api/
│       ├── generate-script/route.js
│       ├── generate-voiceover/route.js
│       ├── generate-video/route.js
│       ├── check-video-status/route.js
│       └── publish-instagram/route.js
├── lib/
│   └── prompts.js                  # Claude prompt templates
├── .env.example
├── .env.local                      # YOUR keys (never commit!)
├── SETUP.md                        # Step-by-step API key setup
├── package.json
└── README.md
```

---

## Important notes

- **Test in dev mode first.** Each video generation costs ~$0.50–$1 in Runway credits. Mock it during UI work.
- **Instagram requires a Business/Creator account** connected to a Facebook Page.
- **Meta App review** can take 1–3 business days for first-time setup.
- **The Runway API runs async** — videos take 60–180s. The UI polls for completion.
- **Voiceover audio is overlaid in post-processing.** Currently the UI generates them separately; a v2 enhancement would composite them with FFmpeg before upload.

See `SETUP.md` for detailed walkthroughs of each service.
