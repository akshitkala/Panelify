import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getGitHubToken } from '@/lib/github-token';
import { Octokit } from '@octokit/rest';

export async function POST(request: Request) {
    try {
        const { repo_full_name, branch, files, content_json, platform, vercel_url, commitMessage } = await request.json();
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

        // STEP 1 — Get the LIVE current SHA of the branch
        // Do this FIRST, immediately before anything else
        const { data: refData } = await octokit.git.getRef({
            owner,
            repo,
            ref: `heads/${branch}`
        });
        const latestSha = refData.object.sha;
        console.log('Latest SHA fetched live:', latestSha);

        // Prepare files list (including content.json)
        const filesToCommit = [
            ...files.map((f: any) => ({ path: f.path, content: f.new_content })),
            { path: 'content.json', content: content_json }
        ];

        // STEP 2 — Create blob for each file
        const blobs = await Promise.all(
            filesToCommit.map(async (file: { path: string, content: string }) => {
                const { data: blob } = await octokit.git.createBlob({
                    owner,
                    repo,
                    content: Buffer.from(file.content).toString('base64'),
                    encoding: 'base64'
                })
                return { path: file.path, sha: blob.sha }
            })
        );
        console.log('Blobs created:', blobs.length);

        // STEP 3 — Create tree using latestSha as base
        const { data: treeData } = await octokit.git.createTree({
            owner,
            repo,
            base_tree: latestSha,
            tree: blobs.map(blob => ({
                path: blob.path,
                mode: '100644' as const,
                type: 'blob' as const,
                sha: blob.sha
            }))
        });
        console.log('Tree created:', treeData.sha);

        // STEP 4 — Create commit with latestSha as parent
        const { data: commitData } = await octokit.git.createCommit({
            owner,
            repo,
            message: commitMessage ?? 'build: setup Panelify CMS refactor',
            tree: treeData.sha,
            parents: [latestSha]
        });
        console.log('Commit created:', commitData.sha);

        // STEP 5 — Update branch ref (fast-forward)
        await octokit.git.updateRef({
            owner,
            repo,
            ref: `heads/${branch}`,
            sha: commitData.sha,
            force: false
        });
        console.log('Branch updated successfully');

        // STEP 6 — Save site to Supabase
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
            await supabase.from('sites').upsert({
                user_id: session.user.id,
                repo_full_name: repo_full_name,
                default_branch: branch,
                platform: platform ?? 'unknown',
                vercel_url: vercel_url ?? null,
                content_sha: commitData.sha,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'repo_full_name',
                ignoreDuplicates: false
            });
            console.log('Site saved to DB');
        }

        return NextResponse.json({
            commit_sha: commitData.sha,
            commit_url: commitData.html_url
        });

    } catch (error: any) {
        console.error("Commit failed:", error);
        return NextResponse.json({
            error: error.message || 'COMMIT_FAILED',
            details: error.response?.data
        }, { status: 500 });
    }
}
