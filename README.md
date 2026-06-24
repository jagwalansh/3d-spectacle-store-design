# 3D Spectacle Store

An immersive React + Three.js storefront for premium eyewear. The app combines a cinematic landing page, a live 3D spectacle preview, a custom frame builder, product collections, and a slide-out cart experience.

## Features

- Real-time 3D spectacle rendering with scroll-driven scene updates
- Frame customization for style, frame color, lens color, engraving, and gold hinge accents
- Dynamic pricing for bespoke orders
- Product collection browsing and direct add-to-cart actions
- Cart drawer with quantity updates and item removal
- Motion-rich UI built with React, Three.js, GSAP, and Motion

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

Create a local `.env` or `.env.local` file if you want to run the app outside of the hosted AI Studio environment:

```bash
GEMINI_API_KEY="your_gemini_api_key"
APP_URL="http://localhost:3000"
```

`GEMINI_API_KEY` is required for Gemini API calls. `APP_URL` is useful for local links and callbacks.

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

This repository was originally scaffolded in AI Studio, but the README now reflects the actual eyewear storefront experience in this codebase.