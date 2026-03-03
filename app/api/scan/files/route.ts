import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getGitHubToken } from '@/lib/github-token';
import { Octokit } from '@octokit/rest';

export async function POST(request: Request) {
  try {
    const { repo_full_name } = await request.json();
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
    const [owner, repo] = repo_full_name.split('/');

    // 1. Get default branch dynamically
    const { data: repoData } = await octokit.repos.get({
      owner,
      repo
    });
    const defaultBranch = repoData.default_branch;

    // 2. Get full recursive tree
    const { data: treeData } = await octokit.git.getTree({
      owner,
      repo,
      tree_sha: defaultBranch,
      recursive: 'true'
    });

    function isValidSourceFile(filePath: string): boolean {
      // Must be a JS/TS file
      if (
        !filePath.endsWith('.tsx') &&
        !filePath.endsWith('.jsx') &&
        !filePath.endsWith('.ts') &&
        !filePath.endsWith('.js')
      ) return false;

      // Exclude config, test, build artifacts
      const lowerPath = filePath.toLowerCase();
      if (
        lowerPath.endsWith('.config.js') ||
        lowerPath.endsWith('.config.mjs') ||
        lowerPath.endsWith('.config.ts') ||
        lowerPath.includes('.test.') ||
        lowerPath.includes('.spec.') ||
        lowerPath.includes('node_modules') ||
        lowerPath.includes('.next') ||
        lowerPath.includes('dist/') ||
        lowerPath.includes('build/')
      ) return false;

      return true;
    }

    // 3. Filter and prioritized files
    const allFiles = treeData.tree
      .filter(item => item.type === 'blob' && isValidSourceFile(item.path!))
      .map(item => item.path!);

    // Priority sorting: components > pages > app
    const priorityOrder = (path: string) => {
      if (path.includes('components/')) return 0;
      if (path.includes('pages/')) return 1;
      if (path.includes('app/')) return 2;
      return 3;
    };

    const sortedFiles = allFiles.sort((a, b) => priorityOrder(a) - priorityOrder(b));
    const finalFilesToScan = sortedFiles.slice(0, 50);

    // 4. Fetch content for selected files
    const discoveredFiles = await Promise.all(
      finalFilesToScan.map(async (path) => {
        const { data: fileData }: any = await octokit.repos.getContent({
          owner,
          repo,
          path
        });
        const decoded = Buffer.from(fileData.content, 'base64').toString('utf-8');
        return { path, content: decoded };
      })
    );

    return NextResponse.json(discoveredFiles);
  } catch (error: any) {
    console.error("File scan failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
