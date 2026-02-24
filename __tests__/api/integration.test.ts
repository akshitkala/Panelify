import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST as analyzePOST } from '@/app/api/scan/analyze/route'
import { POST as refactorPOST } from '@/app/api/setup/refactor/route'
import { POST as writePOST } from '@/app/api/content/write/route'
import { createClient } from '@/lib/supabase/server'
import { analyzeJSX } from '@/lib/ai'
import { refactorFiles } from '@/lib/refactor'
import { Octokit } from '@octokit/rest'

const { mockGetContent, mockCreateOrUpdate } = vi.hoisted(() => ({
    mockGetContent: vi.fn(),
    mockCreateOrUpdate: vi.fn()
}))

vi.mock('@octokit/rest', () => ({
    Octokit: vi.fn().mockImplementation(function () {
        return {
            repos: {
                getContent: mockGetContent,
                createOrUpdateFileContents: mockCreateOrUpdate
            }
        }
    })
}))

vi.mock('@/lib/supabase/server', () => ({
    createClient: vi.fn()
}))

vi.mock('@/lib/ai', () => ({
    analyzeJSX: vi.fn()
}))

vi.mock('@/lib/refactor', () => ({
    refactorFiles: vi.fn()
}))

describe('API Integration Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('/api/scan/analyze returns 401 if not authenticated', async () => {
        // @ts-ignore
        createClient.mockResolvedValue({
            auth: { getSession: vi.fn().mockResolvedValue({ data: { session: null } }) }
        })

        const req = new Request('http://localhost/api/scan/analyze', {
            method: 'POST',
            body: JSON.stringify({ files: [] })
        })

        const res = await analyzePOST(req)
        expect(res.status).toBe(401)
    })

    it('/api/scan/analyze returns 200 with results from AI', async () => {
        // @ts-ignore
        createClient.mockResolvedValue({
            auth: { getSession: vi.fn().mockResolvedValue({ data: { session: { user: {} } } }) }
        })

        // @ts-ignore
        analyzeJSX.mockResolvedValue([{ field_id: 'hero_text' }])

        const req = new Request('http://localhost/api/scan/analyze', {
            method: 'POST',
            body: JSON.stringify({ files: [] })
        })

        const res = await analyzePOST(req)
        const data = await res.json()

        expect(res.status).toBe(200)
        expect(data[0].field_id).toBe('hero_text')
    })

    it('/api/scan/analyze returns 502 on AI provider failure', async () => {
        // @ts-ignore
        createClient.mockResolvedValue({
            auth: { getSession: vi.fn().mockResolvedValue({ data: { session: { user: {} } } }) }
        })

        // @ts-ignore
        analyzeJSX.mockRejectedValue(new Error('AI failed'))

        const req = new Request('http://localhost/api/scan/analyze', {
            method: 'POST',
            body: JSON.stringify({ files: [] })
        })

        const res = await analyzePOST(req)
        const data = await res.json()

        expect(res.status).toBe(502)
        expect(data.error).toBe('AI_ERROR')
    })

    it('/api/setup/refactor returns 422 if Babel fails', async () => {
        // @ts-ignore
        createClient.mockResolvedValue({
            auth: { getSession: vi.fn().mockResolvedValue({ data: { session: { user: {} } } }) }
        })

        // @ts-ignore
        refactorFiles.mockRejectedValue(new Error('Syntax error'))

        const req = new Request('http://localhost/api/setup/refactor', {
            method: 'POST',
            body: JSON.stringify({ files: [], schema: {} })
        })

        const res = await refactorPOST(req)
        expect(res.status).toBe(422)
    })

    it('/api/content/write returns 409 on SHA conflict (GitHub)', async () => {
        // @ts-ignore
        createClient.mockResolvedValue({
            auth: { getSession: vi.fn().mockResolvedValue({ data: { session: { user: {}, provider_token: 'tok' } } }) }
        })

        const octokit = new Octokit()
        // @ts-ignore
        octokit.repos.getContent.mockResolvedValue({ data: { content: Buffer.from('{}').toString('base64'), sha: 'old' } })
        // @ts-ignore
        octokit.repos.createOrUpdateFileContents.mockRejectedValue({ status: 409 })

        const req = new Request('http://localhost/api/content/write', {
            method: 'POST',
            body: JSON.stringify({ repo_full_name: 'o/r', branch: 'm', changes: {} })
        })

        const res = await writePOST(req)
        expect(res.status).toBe(409)
    })
})
