import { SupabaseClient } from '@supabase/supabase-js'

export async function getGitHubToken(
    supabase: SupabaseClient
): Promise<string> {
    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.user?.id) {
        throw new Error('No active session')
    }

    // Try provider_token first (works on fresh login)
    if (session.provider_token) {
        return session.provider_token
    }

    // Fall back to database token (works after page reload)
    const { data: tokenRow, error } = await supabase
        .from('user_tokens')
        .select('github_token')
        .eq('user_id', session.user.id)
        .single()

    if (error || !tokenRow?.github_token) {
        throw new Error('NO_GITHUB_TOKEN: Please sign out and sign back in')
    }

    return tokenRow.github_token
}
