import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { analyzeJSX } from '@/lib/ai';

export async function POST(request: Request) {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { files } = await request.json();

    try {
        const results = await analyzeJSX(files);
        return NextResponse.json(results);
    } catch (error) {
        return NextResponse.json({ error: 'AI_ERROR' }, { status: 502 });
    }
}
