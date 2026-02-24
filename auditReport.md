# Panelify Codebase Audit Report

This document provides a comprehensive mapping of the Panelify codebase as of February 24, 2026.

## 🛠️ Codebase Mapping

### API Routes (`app/api/`)

| File | Purpose | Status | Uses `provider_token` | Returns JSON Always | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `auth/callback/route.ts` | Handles GitHub OAuth callback & token storage. | **Real** | Yes (Initial) | No (Redirects) | Now persists token to `user_tokens`. |
| `content/read/route.ts` | Reads file content from GitHub via Octokit. | **Real** | Yes (Resilient) | Yes | Uses `getGitHubToken` utility. |
| `content/write/route.ts` | Mock endpoint for content writing. | **Mock** | Yes (Defensive) | Yes | Currently a placeholder returning success. |
| `debug-token/route.ts` | Verifies token scopes and branch creation. | **Real** | Yes (Resilient) | Yes | Diagnostic tool for auth issues. |
| `image/upload/route.ts` | Uploads binary image data to GitHub. | **Real** | Yes (Resilient) | Yes | Handles Base64 conversion. |
| `platform/detect/route.ts` | Detects hosting (Vercel/Netlify) via heuristics. | **Real** | Yes (Session) | Yes | Still uses direct session access; needs refactor. |
| `repos/route.ts` | Fetches user's repository list with metadata. | **Real** | Yes (Resilient) | Yes | Returns `default_branch` for each repo. |
| `scan/analyze/route.ts` | AI-powered extraction of editable JSX fields. | **Real** | Yes (Defensive) | Yes | Uses `lib/ai.ts` (Gemini Flash). |
| `scan/files/route.ts` | Crawls repo to find editable project files. | **Real** | Yes (Resilient) | Yes | Recursive directory traversal logic. |
| `scan/prepare/route.ts` | Transforms confirmation data into a flat schema. | **Real** | No | Yes | Pure data transformation. |
| `setup/backup/route.ts` | Creates a timestamped branch in the repo. | **Real** | Yes (Resilient) | Yes | Dynamic `main`/`master` detection. |
| `setup/commit/route.ts` | Orchestrates multi-file commits to GitHub. | **Real** | Yes (Resilient) | Yes | Complex Tree/Commit/Ref flow. |
| `setup/generate/route.ts` | Converts schema into stringified `content.json`. | **Real** | Yes (Defensive) | Yes | Final JSON validation step. |
| `setup/refactor/route.ts` | Rewrites user components using Babel AST. | **Real** | Yes (Defensive) | Yes | Critical path for "Panelification". |
| `test-branch/route.ts` | Minimal diagnostic for branch creation. | **Real** | Yes (Session) | Yes | Used to isolate Octokit 404s. |

### Library Utilities (`lib/`)

| File | Purpose | Status | Uses `provider_token` | Notes |
| :--- | :--- | :--- | :--- | :--- |
| `ai.ts` | Integration with Google Gemini / Groq. | **Real** | No | Handles fallbacks and rate limits. |
| `deploy-poll.ts` | Verification utility for live site status. | **Real** | No | Simple `fetch` loop with timeout. |
| `github-token.ts` | Resilient token retrieval logic. | **Real** | Indirectly | Key fix for session expiration. |
| `github.ts` | Repository interfaces and helpers. | **Real** | No | Shared types for repo objects. |
| `platform.ts` | Hosting detection logic. | **Real** | Yes (Direct) | Deployment listing logic included. |
| `refactor.ts` | AST transformation engine (Babel). | **Real** | No | Robust JS/TS/JSX rewriting. |
| `scanner.ts` | Front-end file filtering utilities. | **Real** | No | High-level filters for JSX/TSX. |
| `supabase/server.ts` | Supabase SSR client factory. | **Real** | No | Standard cookie-based auth. |

### Application Screens (`app/`)

| File | Purpose | Status | Uses `provider_token` | Notes |
| :--- | :--- | :--- | :--- | :--- |
| `confirm/page.tsx` | Field confirmation UI after scanning. | **Real** | Client-side | Orchestrates `api/scan/prepare`. |
| `connect/page.tsx` | Search and select project repository. | **Real** | Client-side | Stores repo data in session. |
| `dashboard/page.tsx` | User workspace and project list. | **Real** | No | Main navigation hub. |
| `edit/ [section]/page.tsx` | Visual content editor. | **Real** | Client-side | Live iframe-based editing. |
| `login/page.tsx` | OAuth entry point. | **Real** | No | Standard redirect login. |
| `page.tsx` | Marketing landing page. | **Real** | No | Zero dependency overview. |
| `preview/page.tsx` | Full-screen site inspector. | **Real** | No | Dynamic iframe preview. |
| `publishing/page.tsx` | Workflow progress for deployments. | **Real** | Client-side | Status tracking for backup/commit. |
| `scanning/page.tsx` | Visual feedback during analysis. | **Real** | Client-side | Manages multiple API steps. |
| `setup/page.tsx` | Initial repo analysis and configuration. | **Real** | Client-side | Entry to the editing flow. |

## 📝 Critical Audit Status

- **Mock status**: Only `api/content/write` is currently a mock. All other core flow components are fully implemented.
- **Provider Token Usage**: 100% of Octokit-dependent routes now use the resilient `getGitHubToken` utility (database fallback).
- **Error Handling**: All `/api/setup` and `/api/scan` routes include robust error handling with consistent JSON output. No direct session token access remains in the API layer.
