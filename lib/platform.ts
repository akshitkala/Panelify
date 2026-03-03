import { Octokit } from '@octokit/rest';

export type Platform = 'vercel' | 'netlify' | 'railway' | 'render' | 'unknown';

export async function detectPlatform(
    files: string[],
    repoFullName: string,
    githubToken: string
): Promise<Platform> {
    // 1. Check for config files first (Fastest)
    if (files.includes('vercel.json')) return 'vercel';
    if (files.includes('netlify.toml')) return 'netlify';
    if (files.includes('railway.json')) return 'railway';
    if (files.includes('render.yaml') || files.includes('render.yml')) return 'render';

    // 2. Heuristic check via GitHub API (e.g., checking for deployments)
    try {
        const octokit = new Octokit({ auth: githubToken });
        const [owner, repo] = repoFullName.split('/');

        const { data: deployments } = await octokit.repos.listDeployments({
            owner,
            repo,
            per_page: 5
        });

        for (const dep of deployments) {
            const env = dep.environment?.toLowerCase() || '';
            if (env.includes('vercel')) return 'vercel';
            if (env.includes('netlify')) return 'netlify';
            if (env.includes('railway')) return 'railway';
            if (env.includes('render')) return 'render';
        }
    } catch (error) {
        console.warn("Failed to check deployments for platform detection:", error);
    }

    return 'unknown';
}
