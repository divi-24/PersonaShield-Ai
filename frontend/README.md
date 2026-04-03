# PersonaShield AI (demo)

Frontend-only identity protection console: simulated deepfake detection, identity matching, legal proof PDFs, marketplace, alerts, and an AI legal chat. No backend; state persists in `localStorage`.

## Stack

React (Vite), TypeScript, Tailwind CSS v4, Radix-based UI primitives, Framer Motion, React Router, jsPDF.

## Scripts

```bash
npm install
npm run dev      # http://localhost:5173
npm run build
npm run preview
```

## Demo flow

1. **Landing** → “Protect your identity” or “Launch console”.
2. **Identity** → name + face image + voice file → “Identity Secured”.
3. **Deepfake Scan** → Analyze (2–3s) → **Results** (verdict, face/voice match, deepfake risk, authenticity).
4. **Legal Proof** → Generate report → PDF download + print-friendly view.
5. **Overview** → “Simulate security alert” for the banner.

## Deploy (Vercel)

Import the repo, set **Framework Preset** to Vite, **Root** to this folder if needed. `vercel.json` includes SPA rewrites for client routes.

## Legal

All outputs are simulated for demonstration only and are not legal advice or forensic evidence.
