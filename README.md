# TALENT_RADAR.OS 🌐⚡

> **Next-Generation 3D Geospatial Career Intelligence, Quantitative Market Analytics, Autonomous AI Triad & Commercial M&A Platform**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61dafb?logo=react)](https://react.dev/)
[![Three.js](https://img.shields.io/badge/Three.js-3D_Globe-black?logo=three.js)](https://threejs.org/)
[![D3.js](https://img.shields.io/badge/D3.js-Skill_Tree-orange?logo=d3.js)](https://d3js.org/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-v4-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)

---

## 🚀 Overview

**TALENT_RADAR.OS** is a high-performance career intelligence and talent reconnaissance console engineered for staff+ engineers, quantitative researchers, founders, and tech executives targeting high-yield opportunities ($250k–$600k+).

It blends interactive 3D geospatial visualization, econometric salary modeling, autonomous multi-agent AI workflows, and zero-knowledge anonymous networking into a single tactical operating system.

---

## ✨ Key Features & Capabilities

### 1. 🌍 Interactive 3D Geospatial Requisition Radar
- **Interactive Three.js 3D Globe**: Rotating world sphere plotting verified high-yield opportunities in tech capital hubs (SF Bay Area, New York, London, Zurich, Tokyo, Singapore).
- **Floating Continental Nodes**: Click or hover over floating nodes to trigger responsive HUD tooltips displaying local median salaries, top-paying sectors, and cost-of-living index multipliers.
- **Dynamic Requisition Filtering**: Filter live roles by title, keyword, location, and salary band ($0 to $500k+).
- **Simulated Job Alert Subscriptions**: Subscribe to instant browser alerts and receive simulated notifications for new matching requisitions.

### 2. 📈 Quantitative Market Analytics & 1-Click CSV Export
- **Multi-Sector Salary Trajectories (2020–2027)**: Realized historical data (2020–2025) and calibrated forward forecasts (2026–2027) across 6 high-growth domains:
  - Frontier AI & Accelerated Compute
  - Quantitative Finance & High-Frequency Trading (HFT)
  - Autonomous Systems & Robotics
  - Distributed Cloud Systems
  - Cyber Defense & Zero Trust
  - Computational Biology & ML
- **Multi-Currency Real-Time Calculation**: Seamlessly toggle between `USD ($)`, `EUR (€)`, `GBP (£)`, and `CHF (Fr.)`.
- **Export Data Button**: 1-click download of filtered compensation models, percentile distributions (25th, Median, 75th, 90th), and metropolitan benchmarks as clean, formatted CSV spreadsheets.

### 3. 🌳 Interactive D3 Force-Directed Skill Tree
- **Node-Based Progression Graph**: Interactive D3.js visualization mapping technical skills, prerequisites, and experience progression gates toward distinguished engineer & executive roles.
- **Skill Premium Deliberation**: Real-time market premium indicators (e.g., distributed cluster sharding at +32%, Triton/CUDA optimization at +28%).

### 4. 🤖 Autonomous 4-Agent AI Triad
- **Commander**: Issues high-level strategic directives and audits mission deliverables.
- **Scout**: Probes talent exchanges and intercepts hidden requisitions.
- **Strategist**: Computes competency delta models and 5-year compensation yields.
- **Envoy**: Drafts tactical counter-offers, concessions, and high-leverage compensation negotiation scripts.
- **Inter-Agent Message Bus**: Real-time collaborative autonomous cycles with telemetry HUD.

### 5. 🛡️ StealthNet: Zero-Knowledge Anonymous Talent Mesh
- **Anonymous Cryptographic Beacons**: Broadcast verified senior engineering capabilities without revealing name, email, or current employer.
- **Direct Anonymous Outreach**: Engage directly with hiring engineering directors without recruiter spam.

### 6. 💰 Financial Platform & $145K Commercial M&A Listing
- **Total Target Compensation (TTC) Engine**: 4-year equity vesting schedules, performance bonus curves, and cliff simulation.
- **Global Tax Arbitrage Calculator**: Net take-home comparisons across 10 tax jurisdictions (California, New York, UK, Switzerland, Singapore, UAE, etc.).
- **Commercial Buyout Escrow Pipeline**: Turnkey app acquisition dossier valued at $145,000 with Stripe, Escrow.com, and USDC routing.

### 7. 📣 Public Growth, Viral Ads & TimeBucks Micro-Tasks
- **Pre-formatted Ad Campaigns**: 1-click sharing copy for X (Twitter), LinkedIn, WhatsApp, and Telegram.
- **TimeBucks Task Engine**: Ready-to-deploy micro-task templates with automated worker verification proof codes.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons
- **Visualizations**: Three.js, React Three Fiber, D3.js v7, Recharts
- **Backend**: Node.js, Express, tsx
- **AI Integration**: Google GenAI SDK (`@google/genai` Gemini 3.8 Flash)
- **Utilities**: JSZip (1-click codebase ZIP export), Canvas API, LocalStorage State Engines

---

## 📥 Quick Start & Local Setup

### Prerequisites
- Node.js (v18 or higher recommended)
- npm or bun

### 1. Clone the Repository
```bash
git clone https://github.com/<your-username>/talent-radar-os.git
cd talent-radar-os
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env` file in the project root (or copy `.env.example`):
```bash
cp .env.example .env
```
Add your optional Google Gemini API key:
```env
PORT=3000
GEMINI_API_KEY=your_gemini_api_key_here
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Production Build & Docker Container
```bash
# Build production bundle
npm run build
npm start

# Or run using Docker container:
docker build -t talent-radar-os .
docker run -p 3000:3000 talent-radar-os
```

---

## ☁️ Cloud Production Environment & DNS Integration

This application is configured for continuous zero-downtime deployment on **Google Cloud Platform (GCP) Cloud Run** integrated with custom domain DNS routing:

### 1. Production Architecture
- **Host**: Google Cloud Run (Fully managed serverless container runtime)
- **Region**: `europe-west2` (London Edge, UK)
- **Live Production URL**: `https://ais-pre-keikksd2dcsi4qe6bzstuj-50566079524.europe-west2.run.app`
- **Security & Cryptography**: Automatic TLS 1.3 / 256-bit AES-GCM certificates provisioned via Google Trust Services
- **Scaling Policy**: 0 to 10 instances with automatic traffic splitting

### 2. Custom Domain & DNS Mapping Guide
To bind your own branded domain (e.g., `talentradar.ai` or `app.yourcompany.com`):

| Record Type | Host / Name | Target Value | Proxy Status |
| :--- | :--- | :--- | :--- |
| **CNAME** | `app` (or `@`) | `ais-pre-keikksd2dcsi4qe6bzstuj-50566079524.europe-west2.run.app` | Cloudflare Proxied (Orange Cloud) |
| **TXT** | `_cloud-run-challenge` | `talent-radar-verification=gcprun-prod-auth-2026` | DNS Only |

*Pro Tip: When using Cloudflare, enable the Orange-Cloud proxy for instant worldwide Anycast CDN caching and DDoS mitigation.*

### 3. Automated GitHub Actions CI/CD Workflow (`.github/workflows/deploy.yml`)
Every `git push origin main` triggers an automated deployment pipeline:
1. **Lint & Test**: Runs `npm run lint` and TypeScript type verification.
2. **Container Build**: Compiles client assets and builds multi-stage `Dockerfile`.
3. **Artifact Registry**: Pushes image to Google Artifact Registry (`europe-west2-docker.pkg.dev`).
4. **Cloud Run Rollout**: Zero-downtime rolling update deployed to production.
5. **Health Verification**: Verifies `/api/cloud/status` endpoint.

**Required GitHub Secrets** (in Repository Settings &rarr; Secrets & Variables &rarr; Actions):
- `GCP_PROJECT_ID`: Your Google Cloud project ID
- `GCP_SA_KEY`: Google Service Account JSON credentials with Cloud Run Admin & Artifact Registry Writer roles

---

## 📂 Project Architecture

```
├── .env.example              # Environment variables template
├── .gitignore                # Git ignore rules
├── index.html                # HTML entry point with OpenGraph & Schema.org tags
├── metadata.json             # AI Studio applet configuration & permissions
├── package.json              # Project dependencies & scripts
├── README.md                 # Complete project documentation & guide
├── server.ts                 # Full-stack Express server with Vite middleware
├── tsconfig.json             # TypeScript configuration
├── vite.config.ts            # Vite bundler configuration
└── src/
    ├── App.tsx               # Main application container & tab router
    ├── main.tsx              # React DOM entry point
    ├── index.css             # Tailwind CSS & global tactical styling
    ├── components/
    │   ├── Header.tsx                 # Tactical top navigation bar & quick actions
    │   ├── RadarTab.tsx               # 3D globe container, filters & job list
    │   ├── RadarGlobe3D.tsx           # Interactive Three.js globe with continent tooltips
    │   ├── MarketAnalyticsTab.tsx     # Recharts multi-sector trends & CSV exporter
    │   ├── CareerTab.tsx              # Career roadmap & skill tree host
    │   ├── InteractiveSkillTree.tsx   # D3 force-directed node graph
    │   ├── AISupervisorTab.tsx        # 4-Agent Triad console & inter-agent bus
    │   ├── StealthNetTab.tsx          # Anonymous ZK talent mesh & beacons
    │   ├── FinancialPlatformTab.tsx   # TTC modeling, tax matrix & $145K M&A buyout
    │   ├── GrowthAdHubTab.tsx         # Public viral campaigns & TimeBucks tasks
    │   ├── NewsTab.tsx                # Market intelligence & sector signals
    │   ├── ExternalCommsTab.tsx       # Live communication interception feed
    │   ├── BookmarksTab.tsx           # Saved requisitions & career roadmaps
    │   ├── GuidedTour.tsx             # Interactive 6-step walkthrough modal
    │   ├── AuthenticUrlModal.tsx      # Verified Cloud Run URL & QR codes
    │   ├── GithubRepoModal.tsx        # In-app GitHub repository & ZIP export tool
    │   ├── KickstartModal.tsx         # System kickstart & activation console
    │   └── PaywallModal.tsx           # Tiered clearance upgrade modal
    ├── context/
    │   ├── JobAlertsContext.tsx       # Real-time alert subscription state
    │   ├── SavedItemsContext.tsx      # Bookmarked jobs, paths & news state
    │   └── SubscriptionContext.tsx    # Security clearance & tier management
    ├── utils/
    │   ├── marketAnalyticsEngine.ts   # Macro salary trends & calibration algorithms
    │   ├── radarEngine.ts             # Geospatial requisitions & search engine
    │   ├── triadEngine.ts             # Multi-agent collaboration state machine
    │   ├── financialPlatformEngine.ts # M&A listing, escrow & transaction ledger
    │   ├── negotiationFinanceEngine.ts# TTC modeling & tax jurisdiction tables
    │   └── zipExporter.ts             # Browser-based whole-codebase ZIP generator
    └── types/
        └── d3.d.ts                    # D3 TypeScript declaration definitions
```

---

## 📦 Exporting as a ZIP Archive

You can export the entire source code of this application at any time:
1. Click the **`📦 GITHUB & ZIP EXPORT`** button in the top tactical navigation bar of the running application.
2. Click **`Download Source Code (.ZIP)`** to instantly bundle and download all source files directly to your machine.
3. Or initialize your remote GitHub repository using the step-by-step commands provided inside the export modal.

---

## 📄 License

This project is licensed under the **MIT License** — you are free to modify, distribute, commercialize, or private-label this codebase.
