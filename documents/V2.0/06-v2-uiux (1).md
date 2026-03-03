**Panelify V2**

_UI/UX Design Specification_

Version 2.0 — Draft

February 2026

# **1\. Overview**

This document defines the complete UI/UX redesign for Panelify V2. V1 feedback identified three core problems: the interface is too dark and flat, interactive elements are not obvious, and the editing experience lacks live visual feedback. V2 addresses all three with a refined design system, clearer affordances, and a live preview editor.

## **1.1 V1 UI Problems Summary**

| **Problem** | **User Impact** | **Severity** |
| --- | --- | --- |
| Too dark — low contrast throughout | Hard to read text and find options | **HIGH** |
| Flat design — no visual hierarchy | All elements look equally important | **HIGH** |
| Interactive elements not obvious | Users unsure what is clickable | **HIGH** |
| No live preview in editor | Cannot see changes before publishing | **CRITICAL** |
| Home page shows Sign In when logged in | Confusing returning user experience | **MEDIUM** |
| Sign out only from dashboard | Users feel trapped in the app | **MEDIUM** |
| Empty states — blank screens | No guidance when nothing is loaded | **MEDIUM** |
| Loading states — spinner only | No content preview while loading | **LOW** |
| Error states show raw JSON | Technical and frightening for non-devs | **HIGH** |
| Section cards all look identical | No visual differentiation by type | **LOW** |

# **2\. Design System V2**

## **2.1 Color Palette**

V1 uses a single dark background with minimal contrast variation. V2 introduces a layered surface system with clear hierarchy and a purple accent that communicates the premium nature of the product.

| **Token** | **Hex Value** | **Usage** | **V1 Change** |
| --- | --- | --- | --- |
| \--bg-base | #0A0F1A | Page background | Same as V1 |
| \--bg-surface | #111827 | Cards, panels | Slightly lighter than V1 |
| \--bg-elevated | #1A2236 | Hover states, dropdowns | NEW — was missing in V1 |
| \--bg-input | #1E293B | Form inputs, text areas | NEW — distinct from surface |
| \--border-subtle | #1F2D40 | Dividers, card borders | Lighter than V1 |
| \--border-default | #2D3F55 | Input borders, table borders | NEW — more visible |
| \--border-focus | #6B4FBB | Focused inputs | NEW — purple focus ring |
| \--text-primary | #F1F5F9 | Headings, important text | Brighter than V1 |
| \--text-secondary | #94A3B8 | Body text, descriptions | Higher contrast than V1 |
| \--text-muted | #64748B | Placeholders, timestamps | Same as V1 |
| \--accent-purple | #6B4FBB | Primary CTAs, active states | Same as V1 |
| \--accent-purple-hover | #7C62C9 | Button hover state | **NEW** |
| \--accent-purple-light | #6B4FBB1A | Subtle highlights, badges | **NEW** |
| \--accent-green | #16A34A | Success states, live badges | Same as V1 |
| \--accent-red | #DC2626 | Error states, destructive actions | Same as V1 |
| \--accent-amber | #D97706 | Warning states, pending badges | Same as V1 |

## **2.2 Typography**

| **Style** | **Font** | **Size** | **Weight** | **Color** | **Usage** |
| --- | --- | --- | --- | --- | --- |
| Display XL | Inter | 48px | 800 | \--text-primary | Landing page hero |
| Display L | Inter | 36px | 700 | \--text-primary | Page titles |
| Heading 1 | Inter | 28px | 700 | \--text-primary | Section headings |
| Heading 2 | Inter | 22px | 600 | \--text-primary | Card titles, subheadings |
| Heading 3 | Inter | 16px | 600 | \--text-secondary | Labels, column headers |
| Body | Inter | 15px | 400 | \--text-secondary | Descriptions, paragraphs |
| Body Small | Inter | 13px | 400 | \--text-muted | Timestamps, metadata |
| Mono | JetBrains Mono | 13px | 400 | \--text-secondary | Code, paths, field IDs |
| Badge | Inter | 11px | 600 | varies | Status badges, tags |

## **2.3 Spacing Scale**

| **Token** | **Value** | **Usage** |
| --- | --- | --- |
| \--space-1 | 4px | Icon padding, tight gaps |
| \--space-2 | 8px | Badge padding, compact items |
| \--space-3 | 12px | Input padding, list items |
| \--space-4 | 16px | Card padding (small), button padding |
| \--space-6 | 24px | Card padding (default), section gaps |
| \--space-8 | 32px | Panel padding, large gaps |
| \--space-12 | 48px | Page padding, major sections |
| \--space-16 | 64px | Screen-level breathing room |

