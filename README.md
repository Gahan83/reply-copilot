# Reply co-pilot
Human-in-the-loop WhatsApp reply drafter. A message comes in, you get one drafted.

- **Frontend**: `index.html` — vanilla HTML/CSS/JS, mobile-first, no build step.
- **Backend**: `api/reply.js` — a Vercel serverless function that calls
  Azure OpenAI (Responses API) server-side. The browser never sees the key.

## Run locally

```bash
npm i -g vercel
cp .env.example .env.local   # add your real key
vercel dev
```

Opens on http://localhost:3000 with the function wired up.

