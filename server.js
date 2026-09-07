const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const Anthropic = require("@anthropic-ai/sdk");
const helmet = require("helmet");
const crypto = require("node:crypto");

const app = express();

// Render sits behind a reverse proxy that sets X-Forwarded-For. Without this,
// express-rate-limit can't safely determine real client IPs and refuses to
// start rate limiting (ERR_ERL_UNEXPECTED_X_FORWARDED_FOR).
app.set("trust proxy", 1);

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const MODEL = "claude-sonnet-5";
const MAX_TOKENS_CAP = 1200;
const MAX_INPUT_CHARS = 80000;
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "https://cyber-press.github.io")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

if (!ANTHROPIC_API_KEY) {
  console.error("Missing ANTHROPIC_API_KEY environment variable. Set it in your Render service settings.");
}

const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY, timeout: 45000, maxRetries: 0 });

app.disable("x-powered-by");
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use((req, res, next) => {
  req.id = req.get("x-request-id") || crypto.randomUUID();
  res.set("x-request-id", req.id);
  next();
});
app.use(cors({
  origin(origin, callback) {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    return callback(new Error("Origin is not allowed"));
  },
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "X-Request-ID"],
}));
app.use(express.json({ limit: "256kb", type: "application/json" }));

// A full Resume Genius run is roughly 10-14 API calls (extraction, per-skill
// research, ranking, per-skill leads, proposal). This allows a couple of
// full runs plus retries per IP in a 15-minute window without opening the
// door to bulk automated abuse.
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests right now. Please wait a few minutes and try again." },
});
app.use("/api/", limiter);

app.get("/health", (req, res) => {
  if (!ANTHROPIC_API_KEY) return res.status(503).json({ ok: false, configured: false });
  res.json({ ok: true, configured: true });
});

app.post("/api/messages", async (req, res) => {
  try {
    if (!ANTHROPIC_API_KEY) {
      return res.status(500).json({ error: "Server is not configured with an API key." });
    }

    const { messages, tools } = req.body || {};
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "Request must include a non-empty messages array." });
    }
    if (messages.length > 8 || messages.some((message) => !message || !["user", "assistant"].includes(message.role) || typeof message.content !== "string")) {
      return res.status(400).json({ error: "Messages have an invalid format." });
    }
    const inputChars = messages.reduce((total, message) => total + message.content.length, 0);
    if (inputChars > MAX_INPUT_CHARS) {
      return res.status(413).json({ error: "Request content is too large." });
    }

    const requestBody = {
      model: MODEL,
      max_tokens: MAX_TOKENS_CAP,
      messages,
    };

    if (Array.isArray(tools) && tools.length > 0) {
      // Only allow the web_search tool through the proxy - nothing else.
      const wantsWebSearch = tools.some((tool) => tool && tool.name === "web_search");
      if (wantsWebSearch) {
        requestBody.tools = [{ type: "web_search_20250305", name: "web_search", max_uses: 4 }];
      }
    }

    const message = await anthropic.messages.create(requestBody);
    res.status(200).json(message);
  } catch (err) {
    console.error(JSON.stringify({ level: "error", requestId: req.id, message: err?.message || "Proxy error", status: err?.status || 502 }));
    // The SDK throws typed errors with a `status` property matching the
    // upstream HTTP status (429 rate limit, 529 overloaded, etc). Pass that
    // through so the frontend's retry logic can react correctly.
    const status = err && err.status ? err.status : 502;
    const publicStatus = Number.isInteger(status) && status >= 400 && status < 600 ? status : 502;
    const detail = publicStatus === 429 ? "The analysis service is busy. Please wait and retry." : "The analysis service could not complete the request.";
    res.status(publicStatus).json({ error: { message: detail, requestId: req.id } });
  }
});

app.use((err, req, res, next) => {
  console.error(JSON.stringify({ level: "error", requestId: req.id, message: err?.message || "Request error" }));
  if (res.headersSent) return next(err);
  res.status(err?.type === "entity.too.large" ? 413 : 403).json({ error: "Request rejected.", requestId: req.id });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Resume Genius proxy listening on port " + PORT);
});
