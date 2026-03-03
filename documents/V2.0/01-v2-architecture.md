**Panelify V2**

_Architecture & System Design_

Version 2.0 — Draft

February 2026

# **1\. Overview**

Panelify V2 is a zero-config CMS for JavaScript-based frontend frameworks. V2 extends the V1 Next.js foundation to support broader repository structures, smarter field detection, live preview editing, and multi-site team collaboration.

V1 proved the core concept: connect a repo, scan JSX, refactor to content.json, publish via GitHub commit. V2 makes that concept work reliably on real-world repos and adds the editing experience that turns it into a product people pay for.

## **1.1 V1 vs V2 Comparison**

| **Capability** | **V1** | **V2** |
| --- | --- | --- |
| Frameworks supported | Next.js only | Next.js, Remix, Astro (beta) |
| File types scanned | .tsx, .jsx only | .tsx, .jsx, .ts, .js |
| Directory support | app/ root only | app/, src/app/, src/pages/, pages/ |
| Config detection | next.config.js only | next.config.js, .mjs, .ts |
| Field detection | Inconsistent, ~40% accuracy | Deterministic, cached, >85% accuracy |
| Live preview | Fake preview card | Real iframe with postMessage updates |
| Scanning UX | Bulk scan all files | Per-page scan with site iframe |
| Sites per user | 1   | Unlimited |
| Team access | None | Multi-user with roles |
| Auth flow | Home shows sign in always | Session-aware landing page |
| JSX refactor | Partial — content.json not read by site | Full — JSX imports and reads content.json |
| Platform support | Vercel + Netlify | Vercel, Netlify, Railway, Render |

# **2\. System Architecture**

## **2.1 High-Level Diagram**

The V2 architecture is organised into five layers:

- Layer 1 — Auth: Supabase GitHub OAuth with persistent token storage
- Layer 2 — Repo Intelligence: Smart scanner with framework + structure detection
- Layer 3 — AI Engine: Gemini Flash primary with Groq fallback, deterministic prompts
- Layer 4 — Transform Engine: Babel AST refactor writing JSX + content.json
- Layer 5 — Publish Engine: GitHub commit + platform deploy polling

## **2.2 Tech Stack**

| **Layer** | **Technology** | **Purpose** | **Status** |
| --- | --- | --- | --- |
| Framework | Next.js 14 App Router | Application shell | **V1** |
| Styling | Tailwind CSS v4 + Shadcn UI | UI components | **V1** |
| Auth | Supabase GitHub OAuth | Session + token management | **V1** |
| Database | Supabase PostgreSQL | Sites, tokens, team data | V2 extended |
| AI Primary | Google Gemini 1.5 Flash | JSX field detection | **V1** |
| AI Fallback | Groq (Llama) | Gemini failure fallback | **V1** |
| AST Transform | Babel parser + traverse | JSX rewriting | V1 (fix required) |
| GitHub API | Octokit REST | Branch, commit, file ops | **V1** |
| Deploy Poll | Native fetch loop | Verify site is live | **V1** |
| Preview | Sandboxed iframe + postMessage | Live content preview | V2 new |
| Dev Tool | Windsurf IDE | AI-assisted development | **V1** |

# **3\. Directory Structure**

## **3.1 Application Structure**

| **Path** | **Purpose** | **V1/V2** |
| --- | --- | --- |
| app/page.tsx | Landing page — session-aware | V2 fix |
| app/login/page.tsx | GitHub OAuth entry | **V1** |
| app/connect/page.tsx | Repo selection | **V1** |
| app/scanning/page.tsx | Per-page scan with iframe | V2 redesign |
| app/confirm/page.tsx | Field confirmation — inline | V2 redesign |
| app/setup/page.tsx | Setup orchestration | **V1** |
| app/dashboard/page.tsx | Multi-site dashboard | V2 extended |
| app/edit/\[section\]/page.tsx | Split-screen editor with real iframe | V2 fix |
| app/preview/page.tsx | Full page preview | **V1** |
| app/publishing/page.tsx | Publish flow | **V1** |
| app/team/page.tsx | Team management | V2 new |

