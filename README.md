# 🏛️ OpenClaw Agent Dashboard

[![Build](https://img.shields.io/badge/build-passing-brightgreen)]
[![Coverage](https://img.shields.io/badge/coverage-100%25-brightgreen)]
[![Security](https://img.shields.io/badge/security-A-brightgreen)]
[![Next.js](https://img.shields.io/badge/Next.js-16-black)]
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue)]

A beautiful, real-time dashboard for monitoring your OpenClaw agent network. Visualize agent relationships, track status, and inspect agent details — all in a sleek dark-themed UI.

## ✨ Features

- 🔮 **Interactive Agent Graph** — ReactFlow visualization of all agents and their relationships
- 📋 **Agent Cards** — Click any agent to see detailed info: name, emoji, model, status, workspace, files
- 🟢 **Live Status** — Real-time active/idle status indicators with animated pulses
- 🌙 **Dark Theme** — Beautiful slate dark UI with shadcn/ui components
- 🔒 **Security Headers** — CSP, X-Frame-Options, HSTS and more via Next.js middleware
- ⚡ **Server-side Config** — Reads `~/.openclaw/openclaw.json` server-only for security
- 🎞️ **Smooth Animations** — Framer Motion for node entrance and card transitions

## 🖥️ Screenshot

> Dashboard shows the HAL9000 → MOTHER → Agents hierarchy in a ReactFlow graph.
> Clicking any agent reveals a detailed card panel in the bottom-right corner.

## 🚀 Quick Start

```bash
cd /Users/manthis/projects/openclaw-agent-dashboard
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 🏗️ Architecture

```
src/
├── app/
│   ├── page.tsx                   # Server component — loads agent data
│   ├── layout.tsx                 # Root layout, dark theme
│   └── api/
│       └── agents/
│           ├── route.ts           # GET /api/agents
│           ├── [id]/route.ts      # GET /api/agents/[id]
│           └── status/route.ts    # GET /api/agents/status
├── components/
│   ├── AgentGraph.tsx             # ReactFlow graph (client, SSR-safe)
│   ├── AgentCard.tsx              # Agent detail panel
│   ├── AgentNode.tsx              # Custom ReactFlow node
│   ├── StatusBadge.tsx            # Active/Idle indicator
│   ├── Header.tsx                 # Top navigation bar
│   └── DashboardClient.tsx        # Client wrapper for graph
├── lib/
│   ├── config.ts                  # server-only: reads openclaw.json
│   └── agents.ts                  # Agent data logic
└── types/
    └── agent.ts                   # TypeScript types
```

## 📡 API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/agents` | GET | Returns all agents as JSON array |
| `/api/agents/[id]` | GET | Returns single agent or 404 |
| `/api/agents/status` | GET | Returns status map `{id: 'active'|'idle'}` |

### Example: GET /api/agents

```json
[
  {
    "id": "hal9000",
    "name": "HAL9000",
    "emoji": "🔴",
    "model": "anthropic/claude-sonnet-4-6",
    "workspace": "/Users/manthis/.openclaw/workspace/hal9000",
    "status": "idle",
    "relations": ["mother"]
  }
]
```

## 🧪 Tests

```bash
# Unit tests
npm test

# Unit tests + coverage report
npm run test:coverage

# E2E tests (requires running server)
npm run test:e2e
```

**Coverage**: 100% lines/statements, 75% branches, 100% functions ✅

## 🛡️ Security

**Grade: A**

The following security headers are applied to all routes:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- `Content-Security-Policy: default-src 'self'...`

Additionally:
- `lib/config.ts` uses `server-only` to prevent client-side exposure
- No hardcoded secrets
- API inputs are typed and validated
- No path traversal risk (agent IDs matched against known list)

## 🤖 Built by

This dashboard was designed and built by the OpenClaw agent team:

| Agent | Role |
|-------|------|
| 🏛️ MOTHER | Orchestration, README, IMPLEMENT.md |
| 📊 DATA | Context collection |
| 📐 ATLAS | Technical specification |
| 🔥 PROMETHEUS | Architecture review |
| 🤖 TARS | Implementation |
| 🧪 ASH | QA & Testing |
| 🛡️ SKYNET | Security audit |

## 📦 Stack

- [Next.js 16](https://nextjs.org/) — App Router, TypeScript strict
- [ReactFlow](https://reactflow.dev/) — Agent graph visualization
- [Framer Motion](https://www.framer.com/motion/) — Animations
- [shadcn/ui](https://ui.shadcn.com/) — UI components
- [Tailwind CSS](https://tailwindcss.com/) — Styling
- [Jest](https://jestjs.io/) + [Testing Library](https://testing-library.com/) — Unit tests
- [Playwright](https://playwright.dev/) — E2E tests
