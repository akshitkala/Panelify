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

    // 1. Recursive search for JSX/TSX files in likely directories
    const searchDirs = ['components', 'app', 'pages', 'lib'];
    const discoveredFiles: { path: string; content: string }[] = [];

    async function scanDir(path: string) {
      try {
        const { data: content } = await octokit.repos.getContent({
          owner,
          repo,
          path
        });

        if (Array.isArray(content)) {
          for (const item of content) {
            if (discoveredFiles.length >= 10) break;

            if (item.type === 'dir' && searchDirs.some(d => item.path.startsWith(d))) {
              await scanDir(item.path);
            } else if (item.type === 'file' && /\.(tsx|jsx|js|ts)$/.test(item.name)) {
              // Fetch file content
              const { data: fileData }: any = await octokit.repos.getContent({
                owner,
                repo,
                path: item.path
              });
              const decoded = Buffer.from(fileData.content, 'base64').toString('utf-8');
              discoveredFiles.push({
                path: item.path,
                content: decoded
              });
            }
          }
        }
      } catch (e) {
        // Ignore missing dirs
      }
    }

    // Start scanning from root for specific dirs
    const { data: rootContent } = await octokit.repos.getContent({ owner, repo, path: '' });
    if (Array.isArray(rootContent)) {
      for (const item of rootContent) {
        if (discoveredFiles.length >= 10) break;
        if (searchDirs.includes(item.name)) {
          await scanDir(item.name);
        }
        // Also scan root files
        if (item.type === 'file' && /\.(tsx|jsx|js|ts)$/.test(item.name)) {
          const { data: fileData }: any = await octokit.repos.getContent({
            owner,
            repo,
            path: item.path
          });
          const decoded = Buffer.from(fileData.content, 'base64').toString('utf-8');
          discoveredFiles.push({
            path: item.path,
            content: decoded
          });
        }
      }
    }

    return NextResponse.json(discoveredFiles);
  } catch (error: any) {
    console.error("File scan failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
