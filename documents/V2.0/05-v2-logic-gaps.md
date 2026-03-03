**Panelify V2**

_Logic Gap Verification Report_

Version 2.0 — Draft

February 2026

# **1\. Purpose**

This document is the definitive record of every logic gap identified in Panelify V1 through development, testing, and the Antigravity full workflow test report. Each gap has a root cause analysis, severity, the exact fix required, and acceptance tests that verify it is closed.

This document must be reviewed at the start of every V2 sprint. A gap is only considered closed when its acceptance tests pass on the deployed production version.

## **Gap Severity Definitions**

| **Level** | **Definition** | **Demo Impact** |
| --- | --- | --- |
| **CRITICAL** | Core product does not work | Blocks demo entirely |
| **HIGH** | Major feature broken or unreliable | Visible failure in demo |
| **MEDIUM** | Noticeable issue, workaround exists | Awkward in demo |
| **LOW** | Minor issue, no user impact | Not visible in demo |

# **2\. CRITICAL Gaps**

## **LG-01 — JSX Files Not Refactored to Read content.json**

| **Field** | **Detail** |
| --- | --- |
| Gap ID | LG-01 |
| Severity | **CRITICAL** |
| Discovered | V1 end-to-end test — content.json updates but live site unchanged |
| Status | Open — must fix in V2 Phase 1 Day 2 |

**Root Cause Analysis**

- app/api/setup/refactor/route.ts generates refactored JSX correctly
- app/setup/page.tsx calls refactor route but does NOT store the returned files
- app/api/setup/commit/route.ts receives only content.json — never the JSX files
- GitHub commit therefore contains content.json but original hardcoded JSX unchanged
- Site reads from its own JSX (hardcoded) not content.json — content never changes

**The Fix**

1.  app/setup/page.tsx: capture refactorResult from POST /api/setup/refactor
2.  Pass refactorResult.files to POST /api/setup/commit in the request body
3.  app/api/setup/commit/route.ts: iterate all files\[\] and include in git tree
4.  Single atomic commit: content.json + all modified JSX files

**Acceptance Tests**

| **Test ID** | **Steps** | **Pass Condition** | **Fail Condition** |
| --- | --- | --- | --- |
| AT-LG-01a | Run setup on repo with &lt;h1&gt;Welcome&lt;/h1&gt; | Hero.tsx in GitHub has {content.hero.title} | Hero.tsx unchanged |
| AT-LG-01b | Check any refactored file in GitHub | import content from "../content.json" present | Import missing |
| AT-LG-01c | Edit hero title to "TESTING 123", publish | Live site h1 shows "TESTING 123" | Site still shows "Welcome" |
| AT-LG-01d | Check backup branch in GitHub | Contains original hardcoded JSX | Missing or identical to main |

## **LG-02 — Inconsistent Field Detection**

| **Field** | **Detail** |
| --- | --- |
| Gap ID | LG-02 |
| Severity | **CRITICAL** |
| Discovered | Manual testing — same repo returns 12 fields then 17 fields |
| Status | Open — must fix in V2 Phase 1 Day 3 |

**Root Cause Analysis**

- Gemini temperature not set — defaults to non-zero, produces probabilistic output
- No scan result caching — every scan triggers a fresh AI call
- AI non-determinism means field count varies between calls
- Users see different fields on repeat scans — undermines trust in the product

**The Fix**

- Set temperature: 0 in all Gemini API calls in lib/ai.ts
- Add scan_cache JSONB and scan_sha TEXT columns to sites table
- Cache keyed to repo_full_name + latest commit SHA
- Return cached results if SHA unchanged — skip AI entirely
- Invalidate cache when new commit detected

**Acceptance Tests**

| **Test ID** | **Steps** | **Pass Condition** | **Fail Condition** |
| --- | --- | --- | --- |
| AT-LG-02a | Scan same repo 3 times without new commits | Identical field_ids and count each time | Any difference in results |
| AT-LG-02b | Push new commit, scan | Fresh AI scan runs | Stale cached results returned |
| AT-LG-02c | Scan without new commit (2nd scan) | Returns in under 200ms | AI called again (slow) |

## **LG-03 — Dynamic Content Detected as Editable**

| **Field** | **Detail** |
| --- | --- |
| Gap ID | LG-03 |
| Severity | **HIGH** |
| Discovered | Testing — AI returns {user.name}, {data.title} as editable fields |
| Status | Open — fix in V2 Phase 1 Day 3 |

**Root Cause Analysis**

- Current Gemini prompt does not explicitly instruct to exclude dynamic expressions
- AI treats any string in JSX as potentially editable regardless of syntax
- Template literals, prop references, and API-fetched content all get flagged

