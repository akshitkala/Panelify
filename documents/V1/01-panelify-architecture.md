**PANELIFY**

_Technical Architecture Document_

Version 1.1 — Multi-Platform + AI Abstraction Layer

Deadline: March 10, 2026

# **1\. Architecture Overview**

Panelify is a Next.js application hosted on Vercel. It supports Next.js sites deployed on either Vercel or Netlify — both platforms auto-deploy when a GitHub commit is pushed, which is the mechanism Panelify depends on. All backend logic runs as Next.js API routes (serverless functions). There is no separate server.

AI scanning uses Google Gemini Flash as the primary provider and Groq as the automatic fallback. All AI calls go through a single abstraction layer — lib/ai.ts — so the provider can be swapped without touching any other file.

## **Architecture Diagram**

PANELIFY ARCHITECTURE — V1

Browser (Owner) External Services

───────────────── ──────────────────

Next.js Frontend (Vercel) ──────────► GitHub API

│ read JSX files

│ write content.json

│ create backup branch

▼ ──────────────────

Next.js API Routes ────────────────► lib/ai.ts (abstraction)

(Vercel Serverless) │

│ ├─► Gemini Flash (primary)

│ └─► Groq / Llama 3 (fallback)

│ ──────────────────

│ ──────► Supabase

│ auth / sessions

│ sites metadata table (+ platform col)

│ ──────────────────

│ ┌── Vercel ◄──── GitHub commit → auto-rebuild

└───────────┤

└── Netlify ◄──── GitHub commit → auto-rebuild

# **2\. lib/ai.ts — Abstraction Layer**

This is the most important architectural decision. Every AI call in the entire codebase goes through this one file. No route, component, or utility imports Gemini or Groq SDKs directly. If a provider goes down, changes the API, or hits rate limits — one file fixes it.

// lib/ai.ts

import { GoogleGenerativeAI } from '@google/generative-ai';

import Groq from 'groq-sdk';

export interface AIField {

component: string;

field_id: string;

label: string;

type: 'text' | 'textarea' | 'image';

current_value: string;

confidence: number;

}

export async function analyzeJSX(

files: { path: string, content: string }\[\]

): Promise&lt;AIField\[\]&gt; {

try {

return await analyzeWithGemini(files); // Primary

} catch (err) {

console.warn('Gemini failed, falling back to Groq:', err);

return await analyzeWithGroq(files); // Fallback

}

}

// All other code in the app calls analyzeJSX() only.

// Provider implementation details are private to this file.

## **Fallback Trigger Conditions**

| **Condition** | **Action** |
| --- | --- |
| Gemini returns HTTP 429 — rate limit | Immediate fallback to Groq |
| Gemini returns HTTP 503 — service unavailable | Immediate fallback to Groq |
| Gemini does not respond within 9 seconds | Timeout, fallback to Groq |
| Gemini returns invalid JSON that cannot be parsed | Retry Gemini once, then fallback to Groq |
| Groq also fails | Return SCAN_ERROR — show retry UI to owner |

# **3\. Tech Stack**

| **Layer** | **Technology** | **Purpose** | **Cost** |
| --- | --- | --- | --- |
| Frontend | Next.js 14 App Router | UI + API routes | Free |
| Styling | Tailwind CSS + Shadcn UI | Components + design system | Free |
| Dev Tool | Windsurf | Vibe coding — editor + AI assistant | Free tier |
| Auth | Supabase Auth | GitHub OAuth sessions | Free |
| Database | Supabase Postgres | One sites table | Free |
| Primary AI | Google Gemini Flash | JSX scanning + field labeling | Free forever |
| Fallback AI | Groq (Llama 3.1 70b) | JSX scanning if Gemini unavailable | Free forever |
| AI Abstraction | lib/ai.ts (custom) | Provider-agnostic wrapper | Free |
| GitHub SDK | Octokit REST | Repo read/write/branch ops | Free |
| Code Parsing | Babel Parser | JSX AST for safe refactoring | Free |
| Sanitization | DOMPurify | XSS prevention on text inputs | Free |
| Hosting | Vercel | Frontend + serverless API routes | Free tier |

# **4\. Platform Detection**

When a user selects a repo, Panelify auto-detects the hosting platform by reading the repo's root files. The detection result is stored in the sites table (sites.platform column) and used on every publish to confirm the correct deploy mechanism.

// lib/platform.ts

export type Platform = 'vercel' | 'netlify' | 'unknown';

