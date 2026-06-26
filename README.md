# 🗓️ ShipMate Agent
> Autonomous Productivity & Cognitive Calendar Execution Engine

[![Build Status](https://img.shields.io/badge/GCP_Deployment-Cloud_Run-blue?logo=googlecloud&logoColor=white)](https://shipmate-app-544153670529.asia-south1.run.app)
[![Engine](https://img.shields.io/badge/Engine-Gemini_3.5_Flash-purple?logo=googlegemini&logoColor=white)](https://aistudio.google.com/)
[![OAuth 2.0](https://img.shields.io/badge/Security-Isolated_OAuth_2.0-green?logo=google&logoColor=white)]()
[![Hackathon Track](https://img.shields.io/badge/Track-The_Last--Minute_Life_Saver-orange)]()

ShipMate Agent is an autonomous, context-aware scheduling ecosystem built for **"The Last-Minute Life Saver"** hackathon track. Instead of relying on passive, static push reminders that fail when task paralysis sets in, ShipMate actively parses raw human anxiety and restructures the user's Google Calendar in real time—injecting protective buffer gaps alongside concentrated focus windows to mitigate acute burnout.

---

##  Live Application Interface
The ShipMate Agent workspace is designed as a fully responsive, modern high-contrast command console optimized for active, real-time stress parsing and cognitive load mitigation.

*   **Interactive Command Terminal:** Features automated speech-activation workflows alongside standard text processing inputs.
*   **Contextual Health Sidebar:** Dynamically computes real-time productivity stats and focus density ratings based on task parameters.
*   **Direct Visual Timetable Integration:** Provides direct inline visibility as calendar blocks are safely orchestrated and synced.

*👉 To experience the live interactive terminal right now, visit the official production build at [https://shipmate-app-544153670529.asia-south1.run.app](https://shipmate-app-544153670529.asia-south1.run.app)*
---

##  Core Innovation: The Dual-Phase Burnout Protocol

When a user submits an extreme, high-stress prompt (e.g., *"I have a massive presentation tomorrow at 9 AM and I haven't started"*), ShipMate overrides standard sequential block creation and automatically coordinates two structural calendar overrides in a single runtime loop:

1. **Phase I: The Decompression Block (30 Mins):** An immediate buffer window scheduled right before the intensive task window. This slot explicitly prompts the user to clear physical distractions, step away, and mentally settle.
2. **Phase II: The Deep Work Block:** A color-coded, protected focus reservation written directly to the primary calendar matrix, completely isolated from surrounding meeting collisions.

---

##  Tech Stack & Architecture

### High-Level Blueprint
*   **Frontend UI:** React (TSX) structured with TypeScript for strict type layout checking, compiled via the fast Vite development engine, and styled using Tailwind CSS's utility layer.
*   **Execution Backend:** Node.js powered by Express to serve secure runtime proxy channels and handle payload parsing.
*   **Voice Gateway:** Integrated native Web Speech API wrappers (`SpeechRecognition`) providing hands-free terminal streaming straight from supported Google Chrome environments.

### Google Ecosystem Layout
*   **Google Gen AI SDK & Gemini API:** Processes irregular human phrases. Utilizes strict **Function Calling (Tools)** definitions to reliably translate panicked statements into structured, schema-validated JSON payloads. Features a fallback string array switching across `gemini-3.5-flash`, `gemini-3.1-flash-lite`, and `gemini-2.5-flash`.
*   **Google AI Studio:** The foundational development workspace utilized to engineer system prompt contexts, test baseline behavioral parameters, and fine-tune structural tool call parameters.
*   **Google Calendar API (v3):** Connects to the primary calendar to read 24-hour event structures, map free/busy availability distributions, isolate task dependencies, and register focus blocks.
*   **Google OAuth 2.0 Identity Hub:** Secures user permissions via an implicit frontend client popup exchange flow, keeping user authentication independent of the backend data tier.
*   **Continuous Deployment Pipeline:** Fully containerized via Docker, built using **Google Cloud Build**, and deployed to production auto-scaling serverless containers on **Google Cloud Run**.

---

## 📦 Software & Open-Source Library Credits

ShipMate Agent stands on the shoulders of the following libraries, modules, and open-source software packages:

*   [`@google/genai`](https://www.npmjs.com/package/@google/genai) - Official SDK for managing structural function calls and configuration states with Gemini inference models.
*   [`googleapis`](https://www.npmjs.com/package/googleapis) - Official Node.js library wrapper for orchestrating Google Calendar endpoints and authenticating OAuth2 token sets.
*   [`express`](https://expressjs.com/) - Fast, unopinionated web framework framework utilized to host API routes and enforce operational middleware.
*   [`typescript`](https://www.typescriptlang.org/) - Typed superset of JavaScript enforcing rigid data definitions and schema security across both runtime environments.
*   [`vite`](https://vitejs.dev/) - Modern build tool ecosystem utilized to manage Hot Module Replacement (HMR) and distribute compressed production bundle builds.
*   [`tailwindcss`](https://tailwindcss.com/) - A utility-first CSS layout engine used to build responsive dark-themed component panels.

---

##  Deployment & Local Installation

### Prerequisites
*   Node.js (v18 or higher)
*   A Google Cloud Platform developer account with a configured OAuth Client ID matching the Google Calendar API access scope.

### 1. Clone & Install Project Packages
```bash
git clone [https://github.com/therajsharma20/ShipMate.git](https://github.com/therajsharma20/ShipMate.git)
cd ShipMate
npm install
