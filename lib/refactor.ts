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
            const sectionName = file.path.split('/').pop()?.split('.')[0].toLowerCase();
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
                const relativePath = getRelativeContentPath(file.path);
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
            // In production, we'd throw REFACTOR_ERROR
            results.push({ path: file.path, new_content: file.content });
        }
    }

    return results;
}

function getRelativeContentPath(filePath: string): string {
    const parts = filePath.split('/');
    if (parts.length === 1) return './content.json';
    const dots = '../'.repeat(parts.length - 1);
    return `${dots}content.json`;
}