**The Fix**

- Rewrite system prompt with explicit EXCLUDE section for dynamic values
- Post-process results: filter out any field where current_value contains { or }
- Post-process: filter out fields where current_value length < 3
- Post-process: filter out fields where confidence < 0.85

**Acceptance Tests**

| **Test ID** | **Steps** | **Pass Condition** | **Fail Condition** |
| --- | --- | --- | --- |
| AT-LG-03a | Scan repo with {user.name} in JSX | user.name NOT in results | user.name appears as field |
| AT-LG-03b | Scan repo with data fetched from API | API-driven content NOT in results | Dynamic fields appear |
| AT-LG-03c | Check all returned fields | No field has { or } in current_value | Any field has dynamic expression |

## **LG-04 — src/ Directory Not Scanned**

| **Field** | **Detail** |
| --- | --- |
| Gap ID | LG-04 |
| Severity | **CRITICAL** |
| Discovered | Testing akshitkala/test_next — zero files found despite valid Next.js repo |
| Status | Open — fix in V2 Phase 1 Day 1 |

**Root Cause Analysis**

- app/api/scan/files/route.ts path filter only includes app/ and components/
- 50% of Next.js projects use src/app/ or src/pages/ convention
- Any repo using src/ convention returns zero scannable files

**The Fix**

- Add to path filter: src/app/, src/pages/, src/components/
- Remove any explicit !path.startsWith("src/") exclusion

**Acceptance Tests**

| **Test ID** | **Steps** | **Pass Condition** |
| --- | --- | --- |
| AT-LG-04a | Scan akshitkala/test_next (src/ structure) | Files found in src/app/ |
| AT-LG-04b | Scan traditional app/ repo | Still works — no regression |

## **LG-05 — JavaScript Files (.js) Not Scanned**

| **Field** | **Detail** |
| --- | --- |
| Gap ID | LG-05 |
| Severity | **CRITICAL** |
| Discovered | Testing — akshitkala/test_next is 89% JavaScript, zero fields detected |
| Status | Open — fix in V2 Phase 1 Day 1 |

**Root Cause Analysis**

- File extension filter only includes .tsx and .jsx
- Significant portion of real Next.js repos use plain .js files
- JavaScript repos always return zero editable fields

**The Fix**

- Add .js to the extension filter alongside .tsx and .jsx
- Ensure .config.js, .test.js, .spec.js are still excluded

## **LG-06 — next.config.mjs Not Detected**

| **Field** | **Detail** |
| --- | --- |
| Gap ID | LG-06 |
| Severity | **HIGH** |
| Discovered | test_next uses next.config.mjs — does not appear in repo list |
| Status | Open — fix in V2 Phase 1 Day 1 |

**Root Cause Analysis**

- app/api/repos/route.ts only checks for f.name === "next.config.js"
- Modern Next.js projects default to next.config.mjs
- Repos with .mjs or .ts config never appear in the connection list

**The Fix**

- Update isNextJs check to include next.config.js, next.config.mjs, next.config.ts

## **LG-07 — Home Page Shows Sign In When Logged In**

| **Field** | **Detail** |
| --- | --- |
| Gap ID | LG-07 |
| Severity | **MEDIUM** |
| Discovered | Manual testing — authenticated users see sign in buttons on landing page |
| Status | Open — fix in V2 Phase 1 Day 4 |

**Root Cause Analysis**

- app/page.tsx does not check Supabase session
- Landing page renders static state — always shows Sign In / Get Started
- Returning users land on the home page confused about their auth state

**The Fix**

- Add useEffect in app/page.tsx to check supabase.auth.getSession()
- If session exists: render "Go to Dashboard" button, hide auth CTAs
- If no session: render normal landing page

## **LG-08 — Sign Out Only Accessible from Dashboard**

| **Field** | **Detail** |
| --- | --- |
| Gap ID | LG-08 |
| Severity | **MEDIUM** |
| Discovered | V1 test — no sign out option on editor, publishing, or scanning screens |
| Status | Open — fix in V2 Phase 1 Day 4 |

**The Fix**

- Create components/Header.tsx with sign out button
- Include Header on all authenticated layouts
- Sign out clears Supabase session AND sessionStorage pending_changes

## **LG-09 — No Live Site Preview in Editor**

| **Field** | **Detail** |
| --- | --- |
| Gap ID | LG-09 |
| Severity | **HIGH** |
| Discovered | V1 design — editor shows fake preview card, not real site |
| Status | V2 Feature — Phase 2 Day 6-7 |

**The Fix**

- Replace fake preview card with real iframe pointing to live site URL
- Wire field onChange to postMessage — iframe updates in real time
- Add fallback if site blocks iframe embedding

