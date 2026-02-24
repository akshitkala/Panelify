import { NextResponse } from 'next/server'
import { Octokit } from '@octokit/rest'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
    try {
        const supabase = await createClient()
        const { data: { session } } = await supabase.auth.getSession()
        const token = session?.provider_token

        console.log('Token type:', typeof token)
        console.log('Token prefix:', token?.substring(0, 10))

        if (!token) {
            return NextResponse.json({ error: 'No token in session' }, { status: 401 })
        }

        const octokit = new Octokit({ auth: token })

        // Step 1 — verify token identity
        const { data: authUser } = await octokit.users.getAuthenticated()
        console.log('Authenticated as:', authUser.login)

        const owner = 'akshitkala'
        const repo = 'get-me-a-chai'

        // Step 2 — get SHA
        const { data: ref } = await octokit.git.getRef({
            owner,
            repo,
            ref: 'heads/main'
        })
        console.log('SHA:', ref.object.sha)

        // Step 3 — create branch with explicit hardcoded values
        const testBranch = `panelify-debug-test-${Date.now()}`
        const result = await octokit.git.createRef({
            owner,
            repo,
            ref: `refs/heads/${testBranch}`,
            sha: ref.object.sha
        })

        return NextResponse.json({
            success: true,
            authenticated_as: authUser.login,
            sha: ref.object.sha,
            created_ref: result.data.ref
        })
    } catch (err: any) {
        console.error('Test branch error:', err)
        return NextResponse.json({
            success: false,
            status: err.status,
            message: err.message,
            details: err.response?.data
        }, { status: err.status || 500 })
    }
}