## **3.2 Library Structure**

| **Path** | **Purpose** | **V1/V2** |
| --- | --- | --- |
| lib/ai.ts | Gemini + Groq abstraction | **V1** |
| lib/refactor.ts | Babel AST JSX rewriter — CRITICAL FIX | V2 fix |
| lib/scanner.ts | Multi-framework file detection | V2 extended |
| lib/platform.ts | Vercel/Netlify/Railway/Render detection | V2 extended |
| lib/deploy-poll.ts | Deploy status polling | **V1** |
| lib/github-token.ts | Persistent token retrieval | **V1** |
| lib/github.ts | Octokit helpers | **V1** |
| lib/preview.ts | iframe postMessage bridge | V2 new |
| lib/team.ts | Team and role management | V2 new |
| context/PendingChangesContext.tsx | Pending changes state | **V1** |

# **4\. Critical V1 Bugs — Must Fix in V2**

These are not V2 features. They are broken V1 functionality that must be repaired before any new V2 features are built.

| **Bug** | **Severity** | **Root Cause** | **Fix Required** |
| --- | --- | --- | --- |
| JSX refactor not writing to site | **CRITICAL** | lib/refactor.ts output not committed to GitHub | Commit refactored JSX files alongside content.json in setup/commit route |
| Field detection inconsistent | **HIGH** | Gemini prompt too vague, no caching | Deterministic prompt + cache results per repo SHA |
| Dynamic content detected as editable | **HIGH** | AI not filtering {variable} expressions | Improved prompt with explicit exclusion rules |
| Home page shows Sign In when logged in | **MEDIUM** | No session check on landing page | Read Supabase session on page.tsx, show dashboard link |
| Sign out only from dashboard | **MEDIUM** | No persistent nav component | Add global header with sign out across all screens |
| .js/.jsx files not scanned | **HIGH** | Scanner filtered to .tsx only | Add .js, .jsx to extension filter |
| src/ directory not scanned | **HIGH** | Path filter excludes src/ | Add src/app/, src/components/ to path filter |
| next.config.mjs not detected | **MEDIUM** | Repo filter only checks .js | Add .mjs and .ts variants to detection |

# **5\. V2 Feature Architecture**

## **5.1 Smart Repository Scanner**

The V2 scanner auto-detects repository structure rather than assuming conventions.

**Detection Algorithm**

1.  Find next.config.js OR next.config.mjs OR next.config.ts at repo root
2.  Check if src/ directory exists — if yes, set srcRoot = src/
3.  Find all .ts, .tsx, .js, .jsx files under srcRoot
4.  Exclude: node_modules, .next, dist, build, \*.test.\*, \*.spec.\*, \*.config.\*
5.  Scan up to 50 files — priority order: components > pages > app
6.  Cache results keyed by repo_full_name + latest commit SHA

**Logic Gap Verification**

| **Scenario** | **V1 Behaviour** | **V2 Fix** | **Test Case** |
| --- | --- | --- | --- |
| Repo uses src/ | Zero files found | src/ included in path filter | akshitkala/test_next |
| Repo uses .js not .tsx | Zero files found | .js added to extension filter | Any JS-only Next.js repo |
| Repo uses next.config.mjs | Repo not listed | .mjs added to config detection | akshitkala/test_next |
| Repo has 80+ component files | Timeout after 10s | Smart pre-filter + 50 file cap | Large agency site |
| Repo uses master branch | Zero files (was hardcoded main) | Dynamic default_branch from DB | akshitkala/test |
| Repo has submodules | Silent crash | Skip type=commit entries with warning | Any repo with submodules |

## **5.2 Deterministic AI Field Detection**

