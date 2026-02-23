import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { listUserRepos } from '@/lib/github';

export async function GET() {
    const supabase = await createClient();
    const { data: { session }, error: authError } = await supabase.auth.getSession();

    if (authError || !session) {
        return NextResponse.json({ error: 'Not authenticated', code: 'NO_SESSION' }, { status: 401 });
    }

    const githubToken = session.provider_token;
    if (!githubToken) {
        return NextResponse.json({ error: 'No GitHub token in session', code: 'GITHUB_TOKEN_MISSING' }, { status: 401 });
    }

    try {
        const repos = await listUserRepos(githubToken);
        return NextResponse.json(repos);
    } catch (error: any) {
        console.error("GitHub API error:", error);
        return NextResponse.json({ error: 'GitHub API error', code: 'GITHUB_ERROR' }, { status: 502 });
    }
}
