const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const parser = require("@babel/parser");

const root = path.resolve(__dirname, "..");
const index = fs.readFileSync(path.join(root, "index.html"), "utf8");
const server = fs.readFileSync(path.join(root, "server.js"), "utf8");

test("frontend never calls Anthropic or reads a browser API key", () => {
  assert.doesNotMatch(index, /api\.anthropic\.com/);
  assert.doesNotMatch(index, /ANTHROPIC_API_KEY/);
  assert.doesNotMatch(index, /anthropic_api_key/);
  assert.doesNotMatch(index, /dangerous-direct-browser-access/);
});

test("fabricated fallback engine is removed", () => {
  assert.doesNotMatch(index, /parseResumeDynamic/);
  assert.doesNotMatch(index, /Growth Enterprises/);
  assert.doesNotMatch(index, /Professional Services Partnership/);
  assert.doesNotMatch(index, /0\.8% unemployment/);
});

test("frontend requires consent and a configured proxy", () => {
  assert.match(index, /https:\/\/resume-genius-proxy\.onrender\.com\/api\/messages/);
  assert.match(index, /checked=\{consent\}/);
  assert.match(index, /!consent/);
});

test("backend restricts origins and validates input", () => {
  assert.match(server, /ALLOWED_ORIGINS/);
  assert.match(server, /MAX_INPUT_CHARS/);
  assert.match(server, /web_search_20250305/);
  assert.doesNotMatch(server, /app\.use\(cors\(\)\)/);
});

test("embedded frontend JavaScript and JSX parse successfully", () => {
  const match = index.match(/<script type="text\/babel">([\s\S]*?)<\/script>/);
  assert.ok(match, "embedded application script was not found");
  assert.doesNotThrow(() => parser.parse(match[1], { sourceType: "script", plugins: ["jsx"] }));
});
