import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getGitHubToken } from '@/lib/github-token';

export async function POST(request: Request) {
    try {
        const supabase = await createClient();

        try {
            await getGitHubToken(supabase);
        } catch (err: any) {
            return NextResponse.json(
                { error: err.message, code: 'NO_TOKEN' },
                { status: 401 }
            )
        }

        const { schema } = await request.json();

        if (!schema) {
            return NextResponse.json({ error: 'Missing schema' }, { status: 400 });
        }

        const content_json = JSON.stringify(schema, null, 2);

        // Validate it parses back
        try {
            JSON.parse(content_json);
        } catch (e) {
            return NextResponse.json({ error: 'INVALID_JSON_GENERATED' }, { status: 500 });
        }

        return NextResponse.json({ content_json });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
