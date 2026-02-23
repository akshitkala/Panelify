import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { Octokit } from '@octokit/rest';

export async function POST(request: Request) {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { repo_full_name } = await request.json();
    const octokit = new Octokit({ auth: session.provider_token });
    const [owner, repo] = repo_full_name.split('/');

    try {
        // Basic implementation: get all files in repo
        // For V1, we recursively fetch the tree
        const { data: tree } = await octokit.git.getTree({
            owner,
            repo,
            tree_sha: 'main', // Default branch
            recursive: 'true'
        });

        const jsxFiles = tree.tree.filter(f => f.path?.match(/\.(jsx|tsx)$/) && !f.path.includes('layout'))
            .slice(0, 10); // Limit for scan safety

        const contents = await Promise.all(jsxFiles.map(async f => {
            const { data } = await octokit.repos.getContent({
                owner,
                repo,
                path: f.path!
            });
            return {
                path: f.path!,
                content: Buffer.from((data as any).content, 'base64').toString()
            };
        }));

        return NextResponse.json(contents);
    } catch (error) {
        return NextResponse.json({ error: 'GITHUB_ERROR' }, { status: 502 });
    }
}
