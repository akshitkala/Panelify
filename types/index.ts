export interface Site {
    id: string;
    user_id: string;
    repo_full_name: string;
    default_branch: string;
    platform: 'vercel' | 'netlify' | 'railway' | 'render' | 'unknown';
    vercel_url: string | null;
    scan_cache: AIField[] | null;
    scan_sha: string | null;
    content_sha: string | null;
    created_at: string;
    updated_at: string;
}

export interface AIField {
    component: string;
    field_id: string;
    label: string;
    type: 'text' | 'textarea' | 'image';
    current_value: string;
    confidence: number;
}

export interface ContentSchema {
    [section: string]: {
        [field_id: string]: string;
    }
}

export interface SiteVersion {
    id: string;
    site_id: string;
    published_by: string;
    content_json: ContentSchema;
    commit_sha: string;
    commit_url: string | null;
    changes_summary: string[] | null;
    created_at: string;
}
