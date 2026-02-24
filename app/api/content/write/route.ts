import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getGitHubToken } from '@/lib/github-token';

export async function POST(request: Request) {
    const supabase = await createClient();

    try {
        await getGitHubToken(supabase);
    } catch (err: any) {
        return NextResponse.json(
            { error: err.message, code: 'NO_TOKEN' },
            { status: 401 }
        )
    }

    return NextResponse.json({ success: true });
}
