# ◈ Panelify

**Zero-Config CMS for Next.js.** Give your clients a superpower by transforming static sites into editable content managing via a premium CMS panel.

## 🚀 Features
- **AI-Powered Scanning**: Automatically discovers editable content literals in your JSX/TSX files.
- **Git-Native**: No database required. Content is stored directly in your GitHub repository as `content.json`.
- **Safe Refactoring**: Uses Babel AST technology to safely rewrite code without breaking your layout.
- **Instant Preview**: Live preview changes before publishing to production.
- **Multi-Platform**: Native support for Vercel and Netlify deployments.

## 🛠️ Tech Stack
- **Frontend**: Next.js 14, Tailwind CSS v4, Shadcn UI
- **Backend**: Supabase Auth, GitHub API (Octokit)
- **AI**: Google Gemini 1.5 Flash (Primary), Groq Llama 3 (Fallback)

## 📦 Getting Started

### 1. Requirements
- Node.js 18+
- A GitHub Account
- A Supabase Project

### 2. Installation
```bash
git clone https://github.com/your-username/panelify.git
cd panelify
npm install
```

### 3. Configuration
Copy `.env.local.example` to `.env.local` and populate the keys:
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET`
- `GOOGLE_GEMINI_API_KEY`
- `GROQ_API_KEY`

### 4. Database Setup
Run the SQL found in `documents/supabase_schema.sql` (or see the [Supabase Schema](file:///C:/Users/akshi/.gemini/antigravity/brain/579ed60c-84a7-4e37-9b4c-d8a45c9a7f8f/supabase_schema.sql)) in your Supabase SQL Editor.

### 5. Run it
```bash
npm run dev
```

## 📄 License
MIT © 2026 Panelify Engine.
