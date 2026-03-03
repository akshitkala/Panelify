import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getGitHubToken } from '@/lib/github-token';
import { Octokit } from '@octokit/rest';
import { detectPagesFromURL } from '@/lib/scanner';

export async function POST(request: Request) {
    try {
        const { repo_full_name } = await request.json();
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

        const octokit = new Octokit({ auth: token });
        const [owner, repo] = repo_full_name.split('/');

        // 1. Get default branch
        const { data: repoData } = await octokit.repos.get({
            owner,
            repo
        });
        const defaultBranch = repoData.default_branch;

        // 2. Get full tree to detect pages
        const { data: treeData } = await octokit.git.getTree({
            owner,
            repo,
            tree_sha: defaultBranch,
            recursive: 'true'
        });

        const allPaths = treeData.tree.map(item => item.path!).filter(Boolean);
        const pages = detectPagesFromURL(allPaths);

        return NextResponse.json({ pages });
    } catch (error: any) {
        console.error("Page detection failed:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
