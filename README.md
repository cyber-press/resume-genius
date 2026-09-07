# Resume Genius

Resume Genius turns resume evidence into marketable service ideas, current market research, source-backed leads, and an editable proposal. The frontend is a compiled React + TypeScript application; Anthropic requests pass through a restricted Express proxy so the API key never reaches the browser.

## Architecture

```text
src/
  components/       Typed UI building blocks
  lib/api.ts        Analysis workflow and proxy client
  lib/resume.ts     Local PDF, DOCX, and text extraction
  lib/proposal.ts   Editable proposal generator
server.js           Render-hosted API proxy
index.html          Vite entry point
privacy.html        Privacy disclosure
terms.html          Terms of use
```

PDF.js and Mammoth are compiled into lazy chunks and only downloaded when their file type is selected. No runtime JSX compiler or UMD framework scripts are used.

## Local development

Requirements: Node.js 20.19 or newer.

```bash
npm ci
npm run dev
```

The proxy runs separately:

```bash
cp .env.example .env
npm start
```

Never commit `.env` or expose `ANTHROPIC_API_KEY` to frontend code.

## Commands

```bash
npm run typecheck   # TypeScript validation
npm test            # Security and architecture regressions
npm run build       # Production compile to dist/
npm run check       # Full release gate
```

## Render backend

Required environment variables:

```text
ANTHROPIC_API_KEY=<secret>
ALLOWED_ORIGINS=https://cyber-press.github.io
```

Recommended service settings:

```text
Runtime: Node
Build command: npm ci
Start command: npm start
Health check path: /health
```

## GitHub Pages frontend

The workflow in `.github/workflows/deploy-pages.yml` runs the complete release gate, uploads `dist/`, and deploys it through GitHub Pages. In **Settings → Pages**, set the source to **GitHub Actions** before merging the compiled-frontend release.

Vite uses relative asset paths so the same build works at the GitHub Pages repository path and in isolated staging environments.

## Security and trust controls

- The API key remains server-side.
- CORS is restricted through `ALLOWED_ORIGINS`.
- Proxy requests are rate-limited and size-limited.
- Client-supplied model and unrestricted tool definitions are rejected.
- AI response shapes are validated before rendering.
- Live research sources are linked for user verification.
- Failed analysis returns an error; the app does not fabricate fallback results.

Before production promotion, run `npm run check`, verify `/health`, and complete a consented sample-resume analysis against the production proxy.
