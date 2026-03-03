**Panelify V2**

_Technical Requirements Document_

Version 2.0 — Draft

February 2026

# **1\. Purpose**

This document defines all functional and non-functional requirements for Panelify V2. It serves as the contract between product intent and engineering implementation. Every requirement has an ID, priority, and acceptance test.

V2 requirements are divided into two categories: V1 Bug Fixes (broken functionality that must be repaired) and V2 New Features (new capabilities being introduced for the first time).

## **1.1 Requirement Priority Levels**

| **Level** | **Meaning** | **Must ship for demo?** |
| --- | --- | --- |
| P0 — Critical | Core product broken without this | Yes |
| P1 — High | Significant user-facing issue | Yes |
| P2 — Medium | Notable gap, workaround exists | No  |
| P3 — Low | Nice to have, no user impact | No  |

# **2\. V1 Bug Fix Requirements**

## **FR-FIX-01: JSX Refactor Must Write to GitHub**

| **Field** | **Value** |
| --- | --- |
| ID  | FR-FIX-01 |
| Priority | P0 — Critical |
| Status | Broken in V1 |
| Root Cause | setup/commit/route.ts only commits content.json, not refactored JSX files |
| Impact | Content changes never appear on live site |

**Requirements**

- lib/refactor.ts must correctly transform JSX string literals to content references
- app/api/setup/refactor/route.ts must return refactored file contents in response
- app/setup/page.tsx must pass refactored files to setup/commit
- app/api/setup/commit/route.ts must commit ALL files: content.json + every refactored JSX file
- Single git commit must contain all changes atomically

**Acceptance Tests**

| **Test** | **Input** | **Expected Output** |
| --- | --- | --- |
| AT-FIX-01a | Run setup on repo with &lt;h1&gt;Welcome&lt;/h1&gt; | Hero.tsx in GitHub contains {content.hero.title} |
| AT-FIX-01b | Open any refactored component in GitHub | import content from "../content.json" present |
| AT-FIX-01c | Edit hero title, publish | Live site h1 shows new title |
| AT-FIX-01d | Check backup branch | Contains original hardcoded JSX |

## **FR-FIX-02: Deterministic Field Detection**

| **Field** | **Value** |
| --- | --- |
| ID  | FR-FIX-02 |
| Priority | P0 — Critical |
| Status | Inconsistent in V1 |
| Root Cause | Gemini temperature not set to 0, no caching |
| Impact | Users see different fields on repeat scans — erodes trust |

**Requirements**

- Gemini API calls must set temperature: 0
- Scan results must be cached keyed to repo_full_name + latest commit SHA
- Cached results returned instantly on rescan if SHA unchanged
- Cache invalidated automatically on new commit push
- Only return fields with confidence >= 0.85
- Post-filter: remove any field where current_value contains { or }

**Acceptance Tests**

| **Test** | **Steps** | **Expected Output** |
| --- | --- | --- |
| AT-FIX-02a | Scan same repo 3 times in a row | Identical field count and field_ids each time |
| AT-FIX-02b | Scan repo with dynamic content {user.name} | Dynamic field NOT in results |
| AT-FIX-02c | Push new commit, rescan | New scan runs (cache invalidated) |
| AT-FIX-02d | Scan without new commit | Cached results returned instantly (<200ms) |

## **FR-FIX-03: Full Repository Structure Support**

| **Field** | **Value** |
| --- | --- |
| ID  | FR-FIX-03 |
| Priority | P0 — Critical |
| Status | Broken in V1 |
| Root Cause | Scanner only handles .tsx + app/ root |
| Impact | Majority of real-world repos return zero fields |

**Requirements**

- Scanner must include .js, .jsx, .ts, .tsx file extensions
- Scanner must look in: app/, src/app/, src/pages/, pages/, components/, src/components/
- Repo filter must detect next.config.js, next.config.mjs, next.config.ts
- No explicit exclusion of src/ directory

**Acceptance Tests**

| **Test** | **Repo Characteristics** | **Expected Output** |
| --- | --- | --- |
| AT-FIX-03a | akshitkala/test_next — src/, .js, .mjs config | Repo listed, files found, fields detected |
| AT-FIX-03b | Any JS-only Next.js repo | Fields detected from .js files |
| AT-FIX-03c | Repo with src/components/ | Components found and scanned |
| AT-FIX-03d | next.config.mjs at root | Repo appears in connection list |

