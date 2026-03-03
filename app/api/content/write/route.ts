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

        const { repo_full_name, branch, changes, is_rollback } = await req.json()
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

        // V2 Rollback vs Merge Logic
        let merged: any
        if (is_rollback) {
            // Full replacement for rollbacks
            merged = changes
        } else {
            // Incremental merge for normal publishes
            merged = { ...currentContent }
            for (const [section, fields] of Object.entries(changes)) {
                merged[section] = {
                    ...merged[section],
                    ...(fields as Record<string, string>)
                }
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

        // V2: Versioning & Site Tracking
        try {
            const { data: { user } } = await supabase.auth.getUser()

            // 1. Get Site ID
            const { data: site } = await supabase
                .from('sites')
                .select('id')
                .eq('repo_full_name', repo_full_name)
                .single()

            if (site && user) {
                // 2. Update sites.content_sha
                await supabase
                    .from('sites')
                    .update({ content_sha: result.commit.sha })
                    .eq('id', site.id)

                // 3. Insert into site_versions
                await supabase
                    .from('site_versions')
                    .insert({
                        site_id: site.id,
                        published_by: user.id,
                        content_json: merged,
                        commit_sha: result.commit.sha,
                        commit_url: result.commit.html_url,
                        changes_summary: Object.keys(changes)
                    })
            }
        } catch (v2Err) {
            console.error('V2 versioning failed (non-blocking):', v2Err)
        }

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
