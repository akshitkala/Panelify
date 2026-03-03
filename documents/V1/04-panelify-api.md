**PANELIFY**

_API Design Document_

Version 1.1 — AI provider references updated

Deadline: March 10, 2026

# **1\. API Overview**

All API routes are Next.js API routes running as Vercel serverless functions. Every route requires a valid Supabase session token except /api/auth/callback. All routes accept and return JSON. All routes must complete in under 10 seconds to avoid Vercel free plan timeout limits.

| **Principle** | **Detail** |
| --- | --- |
| Authentication | All routes validate Supabase session via Authorization header |
| Timeout limit | Every route must complete under 10 seconds — scan is split into steps |
| Error format | {error: string, code: string} — consistent across all routes |
| Content type | application/json for all requests and responses |
| Base URL | https://panelify.vercel.app/api |

# **2\. Auth Routes**

## **GET /api/auth/callback**

| **Field** | **Detail** |
| --- | --- |
| Purpose | GitHub OAuth callback — exchanges code for Supabase session |
| Auth required | No  |
| Query params | ?code={github_oauth_code}&state={csrf_state} |
| Success response | Redirect to /connect with session cookie set |
| Error response | Redirect to /login?error=auth_failed |
| Notes | CSRF state validated before session creation |

# **3\. Repo Routes**

## **GET /api/repos**

| **Field** | **Detail** |
| --- | --- |
| Purpose | List the user's GitHub repos — shown on Connect Repo screen |
| Auth required | Yes — Supabase session |
| Request | No body — uses session to get GitHub token |
| Success response | 200 — \[{name, full_name, default_branch, vercel_url, is_nextjs}\] |
| Error — no session | 401 — {error: Not authenticated, code: NO_SESSION} |
| Error — GitHub fail | 502 — {error: GitHub API error, code: GITHUB_ERROR} |
| Notes | Filters to show only repos detectable as Next.js (checks for next.config.js) |

# **4\. Platform Routes**

## **POST /api/platform/detect**

| **Field** | **Detail** |
| --- | --- |
| Purpose | Detect hosting platform for a repo — Vercel, Netlify, or unknown |
| Auth required | Yes — Supabase session |
| Request body | {repo_full_name: string, repo_files: string\[\]} |
| Success response | 200 — {platform: 'vercel' \| 'netlify' \| 'unknown'} |
| Logic | Check for vercel.json → 'vercel'. Check for netlify.toml → 'netlify'. Call Vercel API for linked project. Otherwise → 'unknown' |
| Notes | Result is stored in sites.platform on repo connection |

# **5\. Scan Routes**

The scan is split into 3 separate API calls to stay under the 10-second Vercel limit. The browser calls them sequentially and shows progress to the user between each call.

## **POST /api/scan/files**

| **Field** | **Detail** |
| --- | --- |
| Purpose | Fetch all JSX and TSX files from the repo — Step 1 of scan |
| Auth required | Yes |
| Request body | {repo_full_name: string} |
| Success response | 200 — \[{path: string, content: string}\] — decoded file contents |
| Error — not found | 404 — {error: Repo not found, code: REPO_NOT_FOUND} |
| Error — access denied | 403 — {error: No access to repo, code: ACCESS_DENIED} |
| Timeout risk | Low — GitHub API is fast for file listing |

## **POST /api/scan/analyze**

| **Field** | **Detail** |
| --- | --- |
| Purpose | Send JSX files to AI provider (Gemini Flash primary, Groq fallback) and get labeled editable fields — Step 2 |
| Auth required | Yes |
| Request body | {files: \[{path, content}\], repo_full_name: string} |
| Success response | 200 — \[{component, field_id, label, type, current_value, confidence}\] |
| Error — AI fail | 502 — {error: AI analysis failed, code: AI_ERROR} |
| Error — timeout | 504 — {error: Analysis timed out, code: TIMEOUT} — retry logic applies |
| Timeout risk | Medium — mitigated by chunking large repos into batches of 4 files |
| Notes | If repo has more than 8 JSX files, send in batches and merge results. Calls lib/ai.ts — never AI providers directly. |

## **POST /api/scan/prepare**

| **Field** | **Detail** |
| --- | --- |
| Purpose | Build content.json schema from confirmed fields — Step 3 |
| Auth required | Yes |
| Request body | {confirmed_fields: ScannedField\[\], repo_full_name: string} |
| Success response | 200 — {schema: ContentSchema} |
| Error | 400 — {error: No fields confirmed, code: NO_FIELDS} |
| Notes | Pure computation — no external API calls — always fast |

# **6\. Setup Routes**

Setup runs once per site. Five sequential API calls. Each is fast and targeted. The browser shows step-by-step progress.

## **POST /api/setup/backup**

