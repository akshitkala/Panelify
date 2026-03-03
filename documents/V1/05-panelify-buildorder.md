**PANELIFY**

_Build Order Document_

Version 1.1 — Windsurf + Gemini + Netlify Support

Deadline: Start: Feb 20, 2026 · Deadline: March 10, 2026

# **Changelog v1.0 → v1.1**

| **Change** | **Days Affected** |
| --- | --- |
| Windsurf setup added to Day 1 — install, configure, connect to repo | Day 1 |
| lib/ai.ts abstraction added to Day 4 before any provider code | Day 4 |
| Gemini Flash setup replaces Claude API setup on Day 5 | Day 5 |
| Groq fallback wired into lib/ai.ts on Day 5 | Day 5 |
| Platform detection (lib/platform.ts) added to Day 2 | Day 2 |
| Netlify publish support added — same commit flow, both platforms | Day 14 |
| lib/refactor.ts spec doc created — before/after examples, safety rules | Day 7 |
| Deploy status polling defined — URL polling via lib/deploy-poll.ts | Day 14 |

# **1\. Phase Overview**

| **Phase** | **Days** | **Focus** | **Outcome** |
| --- | --- | --- | --- |
| Phase 1 | Days 1–3 | Foundation | Windsurf ready, auth working, DB set up, platform detection built |
| Phase 2 | Days 4–6 | Scan engine | lib/ai.ts built, Gemini + Groq scanning a real repo through the UI |
| Phase 3 | Days 7–9 | Setup flow | Backup branch, content.json, JSX refactor, commit all working |
| Phase 4 | Days 10–12 | Admin panel | Dashboard, editor, live preview all working |
| Phase 5 | Days 13–14 | Publish flow | Full publish on Vercel AND Netlify working end to end |
| Phase 6 | Days 15–16 | Landing page | Screen 0 built, complete 10-screen flow navigable |
| Phase 7 | Days 17–18 | Polish + demo | Demo rehearsed, edge cases handled, ready to ship |

# **2\. Daily Build Plan**

## **DAY 1 — Windsurf + Project Setup + Auth**

| **Task** | **Time** | **Notes** |
| --- | --- | --- |
| Install Windsurf — download from codeium.com/windsurf | 10 min | Free tier — no credit card |
| Open Windsurf, configure AI assistant, test it on a simple prompt | 10 min | Make sure it's working before writing any real code |
| Create Next.js 14 project: npx create-next-app@latest panelify --typescript --tailwind --app | 15 min | App Router, TypeScript, Tailwind all included |
| Install Shadcn: npx shadcn@latest init | 10 min | Select dark theme |
| Install core deps: npm install @supabase/ssr @supabase/supabase-js @octokit/rest dompurify @types/dompurify | 10 min | All free packages |
| Create Supabase project at supabase.com — copy keys to .env.local | 15 min | Free tier — no credit card |
| Create GitHub OAuth App at github.com/settings/developers — copy keys | 10 min | Callback URL: http://localhost:3000/api/auth/callback |
| Implement Supabase Auth with GitHub OAuth | 30 min | Follow Supabase GitHub OAuth guide exactly |
| Build Screen 1 — Login UI | 20 min | GitHub button, Panelify logo, dark theme |
| Test: GitHub login works, session created in Supabase | 10 min | Verify row in auth.users via Supabase dashboard |

## **DAY 2 — Database + Repo Connection + Platform Detection**

| **Task** | **Time** | **Notes** |
| --- | --- | --- |
| Create sites table in Supabase — run SQL from Data Model doc (includes platform column) | 15 min | platform TEXT NOT NULL DEFAULT 'unknown' |
| Build lib/platform.ts — detectPlatform() function | 25 min | Check vercel.json, netlify.toml, Vercel API. Return platform type. |
| Build GET /api/repos — list user's GitHub repos via Octokit | 25 min | Filter to Next.js repos only (check for next.config.js) |
| Build POST /api/platform/detect — call lib/platform.ts | 15 min | Returns platform string. Store in sites.platform on connection. |
| Build Screen 2 — Connect Repo UI with platform badge after selection | 35 min | Repo list, search, platform badge shown after auto-detection |
| Insert sites row with platform on repo selection | 10 min | Verify in Supabase — platform field populated correctly |
| Test: pick Vercel repo → shows Vercel badge. Pick Netlify repo → shows Netlify badge. | 10 min | Critical — test both platforms |

## **DAY 3 — Route Protection + Navigation**

