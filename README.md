# 3D Spectacle Store

An immersive React + Three.js storefront for premium eyewear. This project is a complete front-end experience with a cinematic landing page, live 3D spectacle preview, a custom frame builder, product collections, and a slide-out cart.

## Features

- Real-time 3D spectacle rendering with scroll-driven scene updates
- Frame customization for style, frame color, lens color, engraving, and gold hinge accents
- Dynamic pricing for bespoke orders
- Product collection browsing and direct add-to-cart actions
- Cart drawer with quantity updates and item removal
- Motion-rich UI built with React, Three.js, GSAP, and Motion
- No API key required to run the UI locally

## Tech Stack

- React 19
- Vite
- TypeScript
- Three.js
- Tailwind CSS v4
- Motion
- Lucide React icons

## Getting Started

### Prerequisites

- Node.js 18 or newer

### Install

```bash
npm install
```

### Configure Environment

You do not need a Gemini API key to run the storefront UI.

If you want to match the AI Studio environment, you can optionally create a local `.env` or `.env.local` file:

```bash
APP_URL="http://localhost:3000"
```

`APP_URL` is useful for local links and callbacks, but the UI works without it.

### Run Locally

```bash
npm run dev
```

The app runs on `http://localhost:3000`.

## Available Scripts

- `npm run dev` - start the Vite development server
- `npm run build` - create a production build
- `npm run preview` - preview the production build locally
- `npm run lint` - run the TypeScript check
- `npm run clean` - remove generated build artifacts

## Project Structure

- `src/App.tsx` - top-level page composition and state management
- `src/components/SpecsCanvas.tsx` - 3D scene and scroll-synced spectacle render
- `src/components/CustomizerSection.tsx` - bespoke eyewear builder
- `src/components/ProductCollection.tsx` - featured product grid
- `src/components/CartDrawer.tsx` - shopping cart sidebar
- `src/components/Navbar.tsx` - floating navigation
- `src/components/TechHighlights.tsx` - product and brand highlights

## Notes

This repository was originally scaffolded in AI Studio, but the README now reflects the actual eyewear storefront experience in this codebase. The application is self-contained and does not require external API credentials for normal use.