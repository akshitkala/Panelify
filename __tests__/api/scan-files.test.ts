import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST as scanFilesPOST } from '@/app/api/scan/files/route'
import { createClient } from '@/lib/supabase/server'
import { Octokit } from '@octokit/rest'

const { mockGetTree, mockGetContent, mockGetRepo } = vi.hoisted(() => ({
    mockGetTree: vi.fn(),
    mockGetContent: vi.fn(),
    mockGetRepo: vi.fn()
}))

vi.mock('@octokit/rest', () => ({
    Octokit: vi.fn().mockImplementation(function () {
        return {
            git: {
                getTree: mockGetTree
            },
            repos: {
                getContent: mockGetContent,
                get: mockGetRepo
            }
        }
    })
}))

vi.mock('@/lib/supabase/server', () => ({
    createClient: vi.fn()
}))

describe('api/scan/files - Verification Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        // @ts-ignore
        createClient.mockResolvedValue({
            auth: { getSession: vi.fn().mockResolvedValue({ data: { session: { provider_token: 'tok' } } }) }
        })
    })

    it('dynamically detects default branch and fetches tree', async () => {
        // Mock repo metadata returning 'master'
        mockGetRepo.mockResolvedValue({ data: { default_branch: 'master' } })

        // Mock tree returning a file
        mockGetTree.mockResolvedValue({
            data: {
                tree: [
                    { path: 'Hero.tsx', type: 'blob', sha: 'sha1' }
                ]
            }
        })

        // Mock content fetching
        mockGetContent.mockResolvedValue({ data: { content: Buffer.from('const x = 1').toString('base64') } })

        const req = new Request('http://localhost/api/scan/files', {
            method: 'POST',
            body: JSON.stringify({ repo_full_name: 'akshitkala/test' })
        })

        const res = await scanFilesPOST(req)
        const data = await res.json()

        expect(res.status).toBe(200)
        expect(mockGetRepo).toHaveBeenCalledWith({ owner: 'akshitkala', repo: 'test' })
        expect(mockGetTree).toHaveBeenCalledWith(expect.objectContaining({
            tree_sha: 'master'
        }))
        expect(data).toHaveLength(1)
        expect(data[0].path).toBe('Hero.tsx')
    })

    it('correctly skips submodules and filters technical folders', async () => {
        mockGetRepo.mockResolvedValue({ data: { default_branch: 'main' } })

        mockGetTree.mockResolvedValue({
            data: {
                tree: [
                    { path: 'wedding-hall-landing', type: 'commit', sha: 'sha_submodule' },
                    { path: 'Hero.tsx', type: 'blob', sha: 'sha_hero' },
                    { path: 'node_modules/pkg/index.js', type: 'blob' },
                    { path: '.next/page.js', type: 'blob' },
                    { path: 'public/logo.png', type: 'blob' }
                ]
            }
        })

        mockGetContent.mockResolvedValue({ data: { content: Buffer.from('const x = 1').toString('base64') } })

        const req = new Request('http://localhost/api/scan/files', {
            method: 'POST',
            body: JSON.stringify({ repo_full_name: 'akshitkala/test' })
        })

        const res = await scanFilesPOST(req)
        const data = await res.json()

        expect(res.status).toBe(200)
        expect(data).toHaveLength(1)
        expect(data[0].path).toBe('Hero.tsx')
    })
})
