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

        // V3: Bake-Back Flow
        try {
            // 1. Get full recursive tree to find all JSX/TSX files
            const { data: treeData } = await octokit.git.getTree({
                owner,
                repo,
                tree_sha: branch,
                recursive: 'true'
            });

            const isValidSourceFile = (filePath: string): boolean => {
                if (!/\.(jsx?|tsx?)$/.test(filePath)) return false;
                const lowerPath = filePath.toLowerCase();
                if (
                    lowerPath.includes('node_modules') ||
                    lowerPath.includes('.next') ||
                    lowerPath.includes('dist/') ||
                    lowerPath.includes('build/')
                ) return false;
                return true;
            };

            const filesToScan = treeData.tree
                .filter(item => item.type === 'blob' && isValidSourceFile(item.path!))
                .map(item => item.path!);

            // 2. Fetch content and bake
            const bakeContent = (jsxContent: string, schema: any): string => {
                let result = jsxContent
                for (const [section, fields] of Object.entries(schema)) {
                    for (const [fieldId, value] of Object.entries(
                        fields as Record<string, string>
                    )) {
                        // Replace JSX expression: {content.section.fieldId}
                        const pattern = new RegExp(
                            `\\{content\\.${section}\\.${fieldId}\\}`,
                            'g'
                        )
                        result = result.replace(pattern, value as string)

                        // Replace attribute expression: ={content.section.fieldId}
                        const attrPattern = new RegExp(
                            `=\\{content\\.${section}\\.${fieldId}\\}`,
                            'g'
                        )
                        result = result.replace(
                            attrPattern,
                            `="${value}"`
                        )
                    }
                }
                return result
            }

            const removeContentImport = (jsxContent: string): string => {
                return jsxContent
                    .split('\n')
                    .filter(line => !line.includes('content.json'))
                    .join('\n')
            }

            const changedFiles: { path: string, content: string }[] = []

            for (const path of filesToScan) {
                const { data: fileData }: any = await octokit.repos.getContent({
                    owner,
                    repo,
                    path,
                    ref: branch
                });
                const original = Buffer.from(fileData.content, 'base64').toString('utf-8');

                let baked = bakeContent(original, merged)
                baked = removeContentImport(baked)

                if (baked !== original) {
                    changedFiles.push({ path, content: baked })
                }
            }

            if (changedFiles.length > 0) {
                console.log(`Baking back ${changedFiles.length} files...`)

                // Get latest SHA again for the atomic commit
                const { data: refData } = await octokit.git.getRef({
                    owner, repo, ref: `heads/${branch}`
                });
                const latestSha = refData.object.sha;

                // Create blobs
                const blobs = await Promise.all(
                    changedFiles.map(async (file) => {
                        const { data: blob } = await octokit.git.createBlob({
                            owner, repo,
                            content: Buffer.from(file.content).toString('base64'),
                            encoding: 'base64'
                        })
                        return { path: file.path, sha: blob.sha }
                    })
                )

                // Create tree
                const { data: newTree } = await octokit.git.createTree({
                    owner, repo,
                    base_tree: latestSha,
                    tree: blobs.map(blob => ({
                        path: blob.path,
                        mode: '100644' as const,
                        type: 'blob' as const,
                        sha: blob.sha
                    }))
                })

                // Create commit
                const { data: commit } = await octokit.git.createCommit({
                    owner, repo,
                    message: 'chore: panelify publish — content baked into JSX',
                    tree: newTree.sha,
                    parents: [latestSha]
                })

                // Update ref
                await octokit.git.updateRef({
                    owner, repo,
                    ref: `heads/${branch}`,
                    sha: commit.sha
                })

                console.log('Bake-back commit complete:', commit.sha)
            }

            // STEP 5 — Delete content.json
            console.log('Deleting content.json...')
            await octokit.repos.deleteFile({
                owner,
                repo,
                path: 'content.json',
                message: 'chore: panelify publish complete — content baked in',
                sha: result.content?.sha || currentSha, // Use the new SHA if available
                branch
            })
            console.log('content.json deleted')

        } catch (bakeErr) {
            console.error('V3 bake-back failed:', bakeErr)
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
