import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getGitHubToken } from '@/lib/github-token';
import { Octokit } from '@octokit/rest';

export async function POST(request: Request) {
    try {
        const { repo_full_name, branch, files, content_json } = await request.json();
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

        // 1. Get current commit SHA
        const { data: refData } = await octokit.git.getRef({
            owner,
            repo,
            ref: `heads/${branch}`
        });
        const currentCommitSha = refData.object.sha;

        // 2. Get current tree SHA
        const { data: commitData } = await octokit.git.getCommit({
            owner,
            repo,
            commit_sha: currentCommitSha
        });
        const currentTreeSha = commitData.tree.sha;

        // 3. Create blobs/tree items
        const treeItems = [];

        // Refactored files
        for (const file of files) {
            const { data: blobData } = await octokit.git.createBlob({
                owner,
                repo,
                content: file.new_content,
                encoding: 'utf-8'
            });
            treeItems.push({
                path: file.path,
                mode: '100644' as const,
                type: 'blob' as const,
                sha: blobData.sha
            });
        }

        // content.json
        const { data: contentBlob } = await octokit.git.createBlob({
            owner,
            repo,
            content: content_json,
            encoding: 'utf-8'
        });
        treeItems.push({
            path: 'content.json',
            mode: '100644' as const,
            type: 'blob' as const,
            sha: contentBlob.sha
        });

        // 4. Create new tree
        const { data: newTreeData } = await octokit.git.createTree({
            owner,
            repo,
            base_tree: currentTreeSha,
            tree: treeItems
        });

        // 5. Create new commit
        const { data: newCommitData } = await octokit.git.createCommit({
            owner,
            repo,
            message: 'build: setup Panelify CMS refactor',
            tree: newTreeData.sha,
            parents: [currentCommitSha]
        });

        // 6. Update reference
        await octokit.git.updateRef({
            owner,
            repo,
            ref: `heads/${branch}`,
            sha: newCommitData.sha
        });

        return NextResponse.json({
            commit_sha: newCommitData.sha,
            commit_url: newCommitData.html_url
        });

    } catch (error: any) {
        console.error("Commit failed:", error);
        return NextResponse.json({
            error: error.message || 'COMMIT_FAILED',
            details: error.response?.data
        }, { status: 500 });
    }
}