## **2.4 Border Radius**

| **Token** | **Value** | **Usage** |
| --- | --- | --- |
| \--radius-sm | 6px | Badges, tags, small elements |
| \--radius-md | 10px | Buttons, inputs, small cards |
| \--radius-lg | 14px | Main cards, panels, modals |
| \--radius-xl | 20px | Feature cards, hero sections |
| \--radius-full | 9999px | Pills, avatars, progress bars |

## **2.5 Component Library Updates**

**Buttons**

| **Variant** | **Background** | **Text** | **Border** | **Hover** | **Usage** |
| --- | --- | --- | --- | --- | --- |
| Primary | \--accent-purple | White | None | darken 8% | Main CTAs — Publish, Get Started |
| Secondary | \--bg-elevated | \--text-primary | \--border-default | lighten 5% | Secondary actions |
| Ghost | Transparent | \--text-secondary | None | \--bg-elevated | Nav actions, close buttons |
| Danger | #DC2626 | White | None | darken 8% | Destructive — disconnect, delete |
| Disabled | \--bg-surface | \--text-muted | \--border-subtle | No hover | Inactive state — no changes |

**Cards**

| **State** | **Background** | **Border** | **Shadow** | **Transition** |
| --- | --- | --- | --- | --- |
| Default | \--bg-surface | \--border-subtle 1px | none | none |
| Hover | \--bg-elevated | \--border-default 1px | 0 4px 20px rgba(0,0,0,0.3) | 150ms ease |
| Active/Selected | \--bg-elevated | \--accent-purple 1px | 0 0 0 2px --accent-purple-light | 100ms ease |
| Pending | \--bg-surface | \--accent-amber 1px | none | none |
| Error | \--bg-surface | \--accent-red 1px | none | none |

**Form Inputs**

| **State** | **Background** | **Border** | **Behavior** |
| --- | --- | --- | --- |
| Default | \--bg-input | \--border-default 1px | None |
| Focus | \--bg-input | \--border-focus 2px (purple) | Subtle glow: 0 0 0 3px --accent-purple-light |
| Error | \--bg-input | \--accent-red 1px | Error message below in --accent-red |
| Disabled | \--bg-surface | \--border-subtle 1px | Cursor not-allowed, opacity 0.5 |
| Success | \--bg-input | \--accent-green 1px | Checkmark icon on right |

# **3\. Screen-by-Screen Redesign**

## **Screen 0 — Landing Page**

**V1 Issues**

- Sign In shown even when logged in
- Terminal animation is the only interactive element
- CTA hierarchy unclear — two buttons look equally important

**V2 Changes**

| **Element** | **V1** | **V2** |
| --- | --- | --- |
| Auth state | Always shows Sign In | Session check: shows Go to Dashboard if logged in |
| Hero CTA | Get Started + Sign In equal size | Get Started primary (purple), Sign In ghost |
| Social proof | None | Add: "Works with 50,000+ Next.js repos" |
| Feature cards | Flat dark cards | Cards with icon, hover lift, border-left accent |
| Terminal | Static dark box | Glowing border, typing cursor, line highlight on active |
| Nav | Logo + Sign In only | Logo + Sign In OR Dashboard button (session-aware) |
| Background | Flat #0A0F1A | Subtle gradient: top-left purple glow, bottom-right blue glow |

## **Screen 1 — Login**

**V1 Issues**

- Minimal — just a GitHub button on dark background
- No context for why GitHub OAuth is needed

**V2 Changes**

| **Element** | **V1** | **V2** |
| --- | --- | --- |
| Layout | Centered button only | Split: left brand panel, right auth panel |
| Brand panel | None | Logo, tagline, 3 feature bullet points with icons |
| GitHub button | Basic dark button | GitHub logo, clear label, hover state with subtle lift |
| Privacy note | None | Small text: "We only request repo access. No data stored beyond your session." |
| Back link | None | Back to home link at top left |

## **Screen 2 — Connect Repo**

**V1 Issues**

- Repo list looks like a plain list — no visual differentiation
- Platform badge appears after connection — should show during selection
- No search or filter for users with many repos

**V2 Changes**

| **Element** | **V1** | **V2** |
| --- | --- | --- |
| Repo cards | Flat list items | Cards with repo icon, name, description, star count |
| Platform badge | Shown after connect | Detected and shown on hover during selection |
| Search | None | Search input at top to filter repos by name |
| Empty state | Nothing | "No Next.js repos found. Make sure your repo has next.config.js" |
| Loading state | Spinner | Skeleton cards — 5 placeholder cards while loading |
| Selected state | Highlight only | Card gets purple border + checkmark icon |
| Branch indicator | None | Small badge showing default branch: main or master |

