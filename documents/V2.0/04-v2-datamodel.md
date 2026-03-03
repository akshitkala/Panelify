**Panelify V2**

_Data Model & Schema Reference_

Version 2.0 — Draft

February 2026

# **1\. Overview**

This document defines all database tables, columns, types, and relationships for Panelify V2. V2 extends the V1 schema with three new tables and modifications to the sites table.

| **Table** | **Status** | **Purpose** |
| --- | --- | --- |
| sites | V1 Modified | Connected repos — extended with scan cache and team link |
| user_tokens | V1 Unchanged | Persistent GitHub OAuth tokens |
| teams | V2 New | Groups of users sharing sites |
| team_members | V2 New | Users belonging to teams with roles |
| site_versions | V2 New | Published content snapshots for version history |

# **2\. Table: sites**

## **2.1 Full Schema**

Run in Supabase SQL Editor to create or update the sites table.

| **Column** | **Type** | **Nullable** | **Default** | **Purpose** |
| --- | --- | --- | --- | --- |
| id  | UUID | No  | gen_random_uuid() | Primary key |
| user_id | UUID | No  | None | Owner — references auth.users(id) |
| team_id | UUID | Yes | NULL | V2 NEW — team that owns this site |
| repo_full_name | TEXT | No  | None | e.g. akshitkala/get-me-a-chai |
| default_branch | TEXT | No  | main | main, master, or other |
| platform | TEXT | No  | unknown | vercel, netlify, railway, render, unknown |
| vercel_url | TEXT | Yes | NULL | Live site URL for iframe and polling |
| scan_cache | JSONB | Yes | NULL | V2 NEW — cached AI scan results |
| scan_sha | TEXT | Yes | NULL | V2 NEW — commit SHA when scan was cached |
| content_sha | TEXT | Yes | NULL | Current SHA of content.json for conflict detection |
| created_at | TIMESTAMPTZ | No  | NOW() | Record creation time |
| updated_at | TIMESTAMPTZ | No  | NOW() | Last modified time |

## **2.2 SQL**

Full CREATE TABLE statement including V2 additions:

_CREATE TABLE sites (_

_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),_

_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,_

_team_id UUID REFERENCES teams(id) ON DELETE SET NULL,_

_repo_full_name TEXT NOT NULL,_

_default_branch TEXT NOT NULL DEFAULT 'main',_

_platform TEXT NOT NULL DEFAULT 'unknown',_

_vercel_url TEXT,_

_scan_cache JSONB,_

_scan_sha TEXT,_

_content_sha TEXT,_

_created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),_

_updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()_

_);_

_ALTER TABLE sites ENABLE ROW LEVEL SECURITY;_

_CREATE POLICY sites_select ON sites FOR SELECT USING (auth.uid() = user_id);_

_CREATE POLICY sites_insert ON sites FOR INSERT WITH CHECK (auth.uid() = user_id);_

_CREATE POLICY sites_update ON sites FOR UPDATE USING (auth.uid() = user_id);_

_CREATE POLICY sites_delete ON sites FOR DELETE USING (auth.uid() = user_id);_

## **2.3 Scan Cache Logic**

- On scan: fetch latest commit SHA from GitHub API
- If sites.scan_sha matches current SHA: return sites.scan_cache — skip AI call
- If SHA differs or scan_cache is NULL: run full AI scan, update scan_cache and scan_sha
- On new commit to repo: scan_sha will no longer match — triggers fresh scan
- User can force rescan: set scan_sha = NULL via dashboard Rescan button

# **3\. Table: user_tokens**

## **3.1 Schema — Unchanged from V1**

| **Column** | **Type** | **Nullable** | **Purpose** |
| --- | --- | --- | --- |
| user_id | UUID | No  | Primary key — references auth.users(id) |
| github_token | TEXT | No  | GitHub OAuth provider_token — persisted across sessions |
| updated_at | TIMESTAMPTZ | No  | Last token refresh time |

No changes in V2. Token stored at OAuth callback, retrieved by getGitHubToken() in all API routes.

