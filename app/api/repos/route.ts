import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getGitHubToken } from '@/lib/github-token';
import { Octokit } from '@octokit/rest';

export async function GET() {
    try {
        const supabase = await createClient();

        let token: string
        try {
            token = await getGitHubToken(supabase)
        } catch (err: any) {
            return NextResponse.json(
                { error: err.message, code: 'NO_TOKEN' },
                { status: 401 }
            )
        }

        const octokit = new Octokit({ auth: token });

        const { data: repos } = await octokit.repos.listForAuthenticatedUser({
            sort: 'updated',
            per_page: 50,
            type: 'owner'
        });

        const filteredRepos = [];

        // Concurrently check top repos for Next.js config
        const checkNextJs = async (r: any) => {
            try {
                const { data: files } = await octokit.repos.getContent({
                    owner: r.owner.login,
                    repo: r.name,
                    path: ''
                });

                if (Array.isArray(files)) {
                    const isNextJs = files.some(f =>
                        f.name === 'next.config.js' ||
                        f.name === 'next.config.mjs' ||
                        f.name === 'next.config.ts'
                    );

                    if (isNextJs) {
                        return {
                            name: r.name,
                            full_name: r.full_name,
                            description: r.description,
                            updated_at: r.updated_at,
                            default_branch: r.default_branch
                        };
                    }
                }
            } catch (e) {
                // Ignore repos where we can't read root (e.g. empty)
            }
            return null;
        };

        const results = await Promise.all(repos.map(r => checkNextJs(r)));
        const finalRepos = results.filter(r => r !== null);

        return NextResponse.json(finalRepos);
    } catch (error: any) {
        console.error("Fetch repos failed:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