## **Screen 3 — Scanning**

**V1 Issues**

- Progress is a single bar with generic text
- User has no sense of what is being scanned
- No indication of how many files are being processed

**V2 Changes**

| **Element** | **V1** | **V2** |
| --- | --- | --- |
| Layout | Centered progress bar | Two-column: file list left, AI analysis right |
| File list | None | Animated list of files being scanned — each gets a checkmark when done |
| AI indicator | None | Pulsing "AI Analyzing" badge with Gemini logo |
| Progress | Single bar | Step indicators: 1 Fetch Files → 2 AI Scan → 3 Prepare Schema |
| File count | None | Live counter: "Scanning file 8 of 23" |
| Time estimate | None | Approximate time remaining based on file count |
| Empty result | Silent failure | Friendly message with guidance if zero fields found |

## **Screen 4 — Confirm Fields**

**V1 Issues**

- All fields look identical regardless of type
- Toggle state not clearly visible — checkbox hard to see
- No way to understand what section each field belongs to

**V2 Changes**

| **Element** | **V1** | **V2** |
| --- | --- | --- |
| Field grouping | Flat list | Grouped by component with collapsible sections |
| Field type icons | None | Text icon, textarea icon, image icon on each field |
| Toggle | Subtle checkbox | Large toggle switch, clearly on/off |
| Current value | Plain text | Truncated with "..." and tooltip on hover for full value |
| Confidence | Highlighted if low | Yellow warning badge: "Low confidence — review before confirming" |
| Select all | None | Select All / Deselect All buttons per section |
| Field count | Button label only | Running total in header: "12 of 17 fields selected" |

## **Screen 5 — Setup**

**V1 Issues**

- Steps complete too fast — animation feels fake
- No way to know what is actually happening in GitHub
- Error state shows raw JSON

**V2 Changes**

| **Element** | **V1** | **V2** |
| --- | --- | --- |
| Step indicators | Simple checklist | Animated progress with icons per step |
| GitHub links | None | Each step shows a link when complete: "View backup branch →" |
| Error state | Raw JSON error | Friendly error card: icon, human message, retry button, support link |
| Success state | None | Confetti animation + "Your panel is ready!" message |
| Time estimate | None | "This usually takes about 30 seconds" |
| Step detail | Step name only | Sub-text per step: "Creating panelify-backup-2026-02-24 in GitHub" |

## **Screen 6 — Dashboard**

**V1 Issues**

- Section cards look identical — no visual hierarchy
- Publish button disabled state not obvious enough
- No indication of last published time
- Platform badge easy to miss

**V2 Changes**

| **Element** | **V1** | **V2** |
| --- | --- | --- |
| Header | Site URL only | Site name, URL, platform badge, last published time |
| Section cards | Flat list | Cards with section icon, field count, pending indicator |
| Pending dot | Small dot | Amber pill badge: "2 changes pending" |
| Publish button | Disabled when no changes | Disabled + tooltip: "Edit a section to enable publishing" |
| Publish button active | Just enabled | Purple + pulse animation + change count |
| Empty sections | Nothing | "No sections found. Try rescanning your repo." |
| Add site button | None (V1 limit) | Prominent "+ Connect New Site" card at end of list |
| Section icons | None | Auto-assigned icons: hero → star, about → user, nav → menu |
| Global header | None | Persistent header with logo, site switcher, sign out |

## **Screen 7 — Section Editor**

**V1 Issues**

- Preview is a fake card — not the real site
- No indication that preview is not live
- Field labels not descriptive enough
- Image fields show just a URL input — no visual preview

**V2 Changes**

| **Element** | **V1** | **V2** |
| --- | --- | --- |
| Layout | Fields left, fake preview right | Fields right (40%), live site iframe left (60%) |
| Preview | Fake preview card | Real iframe of live site — updates via postMessage |
| Preview label | LIVE PREVIEW badge | "Preview only — publish to make changes permanent" |
| Iframe fallback | None | Warning banner + simulated preview if iframe blocked |
| Field inputs | Generic inputs | Labeled inputs with field type icon and character count |
| Image fields | URL input only | Image thumbnail preview + upload button + URL input |
| Auto-save | None | Debounced preview update 300ms after typing stops |
| Reset button | Discard (navigates away) | Reset preview (stays on page) + separate Discard button |
| Save feedback | Navigate to dashboard | Toast notification: "Changes saved — ready to publish" |
| Unsaved warning | None | Dialog: "You have unsaved changes. Discard them?" on navigate |

