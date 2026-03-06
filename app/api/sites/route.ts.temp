import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: sites, error } = await supabase
            .from('sites')
            .select('*')
            .order('updated_at', { ascending: false });

        if (error) throw error;

        return NextResponse.json(sites);
    } catch (error: any) {
        console.error("API Sites failed:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const siteData = await request.json();

        const { data, error } = await supabase
            .from('sites')
            .upsert({
                ...siteData,
                user_id: user.id,
                updated_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json(data);
    } catch (error: any) {
        console.error("API Sites creation failed:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
