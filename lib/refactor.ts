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

export async function refactorFiles(
    files: RefactorInput[],
    schema: ContentSchema
): Promise<RefactorOutput[]> {
    const results: RefactorOutput[] = [];

    // Build a flat lookup map: value → { section, fieldId }
    // This way we search ALL sections not just filename-matched one
    const valueLookup = new Map<string, { section: string; fieldId: string }>()
    for (const [section, fields] of Object.entries(schema)) {
        for (const [fieldId, value] of Object.entries(fields as Record<string, string>)) {
            if (value && value.length >= 2) {
                valueLookup.set(value, { section, fieldId })
                const normalized = value.replace(/\s+/g, ' ')
                if (normalized !== value) {
                    valueLookup.set(normalized, { section, fieldId })
                }
            }
        }
    }

    for (const file of files) {
        try {
            const parts = file.path.split(/[\\/]/)
            const filename = parts.pop() || ''

            // Skip non-JSX files
            if (!/\.(jsx?|tsx?)$/.test(filename)) {
                results.push({ path: file.path, new_content: file.content })
                continue
            }

            const ast = parse(file.content, {
                sourceType: 'module',
                plugins: ['jsx', 'typescript']
            })

            let changed = false
            const sectionsUsed = new Set<string>()

            traverse(ast, {
                // Handle text content inside JSX elements
                JSXText(path) {
                    const value = path.node.value.trim().replace(/\s+/g, ' ')
                    if (value.length >= 2) {
                        const match = valueLookup.get(value)
                        if (match) {
                            path.replaceWith(
                                t.jsxExpressionContainer(
                                    t.memberExpression(
                                        t.memberExpression(
                                            t.identifier('content'),
                                            t.identifier(match.section)
                                        ),
                                        t.identifier(match.fieldId)
                                    )
                                )
                            )
                            sectionsUsed.add(match.section)
                            changed = true
                        }
                    }
                },

                // Handle strings in JSX attributes (src, alt, href, etc)
                JSXAttribute(path) {
                    if (t.isStringLiteral(path.node.value)) {
                        const value = path.node.value.value
                        const match = valueLookup.get(value)
                        if (match) {
                            path.node.value = t.jsxExpressionContainer(
                                t.memberExpression(
                                    t.memberExpression(
                                        t.identifier('content'),
                                        t.identifier(match.section)
                                    ),
                                    t.identifier(match.fieldId)
                                )
                            )
                            sectionsUsed.add(match.section)
                            changed = true
                        }
                    }
                }
            })

            if (!changed) {
                results.push({ path: file.path, new_content: file.content })
                continue
            }

            // Remove any existing panelify content import
            ast.program.body = ast.program.body.filter((node: any) => {
                if (t.isImportDeclaration(node)) {
                    const isContentImport = node.specifiers.some((s: any) =>
                        t.isImportDefaultSpecifier(s) &&
                        s.local.name === 'content'
                    )
                    if (isContentImport) {
                        console.log('Removed existing content import')
                        return false
                    }
                }
                return true
            })

            // Calculate relative path to content.json
            const depth = parts.length
            const relativePath = depth === 0
                ? './content.json'
                : '../'.repeat(depth) + 'content.json'

            // Add: import content from '../content.json'
            const importDeclaration = t.importDeclaration(
                [t.importDefaultSpecifier(t.identifier('content'))],
                t.stringLiteral(relativePath)
            )

            ast.program.body.unshift(importDeclaration)

            // Generate code — no invalid options
            const { code } = generate(ast, {})

            console.log(`Refactored: ${file.path} — sections used: ${[...sectionsUsed].join(', ')}`)

            results.push({ path: file.path, new_content: code })

        } catch (err) {
            console.error(`Refactor failed for ${file.path}:`, err)
            results.push({ path: file.path, new_content: file.content })
        }
    }

    return results
}