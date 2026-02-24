import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getGitHubToken } from '@/lib/github-token';
import { detectPlatform } from '@/lib/platform';

export async function POST(request: Request) {
    try {
        const supabase = await createClient();

        let token: string;
        try {
            token = await getGitHubToken(supabase);
        } catch (err: any) {
            return NextResponse.json(
                { error: err.message, code: 'NO_TOKEN' },
                { status: 401 }
            );
        }

        const { repo_full_name, repo_files } = await request.json();

        if (!repo_full_name || !repo_files) {
            return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
        }

        const platform = await detectPlatform(repo_files, repo_full_name, token);

        return NextResponse.json({ platform });
    } catch (error: any) {
        console.error("Platform detection API failed:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