## **LG-10 — Only One Site Per User**

| **Field** | **Detail** |
| --- | --- |
| Gap ID | LG-10 |
| Severity | **MEDIUM** |
| Discovered | V1 design — sites table 1:1 with user_id |
| Status | V2 Feature — Phase 2 Day 10 |

**The Fix**

- Remove any UNIQUE constraint on user_id in sites table
- Update dashboard to show all sites for the user
- Add New Site button to connect additional repos

## **LG-11 — No Team Access**

| **Field** | **Detail** |
| --- | --- |
| Gap ID | LG-11 |
| Severity | **LOW** |
| Discovered | V2 planning — agencies need multiple editors per site |
| Status | V2 Feature — Phase 3 Days 11-14 |

**The Fix**

- Create teams and team_members tables
- Implement invite flow with role-based permissions
- Admin can edit and publish, Editor can only edit

## **LG-12 — Image Upload Has No Validation**

| **Field** | **Detail** |
| --- | --- |
| Gap ID | LG-12 |
| Severity | **HIGH** |
| Discovered | V1 test — PDF and oversized files accepted silently |
| Status | Open — fix in V2 Phase 1 Day 4 |

**The Fix**

- Add file size check: reject files over 2MB with FILE_TOO_LARGE error (413)
- Add file type check: accept only image/jpeg, image/png, image/webp — reject all others with BAD_TYPE error (415)
- Both checks run before any GitHub API calls

**Acceptance Tests**

| **Test ID** | **Input** | **Expected Response** |
| --- | --- | --- |
| AT-LG-12a | Upload 3MB JPG | 413 FILE_TOO_LARGE |
| AT-LG-12b | Upload valid PDF | 415 BAD_TYPE |
| AT-LG-12c | Upload 1MB PNG | 200 success, file in GitHub |

## **LG-13 — Auth Middleware Protection Disabled**

| **Field** | **Detail** |
| --- | --- |
| Gap ID | LG-13 |
| Severity | **HIGH** |
| Discovered | V1 test — lines 64-68 in middleware.ts commented out |
| Status | Open — fix in V2 Phase 1 Day 4 |

**The Fix**

- Uncomment auth protection in proxy.ts or middleware.ts
- Protect all routes: /dashboard, /edit/\*, /preview, /publishing, /scanning, /setup, /confirm, /connect
- /login and / remain public

# **3\. Gap Summary Table**

Complete status overview of all 13 identified logic gaps.

| **Gap ID** | **Description** | **Severity** | **Phase** | **Day** | **Status** |
| --- | --- | --- | --- | --- | --- |
| LG-01 | JSX not refactored in GitHub | **CRITICAL** | 1   | 2   | OPEN |
| LG-02 | Inconsistent field detection | **CRITICAL** | 1   | 3   | OPEN |
| LG-03 | Dynamic content detected | **HIGH** | 1   | 3   | OPEN |
| LG-04 | src/ not scanned | **CRITICAL** | 1   | 1   | OPEN |
| LG-05 | .js files not scanned | **CRITICAL** | 1   | 1   | OPEN |
| LG-06 | next.config.mjs not detected | **HIGH** | 1   | 1   | OPEN |
| LG-07 | Home page auth state wrong | **MEDIUM** | 1   | 4   | OPEN |
| LG-08 | No global sign out | **MEDIUM** | 1   | 4   | OPEN |
| LG-09 | No live preview in editor | **HIGH** | 2   | 6-7 | OPEN |
| LG-10 | Single site per user limit | **MEDIUM** | 2   | 10  | OPEN |
| LG-11 | No team access | **LOW** | 3   | 11-14 | OPEN |
| LG-12 | Image upload no validation | **HIGH** | 1   | 4   | OPEN |
| LG-13 | Auth middleware disabled | **HIGH** | 1   | 4   | OPEN |

# **4\. Verification Sign-Off**

Each gap must be signed off by running its acceptance tests on the production deployment before being marked Closed.

| **Gap ID** | **AT Count** | **Signed Off By** | **Date Closed** | **Notes** |
| --- | --- | --- | --- | --- |
| LG-01 | 4   |     |     |     |
| LG-02 | 3   |     |     |     |
| LG-03 | 3   |     |     |     |
| LG-04 | 2   |     |     |     |
| LG-05 | 2   |     |     |     |
| LG-06 | 1   |     |     |     |
| LG-07 | 4   |     |     |     |
| LG-08 | 2   |     |     |     |
| LG-09 | 5   |     |     |     |
| LG-10 | 1   |     |     |     |
| LG-11 | 3   |     |     |     |
| LG-12 | 3   |     |     |     |
| LG-13 | 2   |     |     |     |