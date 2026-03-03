**Panelify V2**

_Build Order & Sprint Plan_

Version 2.0 — Draft

February 2026

# **1\. Overview**

This document defines the exact order in which V2 work should be done. Phase 1 fixes all broken V1 functionality. Phase 2 adds V2 features on top of a solid foundation. Never start Phase 2 until all Phase 1 items are verified working.

| **Phase** | **Focus** | **Duration** | **Exit Criteria** |
| --- | --- | --- | --- |
| Phase 1 — Fixes | Repair all broken V1 functionality | Week 1 (Days 1-5) | All 13 logic gaps closed, full test suite passes |
| Phase 2 — V2 Core | Live preview, per-page scan, multi-site | Week 2-3 (Days 6-14) | FR-V2-01, 02, 03 complete and tested |
| Phase 3 — V2 Extended | Team access, version history | Week 4 (Days 15-18) | FR-V2-04, 05 complete |
| Phase 4 — Polish | UI overhaul, performance, deploy | Days 19-21 | Demo-ready on production URL |

# **2\. Phase 1 — Critical Fixes**

## **Day 1 — Scanner Repair**

Goal: Panelify scans any real-world Next.js repo correctly.

| **Task** | **File** | **Time** | **Verifies** |
| --- | --- | --- | --- |
| Add .js/.jsx to file extension filter | app/api/scan/files/route.ts | 30 min | LG-05 |
| Add src/ paths to directory filter | app/api/scan/files/route.ts | 20 min | LG-04 |
| Add next.config.mjs/.ts to repo filter | app/api/repos/route.ts | 15 min | LG-06 |
| Test on akshitkala/test_next | Manual test | 30 min | LG-04, 05, 06 |
| Verify no regression on get-me-a-chai | Manual test | 20 min | Regression check |

**Day 1 Exit Criteria**

- akshitkala/test_next appears in repo list
- Scanning test_next returns at least 1 editable field
- get-me-a-chai still scans correctly

## **Day 2 — JSX Refactor Fix (Most Critical)**

Goal: After setup, JSX files are rewritten AND committed to GitHub. Content changes appear on the live site.

| **Task** | **File** | **Time** | **Verifies** |
| --- | --- | --- | --- |
| Audit lib/refactor.ts output correctness | lib/refactor.ts | 45 min | LG-01 |
| Fix setup/page.tsx to capture refactor result | app/setup/page.tsx | 30 min | LG-01 |
| Fix setup/commit to commit JSX + content.json | app/api/setup/commit/route.ts | 45 min | LG-01 |
| Test: verify Hero.tsx has import in GitHub | Manual GitHub check | 20 min | AT-FIX-01b |
| Test: edit title, publish, verify live site | Full end-to-end | 30 min | AT-FIX-01c |

**Day 2 Exit Criteria**

- Hero.tsx in GitHub contains import content from "../content.json"
- Hero.tsx in GitHub contains {content.hero.title} not hardcoded string
- Edit title in dashboard, publish, see change on live site URL

## **Day 3 — Deterministic AI Detection**

Goal: Same repo always returns same fields. Dynamic content never detected as editable.

| **Task** | **File** | **Time** | **Verifies** |
| --- | --- | --- | --- |
| Set Gemini temperature: 0 | lib/ai.ts | 10 min | LG-02 |
| Rewrite AI system prompt with strict rules | lib/ai.ts | 45 min | LG-02, LG-03 |
| Add post-filter to remove {variable} fields | app/api/scan/analyze/route.ts | 20 min | LG-03 |
| Add scan result cache to sites table | app/api/scan/analyze/route.ts | 45 min | LG-02 |
| Test: scan same repo 3 times | Manual test | 20 min | AT-FIX-02a |
| Test: scan repo with dynamic content | Manual test | 15 min | AT-FIX-02b |

**Day 3 Exit Criteria**

- Scan get-me-a-chai three times — identical field list each time
- No field in results has current_value containing { or }
- Second scan of unchanged repo returns instantly from cache

## **Day 4 — Auth & Navigation Fixes**

Goal: Session-aware landing page, global sign out, protected routes.

| **Task** | **File** | **Time** | **Verifies** |
| --- | --- | --- | --- |
| Add session check to landing page | app/page.tsx | 20 min | LG-07 |
| Create persistent header component | components/Header.tsx | 45 min | LG-08 |
| Add header to all authenticated layouts | app/layout.tsx or per-page | 30 min | LG-08 |
| Uncomment auth middleware protection | proxy.ts / middleware.ts | 15 min | LG-13 |
| Add image upload validation | app/api/image/upload/route.ts | 20 min | LG-12 |
| Test all auth scenarios | Manual test | 30 min | AT-FIX-04a through 04d |