V2 must return the same fields every time the same repo is scanned. V1 returns different counts on repeated scans due to AI non-determinism.

**Fix Strategy**

- Set Gemini temperature to 0 (deterministic output)
- Use a strict system prompt with explicit include/exclude rules
- Cache scan results keyed to repo + commit SHA — rescan only when code changes
- Confidence threshold: only return fields >= 0.85
- Post-process: remove any field whose current_value contains { or } (dynamic content)
- Post-process: remove any field whose current_value is under 3 characters

**Improved Gemini Prompt Structure**

| **Rule** | **Include** | **Exclude** |
| --- | --- | --- |
| Headings | &lt;h1&gt;About Us&lt;/h1&gt; | &lt;h1&gt;{props.title}&lt;/h1&gt; |
| Paragraphs | &lt;p&gt;We build software&lt;/p&gt; | &lt;p&gt;{data.description}&lt;/p&gt; |
| Buttons | &lt;button&gt;Get Started&lt;/button&gt; | &lt;button onClick={fn}&gt; |
| Images | src="/hero.jpg" or alt="Team" | src={imageUrl} or src={props.src} |
| Links | &lt;a&gt;Learn More&lt;/a&gt; | &lt;a href={route}&gt; |
| Dynamic | Never include | All {variable} expressions |
| Short strings | Never include | Strings under 3 characters |
| Class names | Never include | className="text-xl" |

## **5.3 JSX Refactor Engine — Critical Fix**

This is the most important fix in V2. V1 creates content.json correctly but does NOT rewrite the JSX files to read from it. The site therefore never reflects content changes.

**The Bug**

- app/api/setup/commit/route.ts commits only content.json
- The refactored JSX files from lib/refactor.ts are generated but never committed
- Result: content.json updates but &lt;h1&gt; is still hardcoded in the component

**The Fix**

1.  app/setup/page.tsx calls POST /api/setup/refactor — captures refactoredFiles\[\]
2.  refactoredFiles\[\] is passed to POST /api/setup/commit alongside content.json
3.  commit route creates one git tree with ALL changed files
4.  Single commit includes: content.json + every modified JSX file

**Verification**

| **Test** | **Expected Result** | **Fail Condition** |
| --- | --- | --- |
| Open Hero.tsx in GitHub after setup | Contains: import content from "../content.json" | File unchanged from original |
| Open Hero.tsx after setup | Contains: &lt;h1&gt;{content.hero.title}&lt;/h1&gt; | Still shows: &lt;h1&gt;Welcome&lt;/h1&gt; |
| Edit hero title, publish | Live site h1 changes to new value | Site still shows old hardcoded text |
| Backup branch check | Contains original hardcoded JSX | Missing or empty |
| content.json check | Contains all confirmed field values | Empty or missing sections |

## **5.4 Split-Screen Live Preview (V2 New)**

Replaces the fake preview card in the editor with a real iframe showing the live site. Changes appear in real time via postMessage without requiring a publish.

**Architecture**

- Left panel (60%): Sandboxed iframe pointing to the live site URL
- Right panel (40%): Field editor — inputs for each editable field
- On field change: postMessage to iframe with { type: PANELIFY_UPDATE, field_id, value }
- Site must have Panelify listener script injected during setup to receive messages
- If site blocks iframe: fallback to simulated preview card (V1 behaviour)

**postMessage Contract**

| **Direction** | **Message Type** | **Payload** | **Handler** |
| --- | --- | --- | --- |
| App → iframe | PANELIFY_UPDATE | { field_id, value, section } | Replace DOM text matching field_id |
| App → iframe | PANELIFY_RESET | {}  | Restore all original values |
| iframe → App | PANELIFY_READY | { url, title } | Enable edit controls |
| iframe → App | PANELIFY_BLOCKED | { reason } | Show fallback preview |

## **5.5 Session-Aware Landing Page**

**V1 Bug**

