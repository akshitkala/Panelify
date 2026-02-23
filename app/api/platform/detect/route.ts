import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { detectPlatform } from '@/lib/platform';

export async function POST(request: Request) {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { repo_full_name, repo_files } = await request.json();

    if (!repo_full_name || !repo_files) {
        return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const githubToken = session.provider_token;
    const platform = await detectPlatform(repo_files, repo_full_name, githubToken!);

    return NextResponse.json({ platform });
}
