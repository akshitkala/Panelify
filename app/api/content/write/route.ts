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
        } catch {
            return NextResponse.json(
                { error: 'No GitHub token', code: 'NO_TOKEN' },
                { status: 401 }
            )
        }

        const { repo_full_name, branch, changes } = await req.json()
        const [owner, repo] = repo_full_name.split('/')
        const octokit = new Octokit({ auth: token })

        // Get current content.json from GitHub
        const { data: file } = await octokit.repos.getContent({
            owner,
            repo,
            path: 'content.json',
            ref: branch
        }) as { data: any }

        const currentSha = file.sha
        const currentContent = JSON.parse(
            Buffer.from(file.content, 'base64').toString('utf-8')
        )

        // Merge pending changes into current content
        const merged = { ...currentContent }
        for (const [section, fields] of Object.entries(changes)) {
            merged[section] = {
                ...merged[section],
                ...(fields as Record<string, string>)
            }
        }

        // Commit updated content.json to GitHub
        const { data: result } = await octokit.repos.createOrUpdateFileContents({
            owner,
            repo,
            path: 'content.json',
            message: `content: ${Object.keys(changes).join(', ')} updated via Panelify`,
            content: Buffer.from(
                JSON.stringify(merged, null, 2)
            ).toString('base64'),
            sha: currentSha,
            branch
        })

        return NextResponse.json({
            commit_sha: result.commit.sha,
            commit_url: result.commit.html_url
        })

    } catch (err: any) {
        console.error('content/write error:', err)

        if (err.status === 409) {
            return NextResponse.json(
                { error: 'Content was updated elsewhere', code: 'SHA_CONFLICT' },
                { status: 409 }
            )
        }

        return NextResponse.json(
            { error: err.message, code: 'COMMIT_ERROR' },
            { status: 502 }
        )
    }
}