## **Screen 8 — Full Page Preview**

**V1 Issues**

- Iframe loads the live site but changes are not reflected yet
- No clear indication of which sections have pending changes

**V2 Changes**

| **Element** | **V1** | **V2** |
| --- | --- | --- |
| Layout | Full iframe only | Iframe + right sidebar showing pending changes |
| Change indicators | None | Floating badges on iframe over changed sections |
| Sidebar | None | List of pending changes with section name and field count |
| Iframe state | Shows current live site | Shows live site with postMessage preview of changes |
| Publish button | Bottom of screen | Sticky sidebar footer — always visible |

## **Screen 9 — Publishing**

**V1 Issues**

- Steps animate but feel disconnected from real actions
- No link to the live site after publish
- No way to know if deploy is still in progress or complete

**V2 Changes**

| **Element** | **V1** | **V2** |
| --- | --- | --- |
| Step indicators | Checklist animation | Animated with real GitHub links per step |
| Deploy status | Polling shown as step | Live status: "Waiting for Vercel..." with elapsed time |
| Success state | Generic success | Confetti + "Your site is live!" + direct link to changed page |
| Commit link | None | "View commit on GitHub →" after commit step |
| Failed state | Error JSON | Friendly error + "Retry" button + "View in GitHub" fallback |
| Done action | Back to dashboard | "View Live Site" primary CTA + "Back to Dashboard" secondary |

# **4\. New Screens — V2 Only**

## **Screen 10 — Team Management**

New screen for managing team members and their roles.

| **Element** | **Description** |
| --- | --- |
| Header | Team name, member count, "Invite Member" button |
| Member list | Avatar, name/email, role badge, joined date, remove button |
| Invite form | Email input + role selector (Admin/Editor) + Send Invite button |
| Pending invites | Separate section showing unaccepted invites with resend option |
| Role descriptions | Tooltip on role badge explaining Admin vs Editor permissions |
| Empty state | "Your team is just you. Invite collaborators to edit together." |

## **Screen 11 — Version History**

New screen showing published versions with restore capability.

| **Element** | **Description** |
| --- | --- |
| Version list | Date, time, published by, sections changed, commit link |
| Current version | Top of list, highlighted green — "Current Live Version" |
| Version detail | Expandable: shows diff of what changed vs previous version |
| Restore button | On each version: "Restore this version" with confirmation dialog |
| Commit link | "View on GitHub →" for each version |
| Empty state | "No publish history yet. Publish your first change to see versions here." |

# **5\. Interaction Design**

## **5.1 Loading States**

Every data-fetching operation must have a defined loading state. Spinners only on small elements. Skeletons for content areas.

| **Screen** | **Loading Element** | **Skeleton Description** |
| --- | --- | --- |
| Connect Repo | Repo list | 5 placeholder cards with shimmer animation |
| Dashboard | Section cards | Grey placeholder cards matching real card height |
| Editor | Field inputs | Input skeletons while content.json loads |
| Version History | Version list | Placeholder rows with date and action areas |
| Team page | Member list | Avatar + name placeholder rows |

## **5.2 Empty States**

| **Screen** | **Trigger** | **Message** | **CTA** |
| --- | --- | --- | --- |
| Dashboard | No sites connected | "Connect your first Next.js repo to get started" | Connect Repo → |
| Confirm | Zero fields found | "No editable content found. Your components may use dynamic data." | Rescan or Learn Why |
| Version History | Never published | "Publish your first change to start tracking versions" | Go to Dashboard |
| Team | Solo user | "Invite team members to collaborate on your site" | Invite Someone |
| Connect | No Next.js repos | "No Next.js repos found in your account" | Create a Repo |

## **5.3 Error States**

All error messages must be human-readable. Never show raw JSON or stack traces to users.

| **Error Code** | **User-Facing Message** | **Action Available** |
| --- | --- | --- |
| NO_TOKEN | "Please sign out and sign back in to reconnect GitHub" | Sign Out button |
| BRANCH_ERROR | "Could not create a backup branch. Check your repo permissions." | Retry + Support link |
| AI_ERROR | "Content analysis failed. We tried Gemini and Groq — please try again." | Retry button |
| SHA_CONFLICT | "Someone else published while you were editing. Refresh to get latest." | Refresh button |
| FILE_TOO_LARGE | "Image is too large. Please use an image under 2MB." | Choose different file |
| BAD_TYPE | "Only JPG, PNG, and WebP images are supported." | Choose different file |
| SCAN_ERROR | "Could not read files from your repo. Check your GitHub connection." | Reconnect GitHub |
| NETWORK_ERROR | "Connection lost. Check your internet and try again." | Retry button |

