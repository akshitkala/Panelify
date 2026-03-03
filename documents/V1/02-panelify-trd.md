**PANELIFY**

_Technical Requirements Document_

Version 1.1 — Multi-Platform + AI Abstraction

Deadline: March 10, 2026

# **Changelog v1.0 → v1.1**

| **Change** | **Requirements Affected** |
| --- | --- |
| Platform expanded to Vercel + Netlify | FR-R-02, FR-R-05 updated. NFR-C-01 updated. New FR-R-06 added. |
| AI provider changed to Gemini Flash primary / Groq fallback | FR-S-07 updated. New FR-S-13, FR-S-14 added. |
| lib/ai.ts abstraction required from Day 1 | New NFR-A-01, NFR-A-02 added. |
| Windsurf documented as dev tooling | New section 1.3 added. |
| platform column added to sites table | Data Model doc updated. sites.platform required from Day 2. |
| Site TypeScript interface updated with platform field | types/repo.ts — Site interface updated. |
| Deploy status polling approach defined | lib/deploy-poll.ts — URL polling, no extra tokens required. |
| lib/refactor.ts fully specified | New refactor spec document created covering before/after examples and safety rules. |

# **1\. System Requirements**

## **1.1 Runtime**

| **Requirement** | **Specification** |
| --- | --- |
| Node.js version | 18.x or higher |
| Next.js version | 14.x with App Router |
| TypeScript | 5.x strict mode — all files .ts or .tsx |
| Serverless timeout | 10 seconds max per function — Vercel free plan hard limit |
| Serverless memory | 1024 MB max — Vercel free plan limit |

## **1.2 Browser Support**

| **Browser** | **Minimum Version** | **Priority** |
| --- | --- | --- |
| Chrome / Chromium | 108+ | MUST — primary demo browser |
| Firefox | 110+ | SHOULD |
| Safari | 16+ | SHOULD |
| Mobile browsers | Any modern | COULD — not V1 primary target |

## **1.3 Dev Tooling**

| **Tool** | **Version** | **Role** | **Cost** |
| --- | --- | --- | --- |
| Windsurf | Latest | Primary vibe coding tool — editor + AI assistant | Free tier |
| Node.js | 18.x+ | Runtime for local development | Free |
| npm | Latest | Package manager — lockfile committed | Free |
| Vercel CLI | Latest | Deploy + env var management | Free |

# **2\. AI Provider Requirements**

_FR-AI — MUST requirements_

| **ID** | **Requirement** | **Acceptance Criteria** |
| --- | --- | --- |
| FR-AI-01 | All AI calls go through lib/ai.ts — no direct SDK imports elsewhere | grep for @google/generative-ai and groq-sdk finds only lib/ai.ts |
| FR-AI-02 | Gemini Flash is the primary provider — called first on every scan | Network logs show Gemini API called before Groq on every scan |
| FR-AI-03 | Groq activates automatically if Gemini returns 429, 503, or times out after 9s | Mock Gemini 429 → Groq called within 100ms. Scan completes normally. |
| FR-AI-04 | Groq activates if Gemini returns unparseable JSON after one retry | Mock Gemini bad JSON → retry once → Groq called. Scan completes. |
| FR-AI-05 | Scan fails with SCAN_ERROR only if both Gemini and Groq fail | Mock both providers failing → SCAN_ERROR shown with retry button |
| FR-AI-06 | GOOGLE_GEMINI_API_KEY never appears in client bundle | next build output contains no Gemini key. Browser network tab shows no key. |
| FR-AI-07 | GROQ_API_KEY never appears in client bundle | next build output contains no Groq key. |
| FR-AI-08 | analyzeJSX() returns fields matching AIField interface exactly | TypeScript compiler accepts return value without type assertion |

# **3\. Platform Requirements**

_FR-PLATFORM — MUST requirements_

