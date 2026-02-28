# 🏛️ OpenClaw Agent Dashboard

[![Build](https://img.shields.io/badge/build-passing-brightgreen)](https://github.com/manthis/openclaw-agent-dashboard)
[![Coverage](https://img.shields.io/badge/coverage-94%25-brightgreen)](https://github.com/manthis/openclaw-agent-dashboard)
[![Security](https://img.shields.io/badge/security-A-brightgreen)](https://github.com/manthis/openclaw-agent-dashboard)
[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org)

A real-time dashboard for monitoring the OpenClaw AI agent network. Visualizes the agent hierarchy as an interactive graph with live status indicators.

## ✨ Features

- 🗺️ **Interactive Agent Graph** — ReactFlow-powered visualization of the agent network
- 🔴 **Live Status** — Real-time active/idle status for each agent
- 🃏 **Agent Cards** — Click any node to see detailed agent info (model, workspace, files, relations)
- 🌐 **REST API** — JSON endpoints for agent data and status
- 🔒 **Security Headers** — CSP, X-Frame-Options, and more
- 🧪 **94% Test Coverage** — Comprehensive unit test suite

## 🏗️ Architecture

```
HAL9000
  └─ MOTHER (orchestrator)
       ├─ DATA
       ├─ ATLAS
       ├─ PROMETHEUS
       ├─ TARS
       ├─ ASH
       └─ SKYNET
```

## 🛠️ Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS + shadcn/ui |
| Graph | @xyflow/react |
| Animation | Framer Motion |
| Testing | Jest + Testing Library |

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Open http://localhost:3000
```

## 📊 API Routes

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/agents` | List all agents |
| GET | `/api/agents/[id]` | Get agent by ID |
| GET | `/api/agents/status` | Get all agent statuses |

## 🧪 Testing

```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage
```

**Coverage: 94% statements, 88% functions, 7 test suites, 32 tests**

## 📁 Project Structure

```
src/
  app/
    api/agents/     # REST API routes
    page.tsx        # Dashboard page (server component)
    layout.tsx      # Root layout
  components/
    AgentGraph.tsx  # ReactFlow graph
    AgentCard.tsx   # Agent detail card
    AgentNode.tsx   # Custom flow node
    StatusBadge.tsx # Status indicator
    Header.tsx      # App header
    GraphClient.tsx # Dynamic client wrapper
  lib/
    agents.ts       # Agent data logic
    config.ts       # OpenClaw config reader
  types/
    agent.ts        # TypeScript types
```

## 🔒 Security

**Grade: A** — All responses include security headers:
- Content-Security-Policy
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Referrer-Policy
- Permissions-Policy

## 👥 Built By The Team

| Agent | Role |
|-------|------|
| 📊 DATA | Context analysis |
| 📐 ATLAS | Technical specification |
| 🔥 PROMETHEUS | Architecture review |
| 🤖 TARS | Implementation |
| 🧪 ASH | QA & testing |
| 🛡️ SKYNET | Security audit |

*Orchestrated by 🏛️ MOTHER, delegated by 🔴 HAL9000*
