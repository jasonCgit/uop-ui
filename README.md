# UOP UI

React frontend for the Unified Observability Portal. Built with Vite, MUI, and React 18.

## Quick Start

```bash
# Install dependencies
npm install

# Start dev server (requires uop-api running on port 8080)
npm run dev
```

The UI runs at `http://localhost:5174`. The Vite dev proxy forwards `/api` requests to `http://localhost:8080`.

## Project Structure

```
src/
  config.js          # API_URL runtime config
  main.jsx           # App entry point
  App.jsx            # Router and layout
  pages/             # Page components (Dashboard, Applications, Teams, etc.)
  components/        # Shared components (TopNav, modals, filters)
  aura/              # AURA AI assistant chat
  view-central/      # Configurable dashboard widgets
  tenant/            # Tenant/theme management
  data/              # Static frontend data
  utils/             # Helper utilities
public/
  env-config.js      # Runtime environment config (API_URL)
  favicon.svg
gifs/                # Demo GIFs
```

## API Configuration

The UI reads `API_URL` from `public/env-config.js` at runtime:

```js
// public/env-config.js
window.__ENV__ = {
  API_URL: "",  // Empty in dev (proxy handles it), set for production
};
```

**Dev mode**: Leave `API_URL` empty. Vite proxy forwards `/api/*` to `localhost:8080`.

**Production/CF**: Set `API_URL` to the deployed API (e.g. `https://uop-api.apps.cf.example.com`).

## Build

```bash
npm run build
```

Output goes to `dist/`. For CF deployment, the `Staticfile` buildpack serves from `dist/` with SPA pushstate routing.

## Cloud Foundry Deployment

```bash
npm run build
cf push
```

Uses `manifest.yml` with `staticfile_buildpack`. Before pushing, update `dist/env-config.js` with your API URL:

```js
window.__ENV__ = {
  API_URL: "https://uop-api.apps.cf.example.com",
};
```

## Running Both Repos Locally

```bash
# Terminal 1 — API
cd ../uop-api
uvicorn app.main:app --port 8080

# Terminal 2 — UI
cd ../uop-ui
npm run dev
```

Open `http://localhost:5174` in your browser.
