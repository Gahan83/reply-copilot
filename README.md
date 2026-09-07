# Reply co-pilot

Human-in-the-loop WhatsApp reply drafter. A message comes in, you get one drafted
reply in your voice. Nothing leaves until you approve it.

- **Frontend**: `index.html` — vanilla HTML/CSS/JS, mobile-first, no build step.
- **Backend**: `api/reply.js` — a Vercel serverless function that calls
  Azure OpenAI (Responses API) server-side. The browser never sees the key.

## Deploy to Vercel

1. **Push to GitHub**

   ```bash
   git init
   git add .
   git commit -m "Reply co-pilot"
   git branch -M main
   git remote add origin https://github.com/<you>/reply-copilot.git
   git push -u origin main
   ```

2. **Import into Vercel**
   - Go to [vercel.com/new](https://vercel.com/new) and import the repo.
   - Framework preset: **Other**. No build command, no output dir — Vercel serves
     `index.html` statically and `api/reply.js` as a function automatically.

3. **Add the environment variables**
   - Project → Settings → Environment Variables (copy values from the Azure portal
     deployment page):
     - `AZURE_OPENAI_ENDPOINT` = the full **Target URI** (includes `?api-version=...`)
     - `AZURE_OPENAI_KEY` = the **Key**
     - `AZURE_OPENAI_DEPLOYMENT` = `gpt-5.4-mini`
   - Redeploy so the variables take effect.

Done. Open the deployment URL on your phone — it's fully responsive.

## Run locally

```bash
npm i -g vercel
cp .env.example .env.local   # add your real key
vercel dev
```

Opens on http://localhost:3000 with the function wired up.

## Notes

- This app **drafts and copies** — it does not send. Wiring the approved reply to
  WhatsApp (e.g. via Baileys) is a separate step, intentionally kept out of the web app.
- Keep your API key out of git. `.env*.local` is already gitignored.
