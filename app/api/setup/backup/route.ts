import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getGitHubToken } from '@/lib/github-token'
import { Octokit } from '@octokit/rest'

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient()

        let token: string
        try {
            token = await getGitHubToken(supabase)
        } catch (err: any) {
            return NextResponse.json(
                { error: err.message, code: 'NO_TOKEN' },
                { status: 401 }
            )
        }

        const { repo_full_name, default_branch: initialBranch } = await req.json()
        let defaultBranch = initialBranch || 'main'
        const [owner, repo] = repo_full_name.split('/')

        const octokit = new Octokit({ auth: token })

        // Get the SHA of the latest commit on the default branch
        let sha = ''
        try {
            const { data: refData } = await octokit.git.getRef({
                owner,
                repo,
                ref: `heads/${defaultBranch}`
            })
            sha = refData.object.sha
        } catch (e: any) {
            if (defaultBranch === 'main') {
                const { data: refData } = await octokit.git.getRef({
                    owner,
                    repo,
                    ref: 'heads/master'
                })
                sha = refData.object.sha
                defaultBranch = 'master'
            } else {
                throw e
            }
        }

        const backupBranch = `panelify-backup-${new Date().toISOString().split('T')[0]}`

        try {
            await octokit.git.createRef({
                owner,
                repo,
                ref: `refs/heads/${backupBranch}`,
                sha
            })
            console.log('✓ Backup branch created:', backupBranch)
            return NextResponse.json({ branch: backupBranch, branch_name: backupBranch, sha, skipped: false })
        } catch (err: any) {
            if (err.status === 422 && err.message?.includes('Reference already exists')) {
                console.log('✓ Backup branch already exists — skipping creation:', backupBranch)
                return NextResponse.json({
                    branch: backupBranch,
                    branch_name: backupBranch,
                    sha,
                    skipped: true
                })
            }
            throw err
        }

    } catch (err: any) {
        console.error('Backup branch error:', {
            message: err.message,
            status: err.status,
            details: err.response?.data
        })
        return NextResponse.json(
            { error: err.message, code: 'BRANCH_ERROR', details: err.response?.data },
            { status: 502 }
        )
    }
}