| **Task** | **Time** | **Notes** |
| --- | --- | --- |
| Add Next.js middleware — protect all /dashboard, /edit, /preview, /publishing routes | 20 min | Redirect to /login if no Supabase session |
| Implement redirect logic: new user → /connect, returning user → /dashboard | 15 min | Check sites table on login callback |
| Add loading states and error handling to auth flow | 20 min | Spinner on OAuth redirect, error banner on failure |
| Test full auth flow 3 times: new user login → connect → redirect | 15 min | Must be flawless before moving to Phase 2 |

## **DAY 4 — lib/ai.ts + Gemini + Groq Setup**

| **Task** | **Time** | **Notes** |
| --- | --- | --- |
| Create Gemini API key at aistudio.google.com — free, no credit card | 10 min | Add GOOGLE_GEMINI_API_KEY to .env.local |
| Create Groq API key at console.groq.com — free, no credit card | 10 min | Add GROQ_API_KEY to .env.local |
| Install AI SDKs: npm install @google/generative-ai groq-sdk | 5 min | Both free packages |
| Build lib/ai.ts — analyzeJSX() with Gemini primary + Groq fallback | 50 min | The most important file. Write it carefully. Test fallback by mocking Gemini failure. |
| Write unit test for lib/ai.ts: mock Gemini 429 → verify Groq called | 20 min | Run with: npx tsx lib/ai.test.ts |
| Test lib/ai.ts on a real JSX file — verify field output format | 15 min | Log output. Check field_id, label, type, confidence are all present. |

## **DAY 5 — File Fetching + Full Scan Pipeline**

| **Task** | **Time** | **Notes** |
| --- | --- | --- |
| Install Babel: npm install @babel/parser @babel/traverse @babel/generator @babel/types | 5 min | All free |
| Build lib/scanner.ts — extract JSX strings and image paths using Babel AST | 40 min | Not regex. Use Babel traverse to walk the AST. Test on 3 different component patterns. |
| Build POST /api/scan/files — fetch all JSX/TSX files from GitHub via Octokit | 25 min | Returns \[{path, content}\] array |
| Build POST /api/scan/analyze — call lib/ai.ts analyzeJSX() | 20 min | Batch files in groups of 4. Merge results. |
| Build POST /api/scan/prepare — convert AI output to ContentSchema | 15 min | Pure computation. No external calls. |
| Test full pipeline on demo repo: /files → /analyze → /prepare | 20 min | Log each step output. Verify schema is correct JSON. |

## **DAY 6 — Scan UI (Screens 3 + 4)**

| **Task** | **Time** | **Notes** |
| --- | --- | --- |
| Build Screen 3 — Scanning progress with 5 animated steps | 40 min | Steps tick as each API call completes. Progress bar fills. |
| Build Screen 4 — Scan confirmation with field rows, toggle, skip, flagged highlight | 40 min | Confirmed fields checkable. Flagged fields have skip button. Confirm button disabled until 1+ field confirmed. |
| Wire scan API calls sequentially to Screen 3 progress steps | 20 min | Each API call completes → next step activates |
| Test: scan a real Next.js repo end to end through the UI | 20 min | Critical path — must work perfectly |

## **DAY 7 — Backup Branch + content.json + lib/refactor.ts**

| **Task** | **Time** | **Notes** |
| --- | --- | --- |
| Build POST /api/setup/backup — create panelify-backup branch via Octokit | 25 min | Branch name: panelify-backup-{YYYY-MM-DD} |
| Build POST /api/setup/generate — convert ContentSchema to JSON string | 15 min | JSON.stringify with 2-space indent. Validate before returning. |
| Build lib/refactor.ts — rewrite JSX to read from content.json using Babel | 55 min | Read the refactor spec doc first. Use Windsurf. Test on Hero.jsx first. |
| Test refactor on single component — verify output is valid JSX and Babel-parseable | 20 min | Run Babel parse on output. Zero syntax errors required. |
| Run all 7 acceptance tests from refactor spec doc | 20 min | All must pass before proceeding to Day 8 |

## **DAY 8 — Commit + Setup UI**

| **Task** | **Time** | **Notes** |
| --- | --- | --- |
| Build POST /api/setup/refactor — run lib/refactor.ts on all components | 20 min | Returns \[{path, new_content}\] |
| Build POST /api/setup/commit — single GitHub commit with all files | 25 min | content.json + all refactored JSX in one commit. Message: panelify: initial setup — N components connected |
| Build Screen 5 — Setup progress with 5 animated steps | 35 min | Same animation pattern as Screen 3 |
| Wire setup API calls to Screen 5 steps | 20 min | backup → generate → refactor → commit |
| Test: run full setup on demo repo — verify site looks identical after commit | 20 min | Critical path — site must not break |

