import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getGitHubToken } from '@/lib/github-token';
import { Octokit } from '@octokit/rest';

export async function POST(request: Request) {
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

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const repo_full_name = formData.get('repo_full_name') as string;
    const filename = formData.get('filename') as string;

    if (!file || !repo_full_name) return NextResponse.json({ error: 'Missing data' }, { status: 400 });

    // 1. File size check (2MB)
    const MAX_SIZE = 2 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
        return NextResponse.json(
            { error: 'File too large. Maximum size is 2MB.', code: 'FILE_TOO_LARGE' },
            { status: 413 }
        );
    }

    // 2. File type check
    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
    if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json(
            { error: 'Unsupported file type. Use JPG, PNG, or WebP.', code: 'BAD_TYPE' },
            { status: 415 }
        );
    }

    const octokit = new Octokit({ auth: token });
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