# **4\. Table: teams (V2 New)**

## **4.1 Schema**

| **Column** | **Type** | **Nullable** | **Default** | **Purpose** |
| --- | --- | --- | --- | --- |
| id  | UUID | No  | gen_random_uuid() | Primary key |
| name | TEXT | No  | None | Team display name e.g. Acme Agency |
| owner_id | UUID | No  | None | User who created the team — references auth.users(id) |
| created_at | TIMESTAMPTZ | No  | NOW() | Record creation time |

## **4.2 SQL**

_CREATE TABLE teams (_

_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),_

_name TEXT NOT NULL,_

_owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,_

_created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()_

_);_

_ALTER TABLE teams ENABLE ROW LEVEL SECURITY;_

_CREATE POLICY teams_select ON teams FOR SELECT_

_USING (auth.uid() = owner_id OR_

_EXISTS (SELECT 1 FROM team_members WHERE team_id = teams.id AND user_id = auth.uid()));_

_CREATE POLICY teams_insert ON teams FOR INSERT WITH CHECK (auth.uid() = owner_id);_

_CREATE POLICY teams_update ON teams FOR UPDATE USING (auth.uid() = owner_id);_

_CREATE POLICY teams_delete ON teams FOR DELETE USING (auth.uid() = owner_id);_

# **5\. Table: team_members (V2 New)**

## **5.1 Schema**

| **Column** | **Type** | **Nullable** | **Default** | **Purpose** |
| --- | --- | --- | --- | --- |
| id  | UUID | No  | gen_random_uuid() | Primary key |
| team_id | UUID | No  | None | Team this membership belongs to |
| user_id | UUID | Yes | NULL | User — NULL until invitation accepted |
| email | TEXT | No  | None | Invited email address |
| role | TEXT | No  | editor | admin or editor |
| invited_at | TIMESTAMPTZ | No  | NOW() | When invitation was sent |
| accepted_at | TIMESTAMPTZ | Yes | NULL | NULL = pending, set when accepted |

## **5.2 Role Definitions**

| **Role** | **Can Edit** | **Can Publish** | **Can Invite** | **Can Manage Sites** |
| --- | --- | --- | --- | --- |
| owner | Yes | Yes | Yes | Yes |
| admin | Yes | Yes | No  | No  |
| editor | Yes | No  | No  | No  |

## **5.3 SQL**

_CREATE TABLE team_members (_

_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),_

_team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,_

_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,_

_email TEXT NOT NULL,_

_role TEXT NOT NULL DEFAULT 'editor' CHECK (role IN ('admin', 'editor')),_

_invited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),_

_accepted_at TIMESTAMPTZ_

_);_

_ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;_

_CREATE POLICY members_select ON team_members FOR SELECT_

_USING (EXISTS (SELECT 1 FROM teams WHERE id = team_id AND owner_id = auth.uid())_

_OR user_id = auth.uid());_

_CREATE POLICY members_insert ON team_members FOR INSERT_

_WITH CHECK (EXISTS (SELECT 1 FROM teams WHERE id = team_id AND owner_id = auth.uid()));_

_CREATE POLICY members_delete ON team_members FOR DELETE_

_USING (EXISTS (SELECT 1 FROM teams WHERE id = team_id AND owner_id = auth.uid()));_

# **6\. Table: site_versions (V2 New)**

## **6.1 Schema**

| **Column** | **Type** | **Nullable** | **Default** | **Purpose** |
| --- | --- | --- | --- | --- |
| id  | UUID | No  | gen_random_uuid() | Primary key |
| site_id | UUID | No  | None | Site this version belongs to |
| published_by | UUID | No  | None | User who published — references auth.users(id) |
| content_json | JSONB | No  | None | Full content.json snapshot at publish time |
| commit_sha | TEXT | No  | None | GitHub commit SHA for this version |
| commit_url | TEXT | Yes | NULL | GitHub link to the commit |
| changes_summary | TEXT\[\] | Yes | NULL | Array of changed section names |
| published_at | TIMESTAMPTZ | No  | NOW() | When this version was published |

