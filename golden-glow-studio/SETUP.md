# Setup Guide — Getting Your API Keys

This walks you through getting each API key needed. Plan for ~30 minutes for the first four, plus 1–3 days waiting for Meta App review.

---

## 1. Anthropic API Key (Claude — for script generation)

**Cost:** ~$0.05 per script with Claude Sonnet

1. Go to https://console.anthropic.com
2. Sign up (use the same email as your Claude.ai account if you have one)
3. Add a payment method under **Billing**
4. Go to **API Keys** → **Create Key**
5. Copy the key (starts with `sk-ant-...`)
6. Add to `.env.local`:
   ```
   ANTHROPIC_API_KEY=sk-ant-...
   ```

---

## 2. ElevenLabs (voiceover)

**Cost:** Starter plan $5/mo gets you 30k characters (~30 voiceovers)

1. Go to https://elevenlabs.io and sign up
2. Pick a paid plan (Starter $5/mo is enough to begin)
3. Go to **Voice Library** and find a voice you like for Golden Glow's brand
   - Recommended for warm/professional: "Rachel" or "Bella"
   - Recommended for energetic: "Antoni" or "Domi"
4. Click the voice → **Use voice** → copy the **Voice ID** (looks like `21m00Tcm4TlvDq8ikWAM`)
5. Go to **Profile → API Keys** → copy your API key
6. Add both to `.env.local`:
   ```
   ELEVENLABS_API_KEY=your_key_here
   ELEVENLABS_VOICE_ID=21m00Tcm4TlvDq8ikWAM
   ```

---

## 3. Runway ML (video generation)

**Cost:** $15/mo Standard plan = ~62 seconds of generation. Heavier use → $35/mo.

1. Go to https://dev.runwayml.com
2. Sign up (separate from regular Runway account)
3. Add payment, choose a plan
4. Go to **API Keys** → **Create Key**
5. Add to `.env.local`:
   ```
   RUNWAY_API_KEY=your_key_here
   ```

**Note:** Runway's API uses **Gen-3 Alpha Turbo** by default. Each 5-second clip costs ~5 credits ($0.05). A 30-second video stitched from 6 clips costs ~$0.30.

---

## 4. Meta Graph API (Instagram publishing)

This is the most involved. Plan ~1 hour active work + 1–3 days for app review.

### Step 4a: Convert Instagram to Business or Creator account

1. Open Instagram on your phone
2. Settings → Account → **Switch to Professional Account** → Business
3. Connect to a Facebook Page (create one if needed at facebook.com/pages/create)

### Step 4b: Create a Meta App

1. Go to https://developers.facebook.com
2. **My Apps** → **Create App** → choose **Business** type
3. Name it "Golden Glow Studio" (or anything)
4. Add the **Instagram Graph API** product

### Step 4c: Get long-lived access token

1. Go to https://developers.facebook.com/tools/explorer
2. Select your app
3. Add these permissions:
   - `instagram_basic`
   - `instagram_content_publish`
   - `pages_read_engagement`
   - `pages_show_list`
4. Click **Generate Access Token**
5. This token expires in 1 hour. To get a 60-day token, run this command (replace placeholders):

   ```bash
   curl -X GET "https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=YOUR_APP_ID&client_secret=YOUR_APP_SECRET&fb_exchange_token=YOUR_SHORT_TOKEN"
   ```
6. Copy the long-lived token

### Step 4d: Get your Instagram Business Account ID

```bash
curl -X GET "https://graph.facebook.com/v18.0/me/accounts?access_token=YOUR_LONG_LIVED_TOKEN"
```

This returns your Pages. Find your Page ID, then:

```bash
curl -X GET "https://graph.facebook.com/v18.0/YOUR_PAGE_ID?fields=instagram_business_account&access_token=YOUR_LONG_LIVED_TOKEN"
```

You'll get `instagram_business_account.id` — that's what you need.

### Step 4e: Add to .env.local

```
META_ACCESS_TOKEN=your_long_lived_token
META_INSTAGRAM_BUSINESS_ID=your_ig_business_id
META_APP_ID=your_app_id
META_APP_SECRET=your_app_secret
```

### Step 4f: Submit for App Review

For `instagram_content_publish`, Meta requires App Review. In the Meta dashboard:

1. **App Review** → **Permissions and Features**
2. Request `instagram_content_publish`
3. Provide use case: "Scheduled publishing of promotional video content for our cleaning business Instagram account"
4. Provide a screencast of your app working in dev mode
5. Submit — review takes 1–3 business days

**While waiting:** the API works for your own account in dev mode without review. You just can't publish to other accounts yet.

---

## 5. Vercel (hosting)

**Cost:** Free tier is fine to start

1. Go to https://vercel.com and sign up with GitHub
2. Push this code to a GitHub repo
3. In Vercel: **Add New → Project** → import the repo
4. Under **Environment Variables**, paste all your keys from `.env.local`
5. Deploy

Your app is now live at `your-project.vercel.app`.

---

## Token refresh reminder

Meta's long-lived token expires in 60 days. Set a calendar reminder to refresh it. (V2 enhancement: implement automatic token refresh in the backend.)

---

## Troubleshooting

**"ElevenLabs 401 unauthorized"** — Wrong API key or expired plan.
**"Runway: insufficient credits"** — Top up at runwayml.com or upgrade plan.
**"Instagram: invalid_parameter video_url"** — Video URL must be publicly accessible. Runway provides a public URL automatically; if you composite your own, host on Vercel Blob or S3 first.
**"Meta: permission denied"** — Either token expired, or `instagram_content_publish` not yet approved.