## **5.4 Micro-Animations**

| **Element** | **Animation** | **Duration** | **Trigger** |
| --- | --- | --- | --- |
| Card hover | translateY(-2px) + shadow increase | 150ms ease | Mouse enter |
| Button press | scale(0.97) | 100ms ease | Mouse down |
| Page transition | fadeIn + slideUp 8px | 200ms ease | Route change |
| Toast notification | slideIn from bottom-right | 250ms ease | Action complete |
| Pending badge | pulse glow | 2s infinite | Has pending changes |
| Publish button active | subtle pulse | 1.5s infinite | Changes pending |
| Setup steps | checkmark draw + fade | 400ms ease | Step complete |
| Scan file list | fadeIn staggered | 100ms per item | Files loaded |
| Skeleton shimmer | gradient sweep left to right | 1.5s infinite | Loading state |
| iframe preview update | brief flash border purple | 300ms ease | postMessage received |

## **5.5 Responsive Design**

| **Breakpoint** | **Width** | **Layout Changes** |
| --- | --- | --- |
| Mobile | < 640px | Single column, bottom sheet for editor, simplified dashboard |
| Tablet | 640px - 1024px | Condensed sidebar, stacked editor panels |
| Desktop | 1024px - 1440px | Full split-screen editor, expanded dashboard |
| Wide | \> 1440px | Max-width container 1400px, centered |

Note: V2 demo targets desktop only. Mobile and tablet layouts are defined here for completeness but are not required for launch.

# **6\. Before / After Summary**

High-level comparison of the most impactful visual changes between V1 and V2.

| **Area** | **V1** | **V2** | **Impact** |
| --- | --- | --- | --- |
| Surface colors | 1 dark level | 4 distinct levels | Readable hierarchy |
| Interactive affordance | Color change only | Lift + shadow + border | Users know what to click |
| Preview editor | Fake card | Real iframe | Core product value visible |
| Empty states | Blank screen | Illustration + CTA | Users know what to do |
| Error messages | Raw JSON | Human message + action | Non-devs can recover |
| Loading states | Spinner only | Skeleton screens | Feels faster, less jarring |
| Section cards | Flat identical | Icons + badges + hover | Scannable at a glance |
| Auth flow | Always shows Sign In | Session-aware | Returning users feel at home |
| Setup feedback | Progress bar | Step links to GitHub | Trust and transparency |
| Publish success | Generic done | Confetti + live link | Satisfying reward moment |

# **7\. Implementation Notes**

## **7.1 Tailwind Configuration**

Add these custom tokens to tailwind.config.ts to support the V2 design system:

_theme: {_

_extend: {_

_colors: {_

_bg: {_

_base: "#0A0F1A",_

_surface: "#111827",_

_elevated: "#1A2236",_

_input: "#1E293B",_

_},_

_border: {_

_subtle: "#1F2D40",_

_default: "#2D3F55",_

_focus: "#6B4FBB",_

_},_

_accent: {_

_purple: "#6B4FBB",_

_purpleHover: "#7C62C9",_

_purpleLight: "#6B4FBB1A",_

_}_

_},_

_animation: {_

_shimmer: "shimmer 1.5s infinite",_

_pulse-glow: "pulse-glow 2s infinite",_

_}_

_}_

_}_

## **7.2 Component Priority**

Build these UI components first as they are used across multiple screens:

1.  components/Header.tsx — persistent auth header with sign out
2.  components/SkeletonCard.tsx — reusable loading skeleton
3.  components/EmptyState.tsx — icon, message, CTA
4.  components/ErrorCard.tsx — human error message with retry
5.  components/PlatformBadge.tsx — Vercel/Netlify/Railway badge
6.  components/PendingBadge.tsx — amber pending changes indicator
7.  components/Toast.tsx — slide-in notification
8.  components/ConfirmDialog.tsx — unsaved changes warning

## **7.3 iframe Preview Implementation**

The live preview iframe is the most technically sensitive V2 UI change. Key considerations:

- Use sandbox="allow-scripts allow-same-origin" — minimum required permissions
- Listen for iframe onerror to detect blocked sites — show fallback immediately
- postMessage only after PANELIFY_READY received from iframe — never before
- Debounce onChange handler 300ms to avoid flooding iframe with messages
- Store original field values on load to enable Reset functionality
- iframe src must use the vercel_url from sites table — not a relative path