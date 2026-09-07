const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..");
const server = fs.readFileSync(path.join(root, "server.js"), "utf8");
const app = fs.readFileSync(path.join(root, "src", "App.tsx"), "utf8");
const api = fs.readFileSync(path.join(root, "src", "lib", "api.ts"), "utf8");
const resume = fs.readFileSync(path.join(root, "src", "lib", "resume.ts"), "utf8");
const frontend = [app, api, resume].join("\n");
const packageJson = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));

test("frontend is compiled and does not load runtime Babel or UMD React", () => {
  const index = fs.readFileSync(path.join(root, "index.html"), "utf8");
  assert.match(index, /type="module" src="\/src\/main\.tsx"/);
  assert.doesNotMatch(index, /text\/babel|babel-standalone|react\.production\.min\.js/);
  assert.equal(packageJson.scripts.build, "tsc -b && vite build");
});

test("frontend never calls Anthropic or reads a browser API key", () => {
  assert.doesNotMatch(frontend, /api\.anthropic\.com/);
  assert.doesNotMatch(frontend, /ANTHROPIC_API_KEY|anthropic_api_key|dangerous-direct-browser-access/);
});

test("fabricated fallback engine is absent", () => {
  assert.doesNotMatch(frontend, /parseResumeDynamic|Growth Enterprises|Professional Services Partnership|0\.8% unemployment/);
});

test("frontend requires consent and uses the configured secure proxy", () => {
  assert.match(api, /https:\/\/resume-genius-proxy\.onrender\.com\/api\/messages/);
  assert.match(app, /consent=\{consent\}/);
});

test("backend restricts origins and validates input", () => {
  assert.match(server, /ALLOWED_ORIGINS/);
  assert.match(server, /MAX_INPUT_CHARS/);
  assert.match(server, /web_search_20250305/);
  assert.match(server, /MAX_TOKENS_CAP = 4096/);
  assert.doesNotMatch(server, /app\.use\(cors\(\)\)/);
});

test("location parsing cannot consume the preceding resume line", () => {
  const sample = "Jordan Taylor\nSan Antonio, TX\nProfessional Summary";
  const match = sample.match(/(?:^|\n)\s*([A-Za-z][A-Za-z .'-]{1,30}),\s*([A-Z]{2})\b/m);
  assert.equal(match[1], "San Antonio");
  assert.equal(match[2], "TX");
  assert.match(resume, /\(\?:\^\|\\n\)\\s\*/);
});
