import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { Octokit } from '@octokit/rest';

export async function POST(request: Request) {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { repo_full_name, default_branch } = await request.json();
    const octokit = new Octokit({ auth: session.provider_token });
    const [owner, repo] = repo_full_name.split('/');

    try {
        // 1. Get SHA of default branch
        const { data: ref } = await octokit.git.getRef({
            owner,
            repo,
            ref: `heads/${default_branch}`
        });

        const sha = ref.object.sha;
        const backupBranchName = `panelify-backup-${new Date().toISOString().split('T')[0]}`;

        // 2. Create backup branch
        await octokit.git.createRef({
            owner,
            repo,
            ref: `refs/heads/${backupBranchName}`,
            sha
        });

        return NextResponse.json({ branch_name: backupBranchName, sha });
    } catch (error: any) {
        if (error.status === 422) {
            // Branch might already exist
            return NextResponse.json({ branch_name: `panelify-backup-${new Date().toISOString().split('T')[0]}`, exists: true });
        }
        return NextResponse.json({ error: 'BRANCH_ERROR' }, { status: 502 });
    }
}
