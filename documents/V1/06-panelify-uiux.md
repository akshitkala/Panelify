**PANELIFY**

_UI/UX Flow Document_

Version 1.1 — Screen 0 Landing Page Added

Deadline: March 10, 2026

# **Changelog v1.0 → v1.1**

| **Change** | **Detail** |
| --- | --- |
| Screen 0 added | Full landing page spec added — sections, elements, states, navigation |
| Screen count updated | 9 → 10 screens total |
| Screen map updated | Landing page now entry point of the entire flow |
| Design system unchanged | All tokens from v1.0 apply to Screen 0 identically |

# **1\. Design System**

All 10 screens share the same design tokens. No screen introduces new tokens.

| **Token** | **Value** | **Usage** |
| --- | --- | --- |
| \--bg | #0a0a0f | Page background |
| \--surface | #111118 | Cards and panels |
| \--surface2 | #18181f | Elevated surfaces, modals |
| \--border | #2a2a35 | All borders and dividers |
| \--accent | #7c6aff | Primary CTA buttons, active states |
| \--accent-green | #4ade80 | Success states, live indicators |
| \--accent-red | #ff6a6a | Error states, warnings |
| \--text | #e8e8f0 | Primary text |
| \--muted | #7070a0 | Secondary text, labels, placeholders |
| \--font-display | Syne | Headings and brand text |
| \--font-body | DM Sans | All body text and UI labels |
| \--font-mono | DM Mono | Code, routes, technical values |
| \--radius | 8px | All border radius |

# **2\. Screen Map — 10 Screens**

ONBOARDING PHASE (happens once per user)

Screen 0 → Landing Page / (public)

Screen 1 → Login /login

Screen 2 → Connect Repo /connect

Screen 3 → Scanning /scanning

Screen 4 → Scan Confirmation /confirm

Screen 5 → Setup Progress /setup

RECURRING PHASE (every edit session)

Screen 6 → Admin Dashboard /dashboard

Screen 7 → Section Editor /edit/\[section\]

Screen 8 → Full Page Preview /preview

Screen 9 → Publish Progress /publishing

# **3\. Screen 0 — Landing Page**

## **Route: / (public, no auth required)**

The public marketing page. Two audiences simultaneously: hackathon judges who need to understand the product in 10 seconds, and real users who need a reason to sign up. No authentication required. Fully static — no server-side data fetching.

### **Sections — in order top to bottom**

| **Section** | **Content** | **Purpose** |
| --- | --- | --- |
| Navbar | Logo left, nav links center, Sign in + Get started right | Navigation and primary CTA always visible |
| Hero | Headline, subtext, two CTAs, free tier note with live dot | Value proposition understood in under 10 seconds |
| Animated terminal | Live scan output — shows AI reading components, finding fields, committing | Proves the product works without a demo |
| Stats bar | 30s deploy · 5min setup · 0 code changes · 100% data ownership | Four numbers that tell the whole story |
| How it works | 6-step numbered flow with animated connector line between steps | Makes the process clear and simple |
| Features grid | 6 cards — AI scan, live preview, GitHub native, 30s deploys, backup branch, zero config | Addresses the six most common objections |
| Bottom CTA | Final headline, subtext, Get started + See editor buttons | Converts undecided visitors |

### **Wireframe — Navbar + Hero**

┌────────────────────────────────────────────────────────────────┐

│ ◈ Panelify Features How it works Pricing Docs │

│ \[Sign in\] \[Get started\] │

├────────────────────────────────────────────────────────────────┤

│ │

│ ┌─────────────────────────────────────────┐ │

│ │ Now in beta — Vercel + Netlify ● │ │

│ └─────────────────────────────────────────┘ │

│ │

│ Give your clients │

│ a superpower. │

│ No developer needed. ████████████ │

│ │

│ Your subtitle text here — one line, max 120 chars │

│ │

│ \[ Connect your repo \] \[ See demo \] │

│ ● Free forever · No credit card · 5min setup │

│ │

└────────────────────────────────────────────────────────────────┘

### **Elements**

| **Element** | **Type** | **Behaviour / Notes** |
| --- | --- | --- |
| Navbar logo | SVG + wordmark | Syne font. Clicking scrolls to top. |
| Nav links | Anchor links | Features, How it works, Pricing, Docs. Smooth scroll to sections. |
| Sign in button | Ghost button | Routes to /login |
| Get started button (nav) | Primary button | Routes to /login — same as hero CTA |
| Beta eyebrow badge | Pill badge | Accent color. 'Now in beta — Vercel + Netlify'. Live blinking dot left. |
| Hero headline | H1 — Syne 68px | Three lines. Last line has gradient fill: 'No developer needed.' |
| Hero subtext | Paragraph | One sentence. Max 120 chars. Muted color. DM Sans 300 weight. |
| Connect your repo CTA | Primary button large | Routes to /connect if session exists, otherwise /login |
| See demo button | Ghost button large | Routes to /login — shows login then flows through demo |
| Free tier note | Small text row | Green live dot + Free forever · No credit card · 5min setup |
| Animated terminal | CSS animation | Fake terminal showing scan output. Lines appear one by one on load. Cursor blinks at end. |
| Stats bar | 4-cell table | 30s deploy / 5min setup / 0 code changes / 100% data ownership. Accent color numbers. |
| How it works steps | 6-column flex row | Numbered circles 1-6. Connector line between them. Hover turns number accent color. |
| Features grid | 3x2 card grid | Each card: icon, title, description. Top accent line reveals on hover. |
| Bottom CTA headline | H2 — Syne | Ready to give your clients a superpower? |
| Bottom CTA subtext | Paragraph | Connect your first Next.js site in under 5 minutes. Free forever. |
| Get started free (bottom) | Primary button large | Routes to /login |
| See the editor (bottom) | Ghost button large | Routes to /edit/hero — shows editor screen directly for curious visitors (auth redirect applies) |

