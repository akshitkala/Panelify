import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { refactorFiles } from '@/lib/refactor';

export async function POST(request: Request) {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { files, schema } = await request.json();

    try {
        const refactored = await refactorFiles(files, schema);
        return NextResponse.json(refactored);
    } catch (error) {
        return NextResponse.json({ error: 'REFACTOR_ERROR' }, { status: 422 });
    }
}
