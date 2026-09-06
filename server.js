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

// Initialize Anthropic Client cleanly
const anthropic = new Anthropic({
  apiKey: ANTHROPIC_API_KEY,
});

app.use(cors());
app.use(express.json({ limit: "2mb" }));

// Friendly home route so clicking your Render link shows a success message instead of "Cannot GET /"
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
    const { messages, tools } = req.body;

    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS_CAP,
      messages: messages,
      ...(tools && { tools: tools })
    });

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
