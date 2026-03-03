import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getGitHubToken } from '@/lib/github-token';
import { analyzeJSX } from '@/lib/ai';
import { Octokit } from '@octokit/rest';

export async function POST(request: Request) {
    try {
        console.log('=== ANALYZE ROUTE ENV CHECK ===')
        console.log('GEMINI key exists:', !!process.env.GOOGLE_GEMINI_API_KEY)
        console.log('GEMINI key length:', process.env.GOOGLE_GEMINI_API_KEY?.length ?? 0)
        console.log('GEMINI key prefix:', process.env.GOOGLE_GEMINI_API_KEY?.slice(0, 8) ?? 'MISSING')
        console.log('GROQ key exists:', !!process.env.GROQ_API_KEY)
        console.log('GROQ key length:', process.env.GROQ_API_KEY?.length ?? 0)
        console.log('GROQ key prefix:', process.env.GROQ_API_KEY?.slice(0, 8) ?? 'MISSING')
        console.log('NODE_ENV:', process.env.NODE_ENV)

        try {
            const testFetch = await fetch(
                'https://generativelanguage.googleapis.com/v1beta/models',
                {
                    headers: {
                        'x-goog-api-key': process.env.GOOGLE_GEMINI_API_KEY ?? ''
                    }
                }
            )
            console.log('Gemini API reachable:', testFetch.status)
            const testData = await testFetch.json()
            console.log('Available models count:', testData.models?.length ?? 0)
            const flashModel = testData.models?.find((m: any) =>
                m.name?.includes('flash')
            )
            console.log('Flash model found:', flashModel?.name ?? 'NOT FOUND')
        } catch (networkErr: any) {
            console.error('Network test failed:', networkErr.message)
        }

        const { files, repo_full_name } = await request.json();

        if (!files || !Array.isArray(files)) {
            return NextResponse.json({ error: 'Missing or invalid files array' }, { status: 400 });
        }

        const supabase = await createClient();

        let token: string
        try {
            token = await getGitHubToken(supabase);
        } catch (err: any) {
            return NextResponse.json(
                { error: err.message, code: 'NO_TOKEN' },
                { status: 401 }
            )
        }

        // V2 Caching Integration
        let latestSha: string | null = null;
        const octokit = new Octokit({ auth: token });

        if (repo_full_name) {
            try {
                const [owner, repo] = repo_full_name.split('/');

                // 1. Get default branch (from DB or GitHub)
                const { data: siteData } = await supabase
                    .from('sites')
                    .select('default_branch, scan_cache, scan_sha')
                    .eq('repo_full_name', repo_full_name)
                    .single();

                const branch = siteData?.default_branch || 'main';

                // 2. Get latest commit SHA
                const { data: refData } = await octokit.git.getRef({
                    owner,
                    repo,
                    ref: `heads/${branch}`
                });
                latestSha = refData.object.sha;

                // 3. Return cache if SHA matches
                if (siteData?.scan_sha === latestSha && siteData?.scan_cache) {
                    return NextResponse.json(siteData.scan_cache);
                }
            } catch (e) {
                console.warn("Cache check failed, proceeding with fresh scan:", e);
            }
        }

        // Trim files before sending to AI (PR-FIX-03)
        const MAX_CHARS_PER_FILE = 3000  // ~750 tokens per file
        const MAX_FILES = 10             // max 10 files per scan

        const trimmedFiles = files
            .slice(0, MAX_FILES)
            .map((f: { path: string; content: string }) => ({
                path: f.path,
                // Keep first 3000 chars — enough to detect hardcoded strings
                content: f.content.length > MAX_CHARS_PER_FILE
                    ? f.content.slice(0, MAX_CHARS_PER_FILE) + '\n// [truncated]'
                    : f.content
            }));

        console.log('Files after trimming:', trimmedFiles.length);
        console.log('Total chars:', trimmedFiles.reduce(
            (acc, f) => acc + f.content.length, 0
        ));

        // Perform AI Analysis using trimmed files
        let fields = await analyzeJSX(trimmedFiles);

        // V2 Post-Filtering (FR-FIX-02)
        fields = fields.filter(field => {
            // 1. Confidence threshold
            if (field.confidence < 0.85) return false;

            // 2. Remove dynamic expressions (safety net)
            if (field.current_value.includes('{') || field.current_value.includes('}')) return false;

            // 3. Min length check
            if (field.current_value.trim().length < 3) return false;

            return true;
        });

        // Update Cache if repo_full_name provided
        if (repo_full_name && latestSha) {
            try {
                await supabase
                    .from('sites')
                    .update({
                        scan_cache: fields,
                        scan_sha: latestSha,
                        updated_at: new Date().toISOString()
                    })
                    .eq('repo_full_name', repo_full_name);
            } catch (e) {
                console.warn("Failed to update scan cache:", e);
            }
        }

        return NextResponse.json(fields);
    } catch (error: any) {
        console.error("Analysis API failed:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
