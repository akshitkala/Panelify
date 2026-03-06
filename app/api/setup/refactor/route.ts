import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getGitHubToken } from '@/lib/github-token';
import { refactorFiles } from '@/lib/refactor';
import { parse } from '@babel/parser';

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

        const { files, schema } = await request.json();

        console.log('Schema received keys:', Object.keys(schema))
        console.log('Schema sample:', JSON.stringify(schema).slice(0, 200))

        if (!files || !schema) {
            return NextResponse.json({ error: 'Missing files or schema' }, { status: 400 });
        }

        const refactored = await refactorFiles(files, schema);

        // Validate each output with Babel parser
        for (const file of refactored) {
            try {
                parse(file.new_content, {
                    sourceType: 'module',
                    plugins: ['jsx', 'typescript']
                });
            } catch (e: any) {
                console.error(`Refactor validation failed for ${file.path}:`, e.message);
                return NextResponse.json({
                    error: 'REFACTOR_VALIDATION_FAILED',
                    path: file.path,
                    details: e.message
                }, { status: 500 });
            }
        }

        return NextResponse.json(refactored);
    } catch (error: any) {
        console.error("Refactor API failed:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
