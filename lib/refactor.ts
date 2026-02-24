import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import generate from '@babel/generator';
import * as t from '@babel/types';
import { ContentSchema } from './types/content';

export interface RefactorInput {
    path: string;
    content: string;
}

export interface RefactorOutput {
    path: string;
    new_content: string;
}

/**
 * lib/refactor.ts
 * Rewrites JSX components to consume content from content.json
 */
export async function refactorFiles(
    files: RefactorInput[],
    schema: ContentSchema
): Promise<RefactorOutput[]> {
    const results: RefactorOutput[] = [];

    for (const file of files) {
        try {
            // Handle both / and \ delimiters
            const parts = file.path.split(/[\\/]/);
            const filename = parts.pop() || '';
            const sectionName = filename.split('.')[0].toLowerCase();

            if (!sectionName || !schema[sectionName]) {
                results.push({ path: file.path, new_content: file.content });
                continue;
            }

            const sectionFields = schema[sectionName];
            const ast = parse(file.content, {
                sourceType: 'module',
                plugins: ['jsx', 'typescript']
            });

            let changed = false;
            const sectionsUsed = new Set<string>();

            traverse(ast, {
                // Handle Text in JSX Elements
                JSXText(path) {
                    const value = path.node.value.trim();
                    if (value.length < 2) return;

                    for (const [fieldId, currentValue] of Object.entries(sectionFields)) {
                        if (value === currentValue) {
                            path.replaceWith(
                                t.jsxExpressionContainer(
                                    t.memberExpression(t.identifier(sectionName), t.identifier(fieldId))
                                )
                            );
                            sectionsUsed.add(sectionName);
                            changed = true;
                            break;
                        }
                    }
                },

                // Handle Strings in Attributes (src, alt, etc)
                JSXAttribute(path) {
                    if (t.isStringLiteral(path.node.value)) {
                        const value = path.node.value.value;
                        for (const [fieldId, currentValue] of Object.entries(sectionFields)) {
                            if (value === currentValue) {
                                path.node.value = t.jsxExpressionContainer(
                                    t.memberExpression(t.identifier(sectionName), t.identifier(fieldId))
                                );
                                sectionsUsed.add(sectionName);
                                changed = true;
                                break;
                            }
                        }
                    }
                }
            });

            if (changed) {
                // Add Import and Destructuring
                // parts currently contains the parent directories (length = nesting depth)
                const depth = parts.length;
                const relativePath = depth === 0 ? './content.json' : '../'.repeat(depth) + 'content.json';

                const importDeclaration = t.importDeclaration(
                    [t.importDefaultSpecifier(t.identifier('content'))],
                    t.stringLiteral(relativePath)
                );

                const destructuring = t.variableDeclaration('const', [
                    t.variableDeclarator(
                        t.objectPattern(
                            Array.from(sectionsUsed).map(s =>
                                t.objectProperty(t.identifier(s), t.identifier(s), false, true)
                            )
                        ),
                        t.identifier('content')
                    )
                ]);

                ast.program.body.unshift(destructuring);
                ast.program.body.unshift(importDeclaration);

                const { code } = generate(ast, { jscodeshift: true });

                // Final sanity check
                parse(code, { sourceType: 'module', plugins: ['jsx', 'typescript'] });

                results.push({ path: file.path, new_content: code });
            } else {
                results.push({ path: file.path, new_content: file.content });
            }

        } catch (err) {
            console.error(`Refactor failed for ${file.path}:`, err);
            results.push({ path: file.path, new_content: file.content });
        }
    }

    return results;
}
