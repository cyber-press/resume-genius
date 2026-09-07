# Resume Genius

Resume Genius is a static GitHub Pages frontend backed by a rate-limited Express proxy for Anthropic. Resume files are parsed in the browser; extracted text is sent to the proxy only after consent.

## Architecture

- `index.html` — authoritative browser application
- `config.js` — public backend endpoint configuration
- `server.js` — private-key API proxy for Render
- `privacy.html` and `terms.html` — user disclosures

The browser must never contain, request, or store an Anthropic API key.

## Local setup

1. Install backend dependencies with `npm ci`.
2. Copy `.env.example` to `.env` and set the values locally. Never commit `.env`.
3. Set `config.js` to the complete HTTPS proxy endpoint.
4. Run `npm start` for the backend and serve the static files with a local HTTP server.

## Required Render variables

```text
ANTHROPIC_API_KEY=<secret>
ALLOWED_ORIGINS=https://cyber-press.github.io
```

Render settings:

```text
Runtime: Node
Build command: npm ci
Start command: npm start
Health check path: /health
```

## GitHub Pages

The production site is served from the repository's configured Pages source. Before promotion, `config.js` must contain the verified Render endpoint:

```js
window.RESUME_GENIUS_CONFIG = Object.freeze({
  apiEndpoint: "https://your-service.onrender.com/api/messages",
});
```

## Security controls

- API key remains server-side.
- CORS is restricted through `ALLOWED_ORIGINS`.
- Requests are rate-limited and input-size limited.
- Client-supplied model and tool definitions are not trusted.
- AI response shapes are validated before rendering.
- Failed live analysis produces an error; the application does not fabricate fallback results.

## Verification

Run:

```bash
npm test
```

Production promotion requires a successful live `/health` check and a complete sample-resume run against the configured proxy.
