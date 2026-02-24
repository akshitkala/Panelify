import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    // if "next" is in param, use it as the redirection URL
    const next = searchParams.get('next') ?? '/connect'

    if (code) {
        const supabase = await createClient()
        const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error) {
            // Store GitHub OAuth token persistently — provider_token 
            // is lost after session refresh so we save it to the database
            if (session?.provider_token) {
                await supabase
                    .from('user_tokens')
                    .upsert({
                        user_id: session.user.id,
                        github_token: session.provider_token,
                        updated_at: new Date().toISOString()
                    }, { onConflict: 'user_id' })
                console.log('✓ GitHub token stored for user:', session.user.id)
            } else {
                console.error('✗ No provider_token in session at callback')
            }

            return NextResponse.redirect(`${origin}${next}`)
        }
    }

    // return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