## **6.2 SQL**

_CREATE TABLE site_versions (_

_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),_

_site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,_

_published_by UUID NOT NULL REFERENCES auth.users(id),_

_content_json JSONB NOT NULL,_

_commit_sha TEXT NOT NULL,_

_commit_url TEXT,_

_changes_summary TEXT\[\],_

_published_at TIMESTAMPTZ NOT NULL DEFAULT NOW()_

_);_

_\-- Keep only last 50 versions per site_

_CREATE OR REPLACE FUNCTION trim_site_versions() RETURNS TRIGGER AS $$_

_BEGIN_

_DELETE FROM site_versions WHERE id IN (_

_SELECT id FROM site_versions WHERE site_id = NEW.site_id_

_ORDER BY published_at DESC OFFSET 50_

_);_

_RETURN NEW;_

_END;_

_$$ LANGUAGE plpgsql;_

_CREATE TRIGGER trim_versions_trigger_

_AFTER INSERT ON site_versions_

_FOR EACH ROW EXECUTE FUNCTION trim_site_versions();_

_ALTER TABLE site_versions ENABLE ROW LEVEL SECURITY;_

_CREATE POLICY versions_select ON site_versions FOR SELECT_

_USING (EXISTS (SELECT 1 FROM sites WHERE id = site_id AND user_id = auth.uid()));_

_CREATE POLICY versions_insert ON site_versions FOR INSERT_

_WITH CHECK (auth.uid() = published_by);_

# **7\. TypeScript Types**

All types defined in types/index.ts for use across the application.

_// sites table_

_export interface Site {_

_id: string_

_user_id: string_

_team_id: string | null_

_repo_full_name: string_

_default_branch: string_

_platform: 'vercel' | 'netlify' | 'railway' | 'render' | 'unknown'_

_vercel_url: string | null_

_scan_cache: AIField\[\] | null_

_scan_sha: string | null_

_content_sha: string | null_

_created_at: string_

_updated_at: string_

_}_

_// AI scan result_

_export interface AIField {_

_component: string // e.g. "Hero"_

_field_id: string // e.g. "hero_title"_

_label: string // e.g. "Hero Title"_

_type: 'text' | 'textarea' | 'image'_

_current_value: string // original hardcoded value_

_confidence: number // 0.0 to 1.0_

_}_

_// content.json structure_

_export interface ContentSchema {_

_\[section: string\]: {_

_\[field_id: string\]: string_

_}_

_}_

_// team member_

_export interface TeamMember {_

_id: string_

_team_id: string_

_user_id: string | null_

_email: string_

_role: 'admin' | 'editor'_

_invited_at: string_

_accepted_at: string | null_

_}_

_// site version_

_export interface SiteVersion {_

_id: string_

_site_id: string_

_published_by: string_

_content_json: ContentSchema_

_commit_sha: string_

_commit_url: string | null_

_changes_summary: string\[\] | null_

_published_at: string_

_}_

# **8\. Data Flow**

## **8.1 Scan Result Cache Flow**

| **Step** | **Action** | **Table Updated** |
| --- | --- | --- |
| 1   | User triggers scan | None |
| 2   | Fetch latest commit SHA from GitHub | None |
| 3   | Compare SHA with sites.scan_sha | None |
| 4a  | SHA matches — return sites.scan_cache instantly | None |
| 4b  | SHA differs — call Gemini, get fields | None |
| 5   | Store fields in sites.scan_cache, update sites.scan_sha | sites |
| 6   | Return fields to confirm screen | None |

## **8.2 Publish Flow**

| **Step** | **Action** | **Table Updated** |
| --- | --- | --- |
| 1   | User clicks Publish | None |
| 2   | POST /api/content/write — merge changes into content.json | None |
| 3   | GitHub commit — content.json updated | None |
| 4   | Update sites.content_sha with new SHA | sites |
| 5   | Insert snapshot into site_versions | site_versions |
| 6   | Deploy polling — verify live site updated | None |
| 7   | Clear pending_changes from sessionStorage | None |