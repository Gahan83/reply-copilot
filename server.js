// Local dev server — no deps, plain Node http.
// Serves index.html and routes POST /api/reply to the same handler Vercel runs
// (api/reply.js), so local and deployed behaviour stay identical.
//
// Run:  node server.js
// Open: http://localhost:3000

const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;

// Load .env.local (KEY=value, # comments) so `node server.js` works like `vercel dev`.
function loadEnv(file) {
  let raw;
  try { raw = fs.readFileSync(path.join(__dirname, file), "utf8"); } catch { return; }
  raw.split(/\r?\n/).forEach((line) => {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!m) return;
    const val = m[2].trim().replace(/^["']|["']$/g, "");
    if (!(m[1] in process.env)) process.env[m[1]] = val;
  });
}
loadEnv(".env.local");

const replyHandler = require("./api/reply.js");

const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json" };

// Minimal Vercel-style res shim so api/reply.js runs unchanged.
function shim(res) {
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (obj) => {
    res.writeHead(res.statusCode || 200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(obj));
  };
  return res;
}

const server = http.createServer((req, res) => {
  if (req.url.split("?")[0] === "/api/reply") {
    let body = "";
    req.on("data", (c) => { body += c; });
    req.on("end", () => {
      req.body = body;
      Promise.resolve(replyHandler(req, shim(res))).catch(() => {
        if (!res.writableEnded) shim(res).status(500).json({ error: "Handler crashed." });
      });
    });
    return;
  }

  const file = req.url.split("?")[0] === "/" ? "/index.html" : req.url.split("?")[0];
  const full = path.resolve(__dirname, '.' + path.posix.normalize(file));
  if (!full.startsWith(path.resolve(__dirname))) { res.writeHead(403); res.end('Forbidden'); return; }
  fs.readFile(full, (err, content) => {
    if (err) { res.writeHead(404); res.end("Not found"); return; }
    res.writeHead(200, { "Content-Type": TYPES[path.extname(full)] || "text/plain" });
    res.end(content);
  });
});

server.listen(PORT, () => console.log(`Reply co-pilot on http://localhost:${PORT}`));
