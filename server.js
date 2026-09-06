const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const { Anthropic } = require("@anthropic-ai/sdk");

const app = express();
const PORT = process.env.PORT || 3000;

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const MODEL = "claude-3-5-sonnet-20241022";

if (!ANTHROPIC_API_KEY) {
  console.error("Missing ANTHROPIC_API_KEY environment variable. Set it at your Render service settings.");
}

app.use(cors());
app.use(express.json({ limit: "2mb" }));

// Friendly home route so clicking your Render link shows a success message instead of "Cannot GET /"
app.get("/", (req, res) => {
  res.status(200).send("Resume Genius API Proxy Server is Online.");
});

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 60, // Limit each IP to 60 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests right now. Please wait a few minutes and try again." }
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