The landing page always shows Sign In even when the user is logged in. Sign out is only accessible from the dashboard.

**V2 Fix**

- Check Supabase session on app/page.tsx load
- If session exists: show "Go to Dashboard" button, hide "Get Started" / "Sign In"
- Add persistent header component across all authenticated screens
- Header includes: logo, site name, sign out button
- Sign out clears session AND clears sessionStorage pending_changes

# **6\. Database Schema — V2 Extensions**

## **6.1 New and Modified Tables**

| **Table** | **Change** | **New Columns** | **Purpose** |
| --- | --- | --- | --- |
| sites | Modified | scan_cache JSONB, scan_sha TEXT, team_id UUID | Cache scan results, link to team |
| user_tokens | V1 existing | No change | Persist GitHub OAuth tokens |
| teams | New | id, name, owner_id, created_at | Group multiple users |
| team_members | New | team_id, user_id, role, invited_at | User-team relationship with roles |
| site_versions | New | id, site_id, content_json, commit_sha, published_at | Version history |

## **6.2 Scan Cache Logic**

To fix inconsistent field detection, scan results are cached per repo commit SHA.

- On scan: fetch latest commit SHA from GitHub
- Check sites.scan_sha — if matches current SHA, return sites.scan_cache
- If SHA differs or no cache: run full AI scan, store results + SHA
- Cache invalidated automatically when new commits are pushed
- User can force rescan via "Rescan" button in dashboard

# **7\. API Routes — V2**

| **Route** | **Method** | **Status** | **Change in V2** |
| --- | --- | --- | --- |
| POST /api/auth/callback | POST | **V1** | No change |
| GET /api/repos | GET | V1 fix | Add .mjs, .ts config detection |
| POST /api/scan/files | POST | V1 fix | Add .js, src/ support |
| POST /api/scan/analyze | POST | V2 fix | Deterministic prompt, cache results |
| POST /api/scan/prepare | POST | **V1** | No change |
| POST /api/scan/pages | POST | V2 new | Detect pages from live site nav |
| POST /api/setup/backup | POST | **V1** | No change |
| POST /api/setup/generate | POST | **V1** | No change |
| POST /api/setup/refactor | POST | V2 fix | Return refactored files correctly |
| POST /api/setup/commit | POST | V2 fix | Commit JSX files + content.json |
| GET /api/content/read | GET | **V1** | No change |
| POST /api/content/write | POST | **V1** | No change |
| POST /api/platform/detect | POST | V2 fix | Add Railway, Render detection |
| POST /api/image/upload | POST | **V1** | Add size + type validation |
| GET /api/team | GET | V2 new | List team members |
| POST /api/team/invite | POST | V2 new | Invite user to team |
| GET /api/sites | GET | V2 new | List all sites for user/team |

# **8\. Logic Gap Verification**

Every identified gap from V1 testing mapped to its V2 fix and acceptance test.

| **Gap ID** | **Description** | **V1 Behaviour** | **V2 Fix** | **Acceptance Test** |
| --- | --- | --- | --- | --- |
| LG-01 | JSX not refactored | content.json updates but site unchanged | Commit JSX + content.json together | Edit field, publish, verify live site changes |
| LG-02 | Inconsistent scan | Different field counts on repeat scans | Temperature=0 + SHA cache | Scan same repo 3x — identical results each time |
| LG-03 | Dynamic fields detected | AI returns {user.name} as editable | Post-filter { } expressions | Scan repo with dynamic data — zero dynamic fields returned |
| LG-04 | src/ not scanned | Zero files from src/ repos | Add src/ to path filter | Scan test_next — files found from src/app/ |
| LG-05 | .js not scanned | JS repos return zero files | Add .js to extension list | Scan JS-only repo — files found and scanned |
| LG-06 | next.config.mjs rejected | Repo not in list | Add .mjs to config detection | test_next appears in repo list |
| LG-07 | Home page auth state | Sign In shown when logged in | Session check on page.tsx | Logged in user sees dashboard link not sign in |
| LG-08 | No global sign out | Only sign out from dashboard | Persistent header on all screens | Sign out accessible from every authenticated screen |
| LG-09 | No live preview | Fake preview card only | Real iframe + postMessage | Edit field — live site preview updates in real time |
| LG-10 | Single site limit | Only one site per user | Multi-site dashboard | Connect 3 repos — all appear in dashboard |
| LG-11 | No team access | Single user only | Team invites with roles | Invite user — they can edit but not publish |
| LG-12 | Image upload no validation | Any file accepted | Size + type checks | Upload PDF — BAD_TYPE error returned |
| LG-13 | Auth middleware disabled | Protected routes accessible without login | Uncomment middleware protection | Visit /dashboard logged out — redirected to /login |

