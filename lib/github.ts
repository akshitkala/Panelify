import { Octokit } from '@octokit/rest';

export interface GitHubRepo {
    name: string;
    full_name: string;
    default_branch: string;
    description: string | null;
    updated_at: string | null;
    owner_login: string;
}

export async function listUserRepos(token: string): Promise<GitHubRepo[]> {
    const octokit = new Octokit({ auth: token });

    const { data: repos } = await octokit.repos.listForAuthenticatedUser({
        sort: 'updated',
        per_page: 100,
        type: 'owner'
    });

    // Filter for Next.js repos (heuristic: must have next.config.js or next.config.ts)
    // To avoid huge latency, we'll return all and detect Next.js on selection
    // or return top 100 and filter basic metadata.

    return repos.map(r => ({
        name: r.name,
        full_name: r.full_name,
        default_branch: r.default_branch,
        description: r.description,
        updated_at: r.updated_at,
        owner_login: r.owner.login
    }));
}