## **FR-FIX-04: Session-Aware Landing Page**

| **Field** | **Value** |
| --- | --- |
| ID  | FR-FIX-04 |
| Priority | P1 — High |
| Status | Broken in V1 |
| Root Cause | No session check on app/page.tsx |
| Impact | Logged-in users see Sign In — confusing and unprofessional |

**Requirements**

- app/page.tsx must check Supabase session on load
- If session exists: show Go to Dashboard button, hide Get Started and Sign In
- If no session: show standard landing page with Get Started and Sign In
- Global header must be present on all authenticated screens
- Header must include sign out button accessible from every screen

**Acceptance Tests**

| **Test** | **Steps** | **Expected Output** |
| --- | --- | --- |
| AT-FIX-04a | Log in, visit home page | "Go to Dashboard" visible, "Sign In" hidden |
| AT-FIX-04b | Sign out from dashboard, visit home | "Get Started" visible |
| AT-FIX-04c | Log in, visit /edit/hero | Sign out button visible in header |
| AT-FIX-04d | Log in, navigate through all screens | Header persistent everywhere |

## **FR-FIX-05: Auth Middleware Protection**

| **Field** | **Value** |
| --- | --- |
| ID  | FR-FIX-05 |
| Priority | P1 — High |
| Status | Disabled in V1 (commented out) |
| Root Cause | Lines 64-68 in middleware.ts commented out |
| Impact | Any user can access dashboard, editor, and publishing without login |

**Requirements**

- Middleware must protect: /dashboard, /edit/\*, /preview, /publishing, /scanning, /setup, /confirm, /connect
- Unauthenticated access to protected routes redirects to /login
- /login and / must remain publicly accessible

# **3\. V2 New Feature Requirements**

## **FR-V2-01: Split-Screen Live Preview Editor**

| **Field** | **Value** |
| --- | --- |
| ID  | FR-V2-01 |
| Priority | P0 — Critical |
| Status | New in V2 |
| Goal | Replace fake preview card with real live site preview that updates as user types |

**Requirements**

- Editor layout: left panel 60% — live site iframe, right panel 40% — field inputs
- iframe src must be the actual deployed site URL from sites table
- On field value change: postMessage to iframe with updated value
- iframe must receive messages and update DOM without page reload
- If site blocks iframe (X-Frame-Options): show fallback preview card with warning
- Actual site only updates after Publish — preview is local only
- Reset button restores iframe to original values

**Acceptance Tests**

| **Test** | **Steps** | **Expected Output** |
| --- | --- | --- |
| AT-V2-01a | Open editor, type in title field | iframe h1 updates within 100ms |
| AT-V2-01b | Open editor on site blocking iframe | Warning shown, fallback preview displayed |
| AT-V2-01c | Edit field, do not publish, reload | Live site still shows original value |
| AT-V2-01d | Edit field, publish | Live site now shows new value |
| AT-V2-01e | Click Reset | iframe shows original values, inputs reset |

## **FR-V2-02: Per-Page Scanning with Site Preview**

| **Field** | **Value** |
| --- | --- |
| ID  | FR-V2-02 |
| Priority | P1 — High |
| Status | New in V2 |
| Goal | Replace bulk file scan with per-page scanning driven by live site navigation |

**Requirements**

- Scan screen shows live site iframe on left, page tabs detected from site navigation
- Pages detected by fetching homepage HTML and extracting internal anchor hrefs
- Each page tab shows scan state: unscanned / scanning / N fields found / 0 fields
- Scanning triggered on-demand when user clicks a page tab
- Each page scan: map URL to source files, send to AI, return fields tagged with page
- User selects which pages to make editable before proceeding to setup
- If site blocks iframe: fallback to page card list (no iframe)

## **FR-V2-03: Multi-Site Dashboard**

| **Field** | **Value** |
| --- | --- |
| ID  | FR-V2-03 |
| Priority | P1 — High |
| Status | New in V2 |
| Goal | Allow users to manage multiple sites from one account |

**Requirements**

- Dashboard shows all sites connected by the user
- Each site card shows: site name, URL, platform badge, last published, pending changes count
- Add New Site button connects additional repos
- Sites stored in sites table linked to user_id
- Switching between sites loads that sites content.json and sections