**Day 4 Exit Criteria**

- Logged-in user sees Go to Dashboard on home page
- Sign out button visible on dashboard, editor, and publishing screens
- Visiting /dashboard logged out redirects to /login
- PDF upload returns BAD_TYPE error, 3MB image returns FILE_TOO_LARGE

## **Day 5 — Full V1 Regression Test**

Goal: Confirm everything works end to end on both test repos. Antigravity runs the full test suite.

| **Test Area** | **Method** | **Expected** | **Logic Gaps Verified** |
| --- | --- | --- | --- |
| Landing page session state | Manual | Dashboard link when logged in | LG-07 |
| Auth middleware | Manual | Redirect to login without session | LG-13 |
| Repo detection — test_next | Manual scan | Repo listed, fields found | LG-04, 05, 06 |
| Scan consistency | Scan 3x | Identical results | LG-02 |
| Dynamic field filtering | Scan dynamic repo | No {variable} fields | LG-03 |
| Setup — JSX refactor | Full setup run | JSX rewritten in GitHub | LG-01 |
| Publish — live site update | Edit + publish | Change visible on live URL | LG-01 |
| Image upload validation | Upload PDF | BAD_TYPE error | LG-12 |
| Global sign out | Click sign out | Redirected to home | LG-08 |

**Phase 1 Complete When**

- All 13 logic gaps verified closed
- Full end-to-end flow works on both test repos
- No critical or high severity issues remain
- Git tagged: v2.0-phase1-complete

# **3\. Phase 2 — V2 Core Features**

## **Days 6-7 — Split-Screen Live Preview Editor**

Goal: Editor shows real live site in iframe. Changes appear instantly as user types.

| **Task** | **File** | **Time** | **Verifies** |
| --- | --- | --- | --- |
| Create lib/preview.ts postMessage bridge | lib/preview.ts | 60 min | FR-V2-01 |
| Redesign editor layout — iframe left, fields right | app/edit/\[section\]/page.tsx | 90 min | FR-V2-01 |
| Wire field onChange to postMessage | app/edit/\[section\]/page.tsx | 45 min | AT-V2-01a |
| Add iframe load error fallback | app/edit/\[section\]/page.tsx | 30 min | AT-V2-01b |
| Add Reset button | app/edit/\[section\]/page.tsx | 20 min | AT-V2-01e |
| Test on live site that allows iframe | Manual test | 30 min | AT-V2-01a |
| Test on site blocking iframe | Manual test | 20 min | AT-V2-01b |

## **Days 8-9 — Per-Page Scanning**

Goal: Scan screen shows live site, user picks pages to scan individually.

| **Task** | **File** | **Time** | **Verifies** |
| --- | --- | --- | --- |
| Create POST /api/scan/pages route | app/api/scan/pages/route.ts | 60 min | FR-V2-02 |
| Add detectPagesFromURL() to lib/scanner.ts | lib/scanner.ts | 60 min | FR-V2-02 |
| Redesign scanning page — iframe + page tabs | app/scanning/page.tsx | 90 min | FR-V2-02 |
| Wire page tab click to on-demand scan | app/scanning/page.tsx | 45 min | FR-V2-02 |
| Add iframe fallback for blocked sites | app/scanning/page.tsx | 30 min | FR-V2-02 |
| Update confirm page — fields grouped by page | app/confirm/page.tsx | 45 min | FR-V2-02 |

## **Day 10 — Multi-Site Dashboard**

Goal: Users can connect and manage multiple sites from one dashboard.

| **Task** | **File** | **Time** | **Verifies** |
| --- | --- | --- | --- |
| Create GET /api/sites route | app/api/sites/route.ts | 30 min | FR-V2-03 |
| Update dashboard to show all sites | app/dashboard/page.tsx | 60 min | FR-V2-03 |
| Add New Site button and flow | app/dashboard/page.tsx | 30 min | FR-V2-03 |
| Update sites table — link to user_id not 1:1 | Supabase SQL | 20 min | FR-V2-03 |
| Test: connect 3 repos, all appear in dashboard | Manual test | 30 min | FR-V2-03 |

## **Days 11-14 — Team Access**

Goal: Site owners can invite editors. Editors can edit but not publish.