export async function detectPlatform(

repoFiles: string\[\],

repoFullName: string

): Promise&lt;Platform&gt; {

// 1. Check for config files first — fastest

if (repoFiles.includes('vercel.json')) return 'vercel';

if (repoFiles.includes('netlify.toml')) return 'netlify';

// 2. Check Vercel API for linked project

// catches repos without vercel.json but linked via Vercel dashboard

const linked = await checkVercelLinked(repoFullName);

if (linked) return 'vercel';

// 3. Unknown — prompt user to select platform manually

return 'unknown';

}

## **Platform Detection Matrix**

| **Platform** | **Detection Signal** | **Deploy Mechanism** | **URL Format** |
| --- | --- | --- | --- |
| Vercel | vercel.json OR Vercel API project link | GitHub commit → auto-rebuild | \*.vercel.app or custom |
| Netlify | netlify.toml in repo root | GitHub commit → auto-rebuild | \*.netlify.app or custom |
| Unknown | Neither signal found | Prompt user to select manually | User provides URL |

# **5\. Directory Structure**

panelify/

├── app/

│ ├── page.tsx Screen 0 — Landing page (static)

│ ├── login/page.tsx Screen 1

│ ├── connect/page.tsx Screen 2

│ ├── scanning/page.tsx Screen 3

│ ├── confirm/page.tsx Screen 4

│ ├── setup/page.tsx Screen 5

│ ├── dashboard/page.tsx Screen 6

│ ├── edit/\[section\]/page.tsx Screen 7

│ ├── preview/page.tsx Screen 8

│ ├── publishing/page.tsx Screen 9

│ └── layout.tsx

│

├── api/

│ ├── auth/callback/route.ts

│ ├── repos/route.ts

│ ├── platform/detect/route.ts NEW — detects Vercel vs Netlify

│ ├── scan/

│ │ ├── files/route.ts

│ │ ├── analyze/route.ts calls lib/ai.ts — not providers directly

│ │ └── prepare/route.ts

│ ├── setup/

│ │ ├── backup/route.ts

│ │ ├── generate/route.ts

│ │ ├── refactor/route.ts

│ │ └── commit/route.ts

│ ├── content/

│ │ ├── read/route.ts

│ │ └── write/route.ts

│ └── image/upload/route.ts

│

├── lib/

│ ├── ai.ts CORE — Gemini + Groq abstraction

│ ├── platform.ts NEW — Vercel/Netlify detection

│ ├── refactor.ts JSX → content.json rewriter (Babel AST)

│ ├── deploy-poll.ts NEW — URL polling for deploy status

│ ├── github.ts

│ ├── supabase.ts

│ ├── scanner.ts

│ └── schema.ts

│

└── types/

├── ai.ts AIField, ScanResult types

├── platform.ts Platform type

├── content.ts

├── repo.ts Repo, Site types (includes platform field)

└── scan.ts

# **6\. AI Provider Configuration**

\# .env.local — all AI keys are server-side only

\# Never prefix with NEXT_PUBLIC_

\# Primary — Google Gemini Flash

GOOGLE_GEMINI_API_KEY= # aistudio.google.com — free, no credit card

\# Fallback — Groq

GROQ_API_KEY= # console.groq.com — free, no credit card

\# Supabase

NEXT_PUBLIC_SUPABASE_URL=

NEXT_PUBLIC_SUPABASE_ANON_KEY=

SUPABASE_SERVICE_ROLE_KEY= # server-side only

\# GitHub OAuth

GITHUB_CLIENT_ID=

GITHUB_CLIENT_SECRET= # server-side only

\# App

NEXT_PUBLIC_APP_URL= # https://panelify.vercel.app

# **7\. Security**

| **Concern** | **Solution** |
| --- | --- |
| AI API keys | GOOGLE_GEMINI_API_KEY and GROQ_API_KEY server-side only — never NEXT_PUBLIC_ |
| GitHub tokens | Stored in Supabase session — encrypted at rest, never in localStorage |
| XSS from text inputs | DOMPurify sanitizes all text inputs before writing to content.json |
| JSX refactoring safety | Backup branch before any code changes — one-click restore |
| API route protection | All routes validate Supabase session — unauthenticated calls return 401 |
| Preview iframe | Sandboxed iframe — no script execution in preview |
| Supabase RLS | Users can only read/write their own sites row |
| Content injection | content.json values rendered via React — HTML escaped by default |

**PANELIFY V1 — TECHNICAL ARCHITECTURE v1.1 COMPLETE**

_Next: TRD_