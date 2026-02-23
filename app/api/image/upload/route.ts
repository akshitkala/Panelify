import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { Octokit } from '@octokit/rest';

export async function POST(request: Request) {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const repo_full_name = formData.get('repo_full_name') as string;
    const filename = formData.get('filename') as string;

    if (!file || !repo_full_name) return NextResponse.json({ error: 'Missing data' }, { status: 400 });

    const octokit = new Octokit({ auth: session.provider_token });
    const [owner, repo] = repo_full_name.split('/');

    try {
        const buffer = Buffer.from(await file.arrayBuffer());
        const path = `public/images/${Date.now()}-${filename}`;

        await octokit.repos.createOrUpdateFileContents({
            owner,
            repo,
            path,
            message: `image: upload ${filename} via Panelify`,
            content: buffer.toString('base64')
        });

        return NextResponse.json({ path: `/${path.replace('public/', '')}` });
    } catch (error) {
        console.error("Image upload error:", error);
        return NextResponse.json({ error: 'UPLOAD_FAILED' }, { status: 502 });
    }
}
