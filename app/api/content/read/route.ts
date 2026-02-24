import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getGitHubToken } from '@/lib/github-token';
import { Octokit } from '@octokit/rest';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const repo_full_name = searchParams.get('repo_full_name');

        if (!repo_full_name) {
            return NextResponse.json({ error: 'Missing repo_full_name' }, { status: 400 });
        }

        const supabase = await createClient();

        let token: string
        try {
            token = await getGitHubToken(supabase)
        } catch (err: any) {
            return NextResponse.json(
                { error: err.message, code: 'NO_TOKEN' },
                { status: 401 }
            )
        }

        const octokit = new Octokit({ auth: token });
        const [owner, repo] = repo_full_name.split('/');

        const { data: file }: any = await octokit.repos.getContent({
            owner,
            repo,
            path: 'content.json'
        });

        const decoded = Buffer.from(file.content, 'base64').toString('utf-8');
        return NextResponse.json({
            content: JSON.parse(decoded),
            sha: file.sha
        });
    } catch (error: any) {
        if (error.status === 404) {
            return NextResponse.json({ content: null }, { status: 200 });
        }
        console.error("Content read failed:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