## **DAY 9 — Edge Cases + Error Recovery**

| **Task** | **Time** | **Notes** |
| --- | --- | --- |
| Add restore from backup button on setup failure screen | 20 min | Shows branch name. One click calls GitHub API to reset to backup. |
| Handle setup already run — detect existing content.json and show already configured state | 20 min | Check for content.json before running setup. Redirect to dashboard if found. |
| Add auto-redirect to dashboard after successful setup — 3 second countdown | 15 min | Shows 'Taking you to your panel in 3...' |
| Test full setup flow 5 times on demo repo — fix any remaining issues | 30 min | Zero failures required before moving to Phase 4 |

## **DAY 10 — Dashboard**

| **Task** | **Time** | **Notes** |
| --- | --- | --- |
| Build GET /api/content/read — read content.json from GitHub | 20 min | Returns {content: ContentSchema, sha: string} |
| Build Screen 6 — Dashboard with section list, site URL, platform badge, publish button | 50 min | Pending dot on rows with changes. Publish button shows change count. |
| Add pending changes state — React context shared across screens | 20 min | PendingChanges object. Cleared on publish. Not persisted. |

## **DAY 11 — Section Editor**

| **Task** | **Time** | **Notes** |
| --- | --- | --- |
| Build Screen 7 — split layout: fields left, preview right | 30 min | 340px left panel, remainder right panel |
| Build FieldEditor component — text input, textarea, char counter variants | 25 min | Updates on every keystroke |
| Build ComponentPreview — renders section HTML with live values | 35 min | Simple React render. Updates on keystroke via useEffect. |
| Build Save Section — store to pending changes, return to dashboard | 15 min | Pending dot appears on dashboard row after save |
| Test: type in hero title → preview updates instantly | 10 min | Must update within 100ms — Magic Moment 2 |

## **DAY 12 — Image Upload**

| **Task** | **Time** | **Notes** |
| --- | --- | --- |
| Build POST /api/image/upload — validate, base64 encode, commit to /public/images | 35 min | Max 2MB. JPG, PNG, WebP only. Append timestamp if filename exists. |
| Build ImageUpload component — file picker, thumbnail preview, upload progress | 30 min | Show thumbnail immediately via FileReader before upload completes |
| Wire image upload to section editor | 15 min | On success: update field value, update pending changes |
| Test: upload image → appears in GitHub → preview updates | 20 min | Verify file in /public/images in GitHub |

## **DAY 13 — Full Page Preview**

| **Task** | **Time** | **Notes** |
| --- | --- | --- |
| Build HTML snapshot logic — fetch live site HTML, substitute pending values | 45 min | Fetch Vercel/Netlify URL, string-replace content.json values with pending values |
| Build Screen 8 — browser chrome UI, sandboxed iframe, change summary | 30 min | sandbox attribute on iframe. Changed sections show badge. |
| Wire Review & Publish button on dashboard to Screen 8 | 10 min | Pass pending changes in navigation state |
| Test: edit hero title → preview shows new title on full page | 15 min | Must work on both Vercel and Netlify sites |

## **DAY 14 — Publish Flow — Vercel + Netlify + Deploy Polling**

| **Task** | **Time** | **Notes** |
| --- | --- | --- |
| Build POST /api/content/write — read SHA, merge changes, commit to GitHub | 30 min | Commit message: content: \[sections\] updated via Panelify |
| Build lib/deploy-poll.ts — URL polling, check live site for new content every 3s | 25 min | Max 20 attempts (60s). Returns 'live' or 'timeout'. No extra tokens required. |
| Build Screen 9 — publish progress, 5 steps, deploy polling, success + confetti | 35 min | Magic Moment 3. Retry once silently on failure. Show timeout message if poll times out. |
| Verify Netlify auto-deploys on commit — test with a real Netlify site | 20 min | Multi-platform validation. Must work end to end. |
| Verify Vercel auto-deploys on commit — test with demo repo | 15 min | Both platforms must work before Phase 6 |
| Test complete publish flow on both platforms | 20 min | Critical path — the entire product value in one action |

## **DAY 15 — Landing Page Structure**