| **Task** | **File** | **Time** | **Verifies** |
| --- | --- | --- | --- |
| Create teams + team_members tables | Supabase SQL | 30 min | FR-V2-04 |
| Create team management page | app/team/page.tsx | 90 min | FR-V2-04 |
| Create POST /api/team/invite route | app/api/team/invite/route.ts | 60 min | FR-V2-04 |
| Create GET /api/team route | app/api/team/route.ts | 30 min | FR-V2-04 |
| Add role check to publish button | app/dashboard/page.tsx | 20 min | FR-V2-04 |
| Test: invite user, verify Editor cannot publish | Manual test | 45 min | FR-V2-04 |

# **4\. Phase 3 — V2 Extended Features**

## **Days 15-16 — Version History**

| **Task** | **File** | **Time** | **Verifies** |
| --- | --- | --- | --- |
| Create site_versions table | Supabase SQL | 20 min | FR-V2-05 |
| Store snapshot on each publish | app/api/content/write/route.ts | 30 min | FR-V2-05 |
| Create version history page | app/history/page.tsx | 90 min | FR-V2-05 |
| Add restore functionality | app/api/content/restore/route.ts | 60 min | FR-V2-05 |

## **Days 17-18 — Platform Expansion**

| **Task** | **File** | **Time** | **Verifies** |
| --- | --- | --- | --- |
| Add Railway detection heuristics | lib/platform.ts | 30 min | V2 feature |
| Add Render detection heuristics | lib/platform.ts | 30 min | V2 feature |
| Update platform badge UI | components/PlatformBadge.tsx | 20 min | V2 feature |
| Test on Railway-deployed repo | Manual test | 30 min | V2 feature |

# **5\. Phase 4 — UI Overhaul & Deploy**

## **Days 19-20 — UI Polish**

V1 UI feedback: too dark, elements hard to find, not interactive enough.

| **Area** | **Issue** | **Fix** |
| --- | --- | --- |
| Color contrast | Too dark, hard to read | Increase contrast ratio, add lighter surface variants |
| Interactive elements | Buttons not obviously clickable | Add hover states, shadows, clear affordances |
| Empty states | Blank screens with no guidance | Add empty state illustrations and CTAs |
| Loading states | Spinner only | Add skeleton screens for dashboard and editor |
| Error states | Raw JSON error text shown | User-friendly error messages with retry actions |
| Section cards | Flat, no visual hierarchy | Add icons, dividers, hover effects |
| Dashboard | All sections look identical | Add section type icons, field count badge |

## **Day 21 — Production Deploy**

| **Task** | **Detail** | **Time** |
| --- | --- | --- |
| Push final code to GitHub main | git tag v2.0 | 10 min |
| Set all env vars on Vercel | SUPABASE keys, GEMINI key, GROQ key, APP_URL | 20 min |
| Update GitHub OAuth callback URL | Change to Vercel production URL in GitHub OAuth App settings | 10 min |
| Update Supabase auth callback URL | Add Vercel URL to allowed URLs in Supabase dashboard | 10 min |
| Run full end-to-end on production | Complete flow from login to publish on prod URL | 45 min |
| Prepare demo script and backup repo | 90 second demo rehearsal x5 | 60 min |

# **6\. Critical Path**

These items block everything downstream. If any of these slip, the entire timeline shifts.

| **Day** | **Critical Item** | **Blocks** |
| --- | --- | --- |
| Day 2 | JSX refactor fix | Core value proposition of the product |
| Day 3 | Deterministic scan | Reliable demo — inconsistent scan fails live |
| Day 5 | Full regression pass | Cannot start Phase 2 until Phase 1 is solid |
| Day 7 | Live preview iframe | Biggest demo moment — must work perfectly |
| Day 21 | Production deploy + env vars | Nothing else matters if prod is broken |

# **7\. Cut List**

If time runs short, cut these in order. Never cut Phase 1 fixes or live preview.

| **Item** | **Priority** | **Can Cut?** | **Impact if Cut** |
| --- | --- | --- | --- |
| Version history | P2  | Yes | No demo impact — mention as roadmap |
| Team access | P2  | Yes — for demo | Pitch as roadmap item |
| Platform expansion (Railway/Render) | P2  | Yes | Demo on Vercel only |
| Per-page scanning (V2 UX) | P1  | Defer to post-demo | Use V1 bulk scan for demo |
| Multi-site dashboard | P1  | Defer to post-demo | Show single site in demo |
| JSX refactor fix | P0  | NEVER CUT | Product does not work without this |
| Live preview iframe | P0  | NEVER CUT | Demo is significantly weaker without this |
| Scanner fixes (.js, src/) | P0  | NEVER CUT | Cannot scan real-world repos |