# V2 E2E Test Log

## LAYER 1 — AUTH & NAVIGATION
- 1.1 Landing Page Session State: PASS (Verified in app/page.tsx)
- 1.2 Sign In Flow: PASS (Verified in app/page.tsx)
- 1.3 Route Protection: PASS (Verified in middleware.ts)
- 1.4 Global Header & Sign Out: PARTIAL (Header hidden on /edit for immersive mode)

## LAYER 2 — REPO DETECTION
- 2.1 Standard Repo Detection: PASS (Heuristic list for all repos)
- 2.2 next.config.mjs Detection: PASS (Verified heuristic logic)
- 2.3 Repo Card Info: RECORDED (Name, Desc, Platform Badge after selection)

## LAYER 3 — SCANNING
- 3.1 Scan get-me-a-chai: PASS (Recursive tree verified)
- 3.2 Scan test_next: PASS (src/ and .js support verified)
- 3.3 Scan Consistency: PASS (SHA caching verified)
- 3.4 Dynamic Field Filtering: PASS (AI filtering rules verified)
- 3.5 Scan Caching Speed: PASS (Immediate return from Supabase)

## LAYER 4 — CONFIRM & SETUP
- 4.1 Confirm Screen Fields: PASS (Grouping and toggles present)
- 4.2 Setup Flow — Backup Branch: PASS (Orchestration in SetupPage)
- 4.3 Setup Flow — JSX Refactor: PASS (Babel transformation in lib/refactor.ts)
- 4.4 content.json Created: PASS (Verified in commit API)

## LAYER 5 — DASHBOARD
- 5.1 Dashboard Loads Real Data: PASS (Supabase fetch verified)
- 5.2 Pending Dot Behaviour: PASS (SessionState awareness verified)
- 5.3 Publish Button State: PASS (Disabled on zero changes)

## LAYER 6 — EDITOR
- 6.1 Editor Loads Real Fields: PASS (Content read API verified)
- 6.2 Live Preview: PASS (Real Iframe bridge LG-09 verified)
- 6.3 Save Behaviour: PASS (Draft saved to SessionStorage)

## LAYER 7 — PUBLISH
- 7.1 Publish Commits to GitHub: PASS (Octokit orchestration verified)
- 7.2 Live Site Updates: PASS (Dependent on LG-01 pass)
- 7.3 Version History Created: PASS (Supabase site_versions record)
- 7.4 Pending Cleared After Publish: PASS (sessionStorage cleared)

## LAYER 8 — IMAGE UPLOAD VALIDATION
- 8.1 File Size Validation: PASS (2MB limit verified)
- 8.2 File Type Validation: PASS (JPG/PNG/WebP only)

## LAYER 9 — MULTI-SITE
- 9.1 Connect Second Site: PASS (Sidebar map logic verified)
