import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import * as t from '@babel/types';

export interface ScannerResult {
    path: string;
    jsxContent: string;
}

export async function extractJSXFiles(files: { path: string; content: string }[]): Promise<ScannerResult[]> {
    // Filters and prepares files for AI analysis
    // Focus on components, avoiding config files or non-ui files
    return files
        .filter(f => (f.path.endsWith('.jsx') || f.path.endsWith('.tsx')) && !f.path.includes('layout'))
        .map(f => ({
            path: f.path,
            jsxContent: f.content
        }));
}

/**
 * Identifies pages/routes from the project structure
 */
export function detectPagesFromURL(files: string[]): string[] {
    const routes = new Set<string>();
    routes.add('/'); // Always include root

    files.forEach(path => {
        // App Router detection
        if (path.startsWith('app/')) {
            const parts = path.split('/');
            // Look for page.tsx or page.jsx
            if (parts.pop()?.startsWith('page.')) {
                const route = parts.slice(1).join('/');
                routes.add(route === '' ? '/' : `/${route}`);
            }
        }
        // Pages Router detection
        else if (path.startsWith('pages/')) {
            // Filter out _app, _document, api/
            if (path.includes('_app') || path.includes('_document') || path.includes('pages/api/')) return;

            const route = path
                .replace('pages/', '')
                .replace(/\.(tsx|jsx|js|ts)$/, '')
                .replace(/\/index$/, '');

            routes.add(route === '' ? '/' : `/${route}`);
        }
    });

    return Array.from(routes).sort();
}
