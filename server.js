const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");

const app = express();

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const MODEL = "claude-sonnet-4-6";
const MAX_TOKENS_CAP = 1200;

if (!ANTHROPIC_API_KEY) {
  console.error("Missing ANTHROPIC_API_KEY environment variable. Set it in your Render service settings.");
}

app.use(cors());
app.use(express.json({ limit: "2mb" }));

// A full Resume Genius run is roughly 10-14 API calls (extraction, per-skill
// research, ranking, per-skill leads, proposal). This allows a couple of
// full runs plus retries per IP in a 15-minute window without opening the
// door to bulk automated abuse.
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests right now. Please wait a few minutes and try again." },
});
app.use("/api/", limiter);

app.get("/health", (req, res) => {
  res.json({ ok: true });
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

    const body = {
      model: MODEL,
      max_tokens: MAX_TOKENS_CAP,
      messages,
    };
    if (Array.isArray(tools) && tools.length > 0) {
      // Only allow the web_search tool through the proxy - nothing else.
      const allowedTools = tools.filter((t) => t && t.name === "web_search");
      if (allowedTools.length > 0) body.tools = allowedTools;
    }

    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(body),
    });

    const data = await anthropicRes.json();
    res.status(anthropicRes.status).json(data);
  } catch (err) {
    console.error("Proxy error:", err);
    res.status(502).json({ error: "Upstream request failed. Please try again." });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Resume Genius proxy listening on port " + PORT);
});
