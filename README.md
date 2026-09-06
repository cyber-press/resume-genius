# Resume Genius Proxy

A small backend that sits between the Resume Genius tool and Anthropic's API.
It holds your Anthropic API key server-side (never exposed to the browser)
and rate-limits requests so the publicly-shared tool can't run up an
unbounded bill.

## What it does

- Exposes one endpoint: `POST /api/messages`
- Forwards the request to `https://api.anthropic.com/v1/messages` with your
  API key attached server-side
- Forces the model and a max token cap server-side, regardless of what the
  frontend sends, so the proxy can't be tricked into requesting a more
  expensive model or larger response
- Only allows the `web_search` tool through - no other tools can be invoked
  via this proxy
- Rate-limits each IP to 60 requests per 15 minutes (a full Resume Genius
  run is roughly 10-14 requests, so this allows a couple of full runs plus
  retries per visitor)

## Deploy this on Render

1. **Push this folder to a GitHub repository** (public or private - Render
   can access either once connected to your GitHub account).

   ```bash
   cd resume-genius-proxy
   git init
   git add .
   git commit -m "Resume Genius proxy"
   git branch -M main
   git remote add origin <your-new-repo-url>
   git push -u origin main
   ```

2. **In the Render dashboard** (or hand the repo URL to Claude to do this
   step for you): create a new Web Service pointed at that repo, with:
   - Runtime: Node
   - Build command: `npm install`
   - Start command: `npm start`

3. **Set the environment variable** `ANTHROPIC_API_KEY` to your real
   Anthropic API key. Do this directly in the Render dashboard under your
   service's **Environment** tab, rather than pasting the key into a chat -
   Render env vars are encrypted at rest and never appear in your code.

4. Once deployed, Render gives you a URL like
   `https://resume-genius-proxy.onrender.com`. Your live endpoint is:

   ```
   https://resume-genius-proxy.onrender.com/api/messages
   ```

5. **Update the Resume Genius artifact**: change the `API_ENDPOINT` constant
   near the top of `resume-genius.jsx` to that URL, then re-publish the
   artifact.

## Note on the free plan

Render's free web service plan spins down after periods of inactivity and
takes a few seconds to wake back up on the next request. That means a
client's very first request after idle time may feel slow to start. If that
matters for your use case, Render's Starter plan keeps it always-on.
