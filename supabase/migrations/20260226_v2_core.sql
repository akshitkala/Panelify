-- Panelify V2 Core Migration (Simplified - No Teams)
-- Includes: Site Versions and Sites table updates for Multi-site support

-- 1. Update Sites Table
-- Add V2 columns if they don't exist (excluding team_id)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sites' AND column_name='scan_cache') THEN
        ALTER TABLE sites ADD COLUMN scan_cache JSONB;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sites' AND column_name='scan_sha') THEN
        ALTER TABLE sites ADD COLUMN scan_sha TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sites' AND column_name='content_sha') THEN
        ALTER TABLE sites ADD COLUMN content_sha TEXT;
    END IF;
END $$;

-- 2. Create Site Versions Table
CREATE TABLE IF NOT EXISTS site_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    published_by UUID NOT NULL REFERENCES auth.users(id),
    content_json JSONB NOT NULL,
    commit_sha TEXT NOT NULL,
    commit_url TEXT,
    changes_summary TEXT[],
    published_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE site_versions ENABLE ROW LEVEL SECURITY;

-- 3. Helper Functions & Triggers
-- Keep only last 50 versions per site
CREATE OR REPLACE FUNCTION trim_site_versions() RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM site_versions WHERE id IN (
        SELECT id FROM site_versions 
        WHERE site_id = NEW.site_id
        ORDER BY published_at DESC OFFSET 50
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trim_versions_trigger ON site_versions;
CREATE TRIGGER trim_versions_trigger
AFTER INSERT ON site_versions
FOR EACH ROW EXECUTE FUNCTION trim_site_versions();

-- 4. RLS Policies

-- Site Versions Policies
DROP POLICY IF EXISTS versions_select ON site_versions;
CREATE POLICY versions_select ON site_versions FOR SELECT
USING (EXISTS (SELECT 1 FROM sites WHERE id = site_id AND user_id = auth.uid()));

DROP POLICY IF EXISTS versions_insert ON site_versions;
CREATE POLICY versions_insert ON site_versions FOR INSERT
WITH CHECK (auth.uid() = published_by);
