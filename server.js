const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const { Anthropic } = require("@anthropic-ai/sdk");

const app = express();
const PORT = process.env.PORT || 3000;

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const MODEL = "claude-3-5-sonnet-20241022";
const MAX_TOKENS_CAP = 1200;

if (!ANTHROPIC_API_KEY) {
  console.error("Missing ANTHROPIC_API_KEY environment variable. Set it in your Render service settings.");
}

// Initialize Anthropic Client safely
const anthropic = new Anthropic({
  apiKey: ANTHROPIC_API_KEY || "dummy_placeholder_key_to_prevent_init_crash",
});

app.use(cors());
app.use(express.json({ limit: "2mb" }));

// Friendly home route so clicking your Render link shows a success message
app.get("/", (req, res) => {
  res.status(200).send("Resume Genius API Proxy Server is Online.");
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ ok: true });
});

// Global Rate Limiter: Allows a couple of full runs plus retries per IP in a 15-minute window
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 60, // Limit each IP to 60 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests right now. Please wait a few minutes and try again." }
});

app.use("/api/", limiter);

// The Core API Proxy Post Handler
app.post("/api/analyze", async (req, res) => {
  try {
    if (!ANTHROPIC_API_KEY) {
      return res.status(500).json({ error: "Server is not configured with an API key." });
    }

    const { messages, tools } = req.body || {};
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "Request must include a non-empty messages array." });
    }

    // Filter tools payload if required (ensures security guardrails)
    let activeTools = tools;
    if (Array.isArray(tools) && tools.length > 0) {
      // If filtering is preferred to restrict tools usage, handle it cleanly here:
      activeTools = tools.filter((t) => t && t.name === "web_search");
    }

    // Call the official Anthropic SDK safely using our configuration constants
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS_CAP,
      messages: messages,
      ...(activeTools && activeTools.length > 0 && { tools: activeTools })
    });

    // Extract text responses out cleanly for the frontend application wrapper
    const text = response.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();

    return res.status(200).json({ text });
  } catch (error) {
    console.error('Render Proxy Error:', error);
    return res.status(500).json({ error: 'Failed to process request with Claude.' });
  }
});

app.listen(PORT, () => {
  console.log(`Server executing securely on port ${PORT}`);
});