| **Task** | **Time** | **Notes** |
| --- | --- | --- |
| Build Screen 0 — Navbar + Hero section | 35 min | Gradient headline, two CTAs, free tier note, platform note (Vercel + Netlify) |
| Build animated terminal component — lines appear one by one on load | 35 min | CSS animation. 9 lines with staggered delays. Cursor blinks at end. |
| Build Stats bar — 4 numbers | 15 min | 30s · 5min · 0 code changes · 100% ownership |
| Test: landing page loads, CTAs route correctly, terminal animates | 15 min | Test Get started → /connect (if logged in) and → /login (if not) |

## **DAY 16 — Landing Page Content + Polish**

| **Task** | **Time** | **Notes** |
| --- | --- | --- |
| Build How it works — 6 steps with connector line and hover animation | 30 min | Steps numbered 1-6. Hover turns number accent purple. |
| Build Features grid — 6 cards with hover reveal | 30 min | Top accent line appears on hover. 3x2 grid. |
| Build bottom CTA section | 15 min | Final conversion push. Match design system. |
| Polish landing page — spacing, transitions, mobile breakpoint at 768px | 30 min | Reference the design system tokens exactly |

## **DAY 17 — Edge Cases + Polish**

| **Task** | **Time** | **Notes** |
| --- | --- | --- |
| Add skeleton loading states to Screens 2 and 6 | 20 min | Skeleton rows while data fetches |
| Add input validation — character limits, required fields, empty publish guard | 20 min | Can't publish zero changes. Can't save empty required fields. |
| Test complete flow on Vercel demo repo — 3 runs | 25 min | Find and fix remaining bugs |
| Test complete flow on Netlify demo repo — 3 runs | 25 min | Both platforms must work cleanly |
| Fix any visual inconsistencies across screens | 20 min | Design tokens consistent everywhere |

## **DAY 18 — Demo Prep + Ship**

| **Task** | **Time** | **Notes** |
| --- | --- | --- |
| Pre-scan demo repo — confirm admin panel looks perfect | 20 min | Do not run setup live on stage. Ever. |
| Practice 90-second demo script 5 times minimum | 45 min | Land → connect → scan → edit → publish → live |
| Set up backup demo repo in case primary fails | 20 min | Second identical repo pre-scanned and ready |
| Deploy final build to Vercel — verify all env vars set in Vercel dashboard | 15 min | GOOGLE_GEMINI_API_KEY and GROQ_API_KEY both set |
| Ship 🚀 | —   | March 10, 2026 |

# **3\. Critical Path**

These tasks cannot slip. Each one blocks everything that follows.

| **Day** | **Task** | **Why It Cannot Slip** |
| --- | --- | --- |
| Day 2 | Platform detection — lib/platform.ts | Everything after depends on knowing Vercel vs Netlify |
| Day 4 | lib/ai.ts with Gemini + Groq fallback | Zero AI = zero product. Fallback = demo safety. |
| Day 5 | lib/scanner.ts — Babel AST parsing | Inaccurate scanner = wrong admin panel fields |
| Day 7 | lib/refactor.ts passes all 7 acceptance tests | Without this nothing deploys |
| Day 8 | JSX refactor + single commit works | Without this nothing deploys |
| Day 11 | Live preview updates on keystroke | Magic Moment 2 — the demo wow moment |
| Day 14 | Publish works on both Vercel and Netlify | The entire product value in one action |
| Day 18 | Demo repo pre-scanned before going on stage | Never run setup live on stage |

# **4\. Cut List — If Behind Schedule**

If you fall behind, cut in this order. Never cut items marked No.

| **Feature** | **Days Saved** | **Safe to Cut?** |
| --- | --- | --- |
| Full page HTML snapshot preview (Screen 8) | 1.5 days | Yes — show change summary list instead |
| Image upload | 1 day | Yes — text editing alone wins the demo |
| Netlify support (keep Vercel only) | 0.5 days | Yes for hackathon — add Netlify in V2 |
| Animated terminal on landing page | 0.5 days | Yes — replace with static screenshot |
| Scan confirmation screen (Screen 4) | 0.5 days | Yes — auto-confirm all fields above 70% |
| Groq fallback in lib/ai.ts | 0.3 days | No — too important for demo reliability |
| lib/ai.ts abstraction | Never cut | No — one hour to build, saves days of pain |
| lib/refactor.ts Babel validation | Never cut | No — prevents site-breaking bugs |

**PANELIFY V1 — BUILD ORDER v1.1 COMPLETE**

_Next: Start building_