### **Animated Terminal — Line Sequence**

| **Line #** | **Content** | **Color** | **Delay** |
| --- | --- | --- | --- |
| 1   | $ panelify scan devuser/my-agency-site | White | 0ms |
| 2   | ✓ Connected to GitHub — access confirmed | Green | 400ms |
| 3   | ✓ Detected Vercel project automatically | Green | 800ms |
| 4   | ● Reading 12 JSX components... | Accent purple | 1200ms |
| 5   | ✓ Hero.jsx — 4 editable fields found | Green | 1800ms |
| 6   | ✓ About.jsx — 3 editable fields found | Green | 2100ms |
| 7   | ⚠ Navbar.jsx — flagged for review | Amber | 2400ms |
| 8   | ✓ content.json created — 17 fields mapped | Green | 3000ms |
| 9   | ✓ Committed to GitHub — a3f9c2b ▌ | Green + cursor | 3600ms |

### **States**

| **State** | **What the User Sees** |
| --- | --- |
| Default load | Page renders instantly. Terminal animation begins automatically. |
| Terminal complete | Cursor blinks at end of last line. Animation does not loop. |
| Logged in visitor | Get started button routes to /connect directly — skips login. |
| Mobile (768px) | Hero stacks vertically. Terminal scrolls horizontally. Grid becomes 1 column. |

### **Navigation from Screen 0**

| **Action** | **Destination** | **Condition** |
| --- | --- | --- |
| Click Get started / Connect your repo | /connect | User already has GitHub session |
| Click Get started / Connect your repo | /login | No session — GitHub OAuth first |
| Click Sign in | /login | Always |
| Click See demo | /login | Always — flows through demo after login |
| Click See the editor (bottom) | /edit/hero | Redirects to /login first if no session |

# **4\. Screens 1–9**

Screens 1 through 9 are fully specified in UI/UX Flow v1.0. All specs remain unchanged. The only update is that Screen 0 now precedes Screen 1 in the complete flow, and the scanning screen (Screen 3) now correctly references Gemini Flash with Groq fallback rather than Claude.

| **#** | **Screen** | **Route** | **Key Outcome** |
| --- | --- | --- | --- |
| 1   | Login | /login | GitHub OAuth — session created |
| 2   | Connect Repo | /connect | Repo selected — Vercel or Netlify detected — platform stored |
| 3   | Scanning | /scanning | AI scans repo — Gemini Flash primary, Groq fallback |
| 4   | Scan Confirmation | /confirm | Owner reviews and approves detected fields |
| 5   | Setup Progress | /setup | content.json created, JSX refactored, initial commit pushed |
| 6   | Admin Dashboard | /dashboard | All editable sections listed with pending change indicators |
| 7   | Section Editor | /edit/\[section\] | Text + image editing with live component preview |
| 8   | Full Page Preview | /preview | Complete site snapshot with all pending changes applied |
| 9   | Publish Progress | /publishing | Commit, deploy poll, live — Magic Moment 3 |

# **5\. Complete Navigation Map**

Screen 0 Landing Page (entry point for new visitors)

│

├── Get started ─────────────────────► Screen 1 Login

│ │

│ ▼

│ Screen 2 Connect Repo

│ │

│ ▼ (first time)

│ Screen 3 Scanning

│ │

│ ▼

│ Screen 4 Scan Confirmation

│ │

│ ▼

│ Screen 5 Setup Progress

│ │

│ ┌───────────────────────────────────────┘

│ │ (returning user skips straight here)

│ ▼

│ Screen 6 Admin Dashboard ◄────────────────────────────┐

│ │ │

│ ├── Edit section ──► Screen 7 Section Editor ──────┤ (Save)

│ │ │

│ └── Review & Publish ► Screen 8 Full Page Preview │

│ │ │

│ └──► Screen 9 Publish Progress

│ │

│ Published! └──► Back to Dashboard

│

└── See the editor ───────────────────────────► Screen 7 (auth redirect)

**PANELIFY V1 — UI/UX FLOW v1.1 COMPLETE**

_Next: Technical Architecture_