# **9\. Build Order**

## **Phase 1 — Critical Fixes (Week 1)**

Fix everything broken in V1 before adding any new features.

| **Day** | **Task** | **File(s)** | **Verifies** |
| --- | --- | --- | --- |
| 1   | Fix JSX refactor commit | setup/commit/route.ts, setup/page.tsx | LG-01 |
| 1   | Fix scanner for .js and src/ | scan/files/route.ts | LG-04, LG-05 |
| 1   | Fix next.config.mjs detection | repos/route.ts | LG-06 |
| 2   | Fix deterministic AI prompt | lib/ai.ts, scan/analyze/route.ts | LG-02, LG-03 |
| 2   | Add scan result caching | scan/analyze/route.ts, sites table | LG-02 |
| 3   | Fix home page session state | app/page.tsx | LG-07 |
| 3   | Add global header + sign out | components/Header.tsx | LG-08 |
| 3   | Fix auth middleware | proxy.ts / middleware.ts | LG-13 |
| 4   | Add image upload validation | image/upload/route.ts | LG-12 |
| 4   | Full regression test | All routes | All LG-01 to LG-13 |

## **Phase 2 — V2 Core Features (Week 2-3)**

| **Day** | **Task** | **File(s)** | **Verifies** |
| --- | --- | --- | --- |
| 5-6 | Split-screen editor with real iframe | app/edit/\[section\]/page.tsx | LG-09 |
| 7   | postMessage preview bridge | lib/preview.ts | LG-09 |
| 8-9 | Per-page scan flow | app/scanning/page.tsx, scan/pages/route.ts | V2 UX |
| 10  | Multi-site dashboard | app/dashboard/page.tsx, api/sites | LG-10 |
| 11-12 | Team invites + roles | app/team/, api/team/ | LG-11 |
| 13  | Version history UI | app/history/page.tsx | V2 feature |
| 14  | Full V2 test suite | All | All gaps closed |

# **10\. Demo Readiness Checklist**

Before any demo or investor presentation, verify every item below.

| **Item** | **Check** | **Status** |
| --- | --- | --- |
| Scan finds fields in test_next repo | fields.length > 0 | Verify after LG-04/05/06 fixes |
| Same repo returns same fields on rescan | fields identical on 3 runs | Verify after LG-02 fix |
| No dynamic content in detected fields | No { } in current_value | Verify after LG-03 fix |
| Backup branch created in GitHub | panelify-backup-YYYY-MM-DD exists | Working in V1 |
| content.json committed to GitHub | File exists at repo root | Working in V1 |
| JSX components read from content.json | import content present in Hero.tsx | Requires LG-01 fix |
| Edit title, publish, see on live site | h1 changes on live URL | Requires LG-01 fix |
| Live preview updates as you type | iframe reflects changes instantly | Requires LG-09 |
| Home page shows dashboard when logged in | No sign in button when authenticated | Requires LG-07 fix |
| Sign out accessible from all screens | Header visible everywhere | Requires LG-08 fix |
| All env vars set on Vercel | App loads on production URL | Required for deploy |