| **ID** | **Requirement** | **Acceptance Criteria** |
| --- | --- | --- |
| FR-P-01 | Platform detected automatically from repo files — no manual selection by default | Connect repo with vercel.json → shows Vercel. With netlify.toml → shows Netlify. |
| FR-P-02 | Vercel detection: check for vercel.json first, then Vercel API project link | Repo with no vercel.json but Vercel-linked → still detected as Vercel |
| FR-P-03 | Netlify detection: check for netlify.toml in repo root | Repo with netlify.toml → detected as Netlify |
| FR-P-04 | Unknown platform: prompt user to select manually or enter deploy URL | Repo with neither signal → manual selection screen shown |
| FR-P-05 | Platform stored in sites.platform column in Supabase | sites row has platform: 'vercel' or 'netlify' after connection |
| FR-P-06 | Publish flow works identically on Vercel and Netlify | Publish on Vercel site → live in 30s. Publish on Netlify site → live in 30s. |
| FR-P-07 | Deploy status polling works for both platforms after publish commit | Build progress shown on Screen 9 for both platforms |

_FR-PLATFORM — SHOULD requirements_

| **ID** | **Requirement** | **Acceptance Criteria** |
| --- | --- | --- |
| FR-P-08 | If auto-detection is wrong, user can override platform selection on connect screen | Dropdown to override platform shown after auto-detection result |
| FR-P-09 | Platform badge shown on dashboard — Vercel or Netlify indicator | Dashboard shows small platform badge next to site URL |

# **4\. Scan Requirements**

| **ID** | **Requirement** | **Priority** | **Note** |
| --- | --- | --- | --- |
| FR-S-07 | Scan batches files in groups of 4 to stay under 9s timeout — applies to both Gemini and Groq | MUST | Updated — was Claude-specific |
| FR-S-13 | Gemini Flash model used: gemini-1.5-flash | MUST | New in v1.1 |
| FR-S-14 | Groq model used: llama-3.1-70b-versatile | MUST | New in v1.1 |

# **5\. Non-Functional Requirements**

## **5.1 AI Abstraction**

| **ID** | **Requirement** | **Priority** |
| --- | --- | --- |
| NFR-A-01 | lib/ai.ts is the only file that imports AI provider SDKs | MUST |
| NFR-A-02 | Swapping AI providers requires changing only lib/ai.ts — no other files | MUST |
| NFR-A-03 | Fallback to Groq adds no more than 500ms latency vs direct Groq call | SHOULD |

## **5.2 Platform Constraints**

| **ID** | **Requirement** | **Priority** |
| --- | --- | --- |
| NFR-C-01 | V1 supports Vercel and Netlify only — all other platforms rejected gracefully | MUST |
| NFR-C-02 | Unsupported platform shows clear message: "This platform is not supported yet. Vercel and Netlify are supported in V1." | MUST |
| NFR-C-03 | Railway, Render, Fly.io support planned for V2 — no V1 code written for these | WONT |

## **5.3 Zero Budget Constraints**

| **ID** | **Requirement** | **Priority** |
| --- | --- | --- |
| NFR-B-01 | No paid service required to run the app — all providers on free tiers | MUST |
| NFR-B-02 | No credit card required for any service used in V1 | MUST |
| NFR-B-03 | Gemini Flash and Groq both require no credit card — verified before implementation | MUST |

# **6\. Constraint Matrix**

| **Constraint** | **Value** | **Reason** |
| --- | --- | --- |
| Platforms supported | Vercel + Netlify only | Both auto-deploy on commit — no webhook needed |
| AI primary provider | Google Gemini Flash | Free forever, 1M tokens/day, no credit card |
| AI fallback provider | Groq Llama 3 | Free forever, fastest inference, no credit card |
| AI abstraction | lib/ai.ts required | Provider swap = one file change |
| Dev tool | Windsurf | Free tier, editor + AI combined |
| Vercel function timeout | 10 seconds max | Free plan hard limit |
| Scan batch size | 4 files per AI call | Keeps each call under timeout limit |
| Deploy status polling | URL polling (lib/deploy-poll.ts) | No extra OAuth scopes or tokens required |
| Sites per user | 1 in V1 | Reduces scope and complexity |
| Budget | Zero — no credit card | Founder constraint |

**PANELIFY V1 — TRD v1.1 COMPLETE**

_Next: Build Order_