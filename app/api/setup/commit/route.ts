import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { Octokit } from '@octokit/rest';

export async function POST(request: Request) {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { repo_full_name, branch, files, content_json, schema } = await request.json();
    const octokit = new Octokit({ auth: session.provider_token });
    const [owner, repo] = repo_full_name.split('/');

    try {
        // 1. Get the latest commit SHA from the branch
        const { data: ref } = await octokit.git.getRef({ owner, repo, ref: `heads/${branch}` });
        const latestCommitSha = ref.object.sha;

        // 2. Get the tree SHA from the latest commit
        const { data: commit } = await octokit.git.getCommit({ owner, repo, commit_sha: latestCommitSha });
        const baseTreeSha = commit.tree.sha;

        // 3. Create a new tree with changes
        const treeItems = files.map((f: any) => ({
            path: f.path,
            mode: '100644',
            type: 'blob',
            content: f.new_content
        }));

        // Add content.json
        treeItems.push({
            path: 'content.json',
            mode: '100644',
            type: 'blob',
            content: content_json
        });

        const { data: newTree } = await octokit.git.createTree({
            owner,
            repo,
            base_tree: baseTreeSha,
            tree: treeItems
        });

        // 4. Create a new commit
        const { data: newCommit } = await octokit.git.createCommit({
            owner,
            repo,
            message: `panelify: initial setup — ${files.length} components connected`,
            tree: newTree.sha,
            parents: [latestCommitSha]
        });

        // 5. Update the branch reference
        await octokit.git.updateRef({
            owner,
            repo,
            ref: `heads/${branch}`,
            sha: newCommit.sha
        });

        // 6. Update the sites table in Supabase
        await supabase.from('sites').update({
            last_published_at: new Date().toISOString()
        }).eq('repo_full_name', repo_full_name);

        return NextResponse.json({ commit_sha: newCommit.sha });
    } catch (error) {
        console.error("Setup commit error:", error);
        return NextResponse.json({ error: 'COMMIT_ERROR' }, { status: 502 });
    }
}
