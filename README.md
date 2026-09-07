# Reply co-pilot
Human-in-the-loop WhatsApp reply drafter. A message comes in, you get one drafted.

- **Frontend**: `index.html` — vanilla HTML/CSS/JS, mobile-first, no build step.
- **Backend**: `api/reply.js` — calls Azure OpenAI (Responses API) server-side.
  The browser never sees the key. Runs as a Vercel serverless function in prod.
- **Dev server**: `server.js` — plain Node, no deps. Serves `index.html` and
  routes `POST /api/reply` into the same `api/reply.js` handler Vercel runs.

## Run locally

```bash
cp .env.example .env.local   # add your real key
npm run dev
```

Opens on http://localhost:3000.

Or with the Vercel CLI (`npm i -g vercel && vercel dev`) — same port, same handler.
