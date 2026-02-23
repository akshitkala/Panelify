import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { Octokit } from '@octokit/rest';

export async function POST(request: Request) {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { repo_full_name, branch, changes, sha } = await request.json();
    const octokit = new Octokit({ auth: session.provider_token });
    const [owner, repo] = repo_full_name.split('/');

    try {
        // 1. Read current content.json
        const { data: currentFile }: any = await octokit.repos.getContent({
            owner,
            repo,
            path: 'content.json'
        });

        const currentContent = JSON.parse(Buffer.from(currentFile.content, 'base64').toString());

        // 2. Merge changes
        const updatedContent = { ...currentContent };
        for (const [section, sectionChanges] of Object.entries(changes)) {
            updatedContent[section] = {
                ...(updatedContent[section] || {}),
                ...(sectionChanges as any)
            };
        }

        // 3. Commit update
        await octokit.repos.createOrUpdateFileContents({
            owner,
            repo,
            path: 'content.json',
            message: `content: ${Object.keys(changes).join(', ')} updated via Panelify`,
            content: Buffer.from(JSON.stringify(updatedContent, null, 2)).toString('base64'),
            sha: currentFile.sha,
            branch
        });

        // 4. Update sites table publish timestamp
        await supabase.from('sites').update({
            last_published_at: new Date().toISOString()
        }).eq('repo_full_name', repo_full_name);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Content write error:", error);
        if (error.status === 409) return NextResponse.json({ error: 'SHA_CONFLICT' }, { status: 409 });
        return NextResponse.json({ error: 'COMMIT_ERROR' }, { status: 502 });
    }
}
