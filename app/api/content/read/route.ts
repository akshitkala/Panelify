import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { Octokit } from '@octokit/rest';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const repo_full_name = searchParams.get('repo_full_name');

    if (!repo_full_name) return NextResponse.json({ error: 'Missing repo' }, { status: 400 });

    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const octokit = new Octokit({ auth: session.provider_token });
    const [owner, repo] = repo_full_name.split('/');

    try {
        const { data } = await octokit.repos.getContent({
            owner,
            repo,
            path: 'content.json'
        });

        const content = JSON.parse(Buffer.from((data as any).content, 'base64').toString());
        return NextResponse.json({ content, sha: (data as any).sha });
    } catch (error) {
        return NextResponse.json({ error: 'CONTENT_NOT_FOUND', code: 'CONTENT_NOT_FOUND' }, { status: 404 });
    }
}