## **FR-V2-04: Team Access with Roles**

| **Field** | **Value** |
| --- | --- |
| ID  | FR-V2-04 |
| Priority | P2 — Medium |
| Status | New in V2 |
| Goal | Allow multiple people to edit the same site with different permission levels |

**Requirements**

- Site owner can invite team members via email
- Two roles: Admin (can edit + publish) and Editor (can edit, cannot publish)
- Invited users receive email with link to accept invitation
- Team members see shared sites in their dashboard
- Publish button hidden for Editor role

**Role Permission Matrix**

| **Action** | **Owner** | **Admin** | **Editor** |
| --- | --- | --- | --- |
| View dashboard | Yes | Yes | Yes |
| Edit content fields | Yes | Yes | Yes |
| Publish changes | Yes | Yes | No  |
| Connect new repo | Yes | No  | No  |
| Invite team members | Yes | No  | No  |
| Remove team members | Yes | No  | No  |
| Disconnect site | Yes | No  | No  |

## **FR-V2-05: Version History**

| **Field** | **Value** |
| --- | --- |
| ID  | FR-V2-05 |
| Priority | P2 — Medium |
| Status | New in V2 |
| Goal | Allow users to view and restore previous published versions of their content |

**Requirements**

- Every successful publish stores a snapshot in site_versions table
- Version history screen shows list of versions with date, user, changes summary
- Clicking a version shows a diff of what changed
- Restore button republishes that versions content.json
- Maximum 50 versions stored per site

# **4\. Non-Functional Requirements**

| **ID** | **Category** | **Requirement** | **Measurement** |
| --- | --- | --- | --- |
| NFR-01 | Performance | Scan completion under 15 seconds for repos up to 50 files | Timer from scan start to confirm screen |
| NFR-02 | Performance | Live preview update under 100ms after keystroke | postMessage round trip time |
| NFR-03 | Performance | Dashboard load under 2 seconds | Time from navigation to fully loaded |
| NFR-04 | Reliability | Groq fallback activates within 3 seconds of Gemini failure | Timeout trigger time |
| NFR-05 | Reliability | Setup commit is atomic — all files or none | GitHub commit contains all files |
| NFR-06 | Security | GitHub token never exposed to browser | No token in API responses or client code |
| NFR-07 | Security | All protected routes require valid session | Unauthenticated request returns 401/redirect |
| NFR-08 | Compatibility | Works on repos using src/ and non-src/ structure | Verified on both structures |
| NFR-09 | Compatibility | Works on .js and .tsx repos | Verified on both file types |
| NFR-10 | Cost | Zero AI cost on free tier for typical usage | Gemini Flash free tier sufficient |

# **5\. Requirements Traceability Matrix**

Maps every requirement to its logic gap, implementation file, and acceptance test.

| **Req ID** | **Logic Gap** | **Primary File** | **Acceptance Test** | **Priority** |
| --- | --- | --- | --- | --- |
| FR-FIX-01 | LG-01 | setup/commit/route.ts | AT-FIX-01a through 01d | P0  |
| FR-FIX-02 | LG-02, LG-03 | lib/ai.ts, scan/analyze/route.ts | AT-FIX-02a through 02d | P0  |
| FR-FIX-03 | LG-04, LG-05, LG-06 | scan/files/route.ts, repos/route.ts | AT-FIX-03a through 03d | P0  |
| FR-FIX-04 | LG-07, LG-08 | app/page.tsx, components/Header.tsx | AT-FIX-04a through 04d | P1  |
| FR-FIX-05 | LG-13 | proxy.ts / middleware.ts | Visit protected route logged out | P1  |
| FR-V2-01 | LG-09 | app/edit/\[section\]/page.tsx, lib/preview.ts | AT-V2-01a through 01e | P0  |
| FR-V2-02 | V2 UX | app/scanning/page.tsx, scan/pages/route.ts | Per-page scan works | P1  |
| FR-V2-03 | LG-10 | app/dashboard/page.tsx, api/sites | Multiple sites in dashboard | P1  |
| FR-V2-04 | LG-11 | app/team/, api/team/ | Invite user, verify role restrictions | P2  |
| FR-V2-05 | V2 feature | app/history/, site_versions table | Restore previous version | P2  |