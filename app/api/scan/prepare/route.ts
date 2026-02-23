import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { confirmed_fields } = await request.json();

    if (!confirmed_fields || confirmed_fields.length === 0) {
        return NextResponse.json({ error: 'No fields confirmed', code: 'NO_FIELDS' }, { status: 400 });
    }

    // Build content.json schema
    // confirmed_fields: [{ component, field_id, label, type, current_value, ... }]
    const schema: any = {};

    confirmed_fields.forEach((field: any) => {
        const sectionName = field.component.replace(/\.(jsx|tsx|js|ts)$/, '').toLowerCase();

        if (!schema[sectionName]) {
            schema[sectionName] = {};
        }

        schema[sectionName][field.field_id] = field.current_value;
    });

    return NextResponse.json({ schema });
}
