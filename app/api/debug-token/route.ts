import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getGitHubToken } from '@/lib/github-token'
import { Octokit } from '@octokit/rest'

export async function GET() {
    try {
        const supabase = await createClient()

        const token = await getGitHubToken(supabase)
        const octokit = new Octokit({ auth: token })

        const { data: user } = await octokit.users.getAuthenticated()
        const scopeRes = await octokit.request('GET /user')
        const scopes = scopeRes.headers['x-oauth-scopes']

        // Test getRef directly
        const { data: ref } = await octokit.git.getRef({
            owner: 'akshitkala',
            repo: 'get-me-a-chai',
            ref: 'heads/main'
        })

        let createResult = null
        let createError = null
        try {
            const testBranch = `panelify-debug-${Date.now()}`
            const { data } = await octokit.git.createRef({
                owner: 'akshitkala',
                repo: 'get-me-a-chai',
                ref: `refs/heads/${testBranch}`,
                sha: ref.object.sha
            })
            createResult = { success: true, ref: data.ref }
        } catch (err: any) {
            createError = { status: err.status, message: err.message }
        }

        return NextResponse.json({
            authenticated_as: user.login,
            token_source: 'database or session',
            token_prefix: token.substring(0, 15) + '...',
            scopes,
            sha: ref.object.sha,
            createResult,
            createError
        })
    } catch (err: any) {
        return NextResponse.json({
            error: err.message
        }, { status: 401 })
    }
}
