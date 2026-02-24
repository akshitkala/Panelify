import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json().catch(() => ({}));
        const { confirmed_fields } = body;

        if (!confirmed_fields || !Array.isArray(confirmed_fields)) {
            return NextResponse.json({ error: 'INVALID_INPUT', details: 'confirmed_fields is required' }, { status: 400 });
        }

        const schema: any = {};
        confirmed_fields.forEach((field: any) => {
            if (!field.field_id || !field.current_value) return;

            // Handle missing component name gracefully
            const rawComponent = field.component || 'Global';
            const sectionName = rawComponent.replace(/\.(jsx|tsx|js|ts)$/, '').toLowerCase();

            if (!schema[sectionName]) schema[sectionName] = {};
            schema[sectionName][field.field_id] = field.current_value;
        });

        return NextResponse.json({ schema });
    } catch (error: any) {
        console.error("Preparation API Failed:", error);
        return NextResponse.json({
            error: 'PREPARE_FAILED',
            message: error.message
        }, { status: 500 });
    }
}
