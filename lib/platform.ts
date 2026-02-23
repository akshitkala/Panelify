import { Octokit } from '@octokit/rest';

export type Platform = 'vercel' | 'netlify' | 'unknown';

export async function detectPlatform(
    files: string[],
    repoFullName: string,
    githubToken: string
): Promise<Platform> {
    // 1. Check for config files first (Fastest)
    if (files.includes('vercel.json')) return 'vercel';
    if (files.includes('netlify.toml')) return 'netlify';

    // 2. Check Vercel API for linked project
    // Note: This requires VERCEL_TOKEN in .env.local if implemented fully.
    // For V1, we primarily rely on repo files and GitHub metadata.

    // 3. Heuristic check via GitHub API (e.g., checking for Vercel/Netlify deployments)
    try {
        const octokit = new Octokit({ auth: githubToken });
        const [owner, repo] = repoFullName.split('/');

        const { data: deployments } = await octokit.repos.listDeployments({
            owner,
            repo,
            per_page: 5
        });

        for (const dep of deployments) {
            if (dep.environment?.toLowerCase().includes('vercel')) return 'vercel';
            if (dep.environment?.toLowerCase().includes('netlify')) return 'netlify';
        }
    } catch (error) {
        console.warn("Failed to check deployments for platform detection:", error);
    }

    return 'unknown';
}
