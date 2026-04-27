# Deployment Guide — Zip2Git

This project is a Vite + React (SPA) app. It is configured to deploy out-of-the-box on **Netlify** and **Vercel**.

## Netlify

Either:

1. Drag-and-drop the project folder into Netlify, **or**
2. Connect the Git repo. Netlify auto-detects the included `netlify.toml`:
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Node version: `20`
   - SPA fallback redirect: `/* -> /index.html (200)`

## Vercel

Connect the Git repo. Vercel reads the included `vercel.json`:

- Framework: `vite`
- Build command: `npm run build`
- Output directory: `dist`
- Install command: `npm install --legacy-peer-deps`
- SPA rewrite for client-side routing

## Local Development

```bash
npm install
npm run dev      # start dev server
npm run build    # build for production -> ./dist
npm run preview  # preview the production build
```

## What Was Fixed

- Added `netlify.toml` and `vercel.json` so both platforms know the build command, output directory and SPA redirects.
- Added `.nvmrc` (Node 20) for reproducible builds.
- Cleaned `vite.config.ts`: gated all Replit-only plugins behind `REPL_ID` + non-production checks, and made the import errors swallow gracefully so they never break a production build.
- Removed the broken `@assets` alias that pointed to a path outside the project (used only by the Replit workspace).
- Output directory standardized to `dist` (was `dist/public`).
- Replit-only plugins moved to `optionalDependencies` so install never fails on platforms where they are not strictly required.
- Fixed broken `favicon.png` reference in `index.html` (file was `favicon.svg`).
- Renamed package from the workspace-scoped `@workspace/zip2git` to plain `zip2git`.