| **Field** | **Detail** |
| --- | --- |
| Purpose | Create a backup branch before any code changes |
| Request body | {repo_full_name: string, default_branch: string} |
| Success response | 200 — {branch_name: string, sha: string} |
| Error | 502 — {error: Branch creation failed, code: BRANCH_ERROR} |
| Notes | Branch name: panelify-backup-{YYYY-MM-DD} |

## **POST /api/setup/generate**

| **Field** | **Detail** |
| --- | --- |
| Purpose | Generate content.json file content from schema |
| Request body | {schema: ContentSchema} |
| Success response | 200 — {content_json: string} — JSON-stringified, pretty-printed |
| Notes | Pure computation — no external calls |

## **POST /api/setup/refactor**

| **Field** | **Detail** |
| --- | --- |
| Purpose | Rewrite JSX components to import from content.json — uses lib/refactor.ts |
| Request body | {files: \[{path, content}\], schema: ContentSchema} |
| Success response | 200 — \[{path: string, new_content: string}\] |
| Error | 422 — {error: Refactoring failed for \[path\], code: REFACTOR_ERROR} |
| Notes | Uses Babel parser (AST) — not regex. Validates output JSX before returning. See lib/refactor.ts spec doc. |

## **POST /api/setup/commit**

| **Field** | **Detail** |
| --- | --- |
| Purpose | Commit content.json + refactored JSX to repo in one commit |
| Request body | {repo_full_name: string, branch: string, files: \[{path, content}\]} |
| Success response | 200 — {commit_sha: string, commit_url: string} |
| Error | 502 — {error: Commit failed, code: COMMIT_ERROR} |
| Notes | Commit message: panelify: initial setup — N components connected |

# **7\. Content Routes**

## **GET /api/content/read**

| **Field** | **Detail** |
| --- | --- |
| Purpose | Read current content.json from repo — used before publish |
| Query params | ?repo_full_name={owner/repo} |
| Success response | 200 — {content: ContentSchema, sha: string} |
| Error — not found | 404 — {error: content.json not found, code: CONTENT_NOT_FOUND} |
| Notes | SHA is required by GitHub API for the subsequent write operation |

## **POST /api/content/write**

| **Field** | **Detail** |
| --- | --- |
| Purpose | Merge pending changes into content.json and commit — publish action |
| Request body | {repo_full_name: string, branch: string, changes: PendingChanges, sha: string} |
| Success response | 200 — {commit_sha: string, commit_url: string} |
| Error — conflict | 409 — {error: SHA mismatch, code: SHA_CONFLICT} — re-read and retry |
| Error — commit fail | 502 — {error: Commit failed, code: COMMIT_ERROR} |
| Notes | Commit message: content: {section_names} updated via Panelify |

# **8\. Image Route**

## **POST /api/image/upload**

| **Field** | **Detail** |
| --- | --- |
| Purpose | Upload image to /public/images in repo |
| Request body | FormData — {file: File, repo_full_name: string, filename: string} |
| Validation | Max 2MB. Accepted types: image/jpeg, image/png, image/webp |
| Success response | 200 — {path: string, commit_sha: string} — path is /images/{filename} |
| Error — too large | 413 — {error: File too large, code: FILE_TOO_LARGE} |
| Error — bad type | 415 — {error: Unsupported file type, code: BAD_TYPE} |
| Notes | If filename already exists, appends timestamp to avoid collision |

# **9\. Error Code Reference**

| **Code** | **HTTP Status** | **Meaning** | **Recovery** |
| --- | --- | --- | --- |
| NO_SESSION | 401 | No valid auth session | Redirect to /login |
| ACCESS_DENIED | 403 | No GitHub access to repo | Re-authenticate |
| REPO_NOT_FOUND | 404 | Repo does not exist | User picks different repo |
| CONTENT_NOT_FOUND | 404 | content.json missing | Re-run setup |
| NO_FIELDS | 400 | Zero fields confirmed | User confirms at least one field |
| REFACTOR_ERROR | 422 | JSX transform failed | Restore backup branch |
| SHA_CONFLICT | 409 | content.json changed since last read | Re-read and retry write |
| FILE_TOO_LARGE | 413 | Image over 2MB | User compresses image |
| BAD_TYPE | 415 | Non-image file uploaded | User selects correct file |
| AI_ERROR | 502 | AI provider failed (Gemini + Groq both failed) | Retry scan |
| GITHUB_ERROR | 502 | GitHub API failed | Retry after brief wait |
| TIMEOUT | 504 | Operation exceeded 10 seconds | Retry — usually transient |
| COMMIT_ERROR | 502 | GitHub commit rejected | Check token permissions |
| BRANCH_ERROR | 502 | Branch creation failed | Check repo permissions |
| SCAN_ERROR | 502 | Full scan failed after all retries | Show retry UI to owner |

**PANELIFY V1 — API DESIGN v1.1 COMPLETE**

_Next Document: Build Order Document_