import { describe, it, expect, vi } from 'vitest'
import { detectPlatform } from '@/lib/platform'
import { Octokit } from '@octokit/rest'

const mockListDeployments = vi.hoisted(() => vi.fn())

vi.mock('@octokit/rest', () => ({
    Octokit: vi.fn().mockImplementation(function () {
        return {
            repos: {
                listDeployments: mockListDeployments
            }
        }
    })
}))

describe('lib/platform.ts - detectPlatform', () => {
    it('returns "vercel" if vercel.json is in file list', async () => {
        const result = await detectPlatform(['vercel.json', 'package.json'], 'owner/repo', 'token')
        expect(result).toBe('vercel')
    })

    it('returns "netlify" if netlify.toml is in file list', async () => {
        const result = await detectPlatform(['netlify.toml'], 'owner/repo', 'token')
        expect(result).toBe('netlify')
    })

    it('returns "vercel" if GitHub deployments mention Vercel', async () => {
        const octokit = new Octokit()
        // @ts-ignore
        octokit.repos.listDeployments.mockResolvedValue({
            data: [{ environment: 'Production – Vercel' }]
        })

        const result = await detectPlatform(['package.json'], 'owner/repo', 'token')
        expect(result).toBe('vercel')
    })

    it('returns "unknown" if no signals matched', async () => {
        const octokit = new Octokit()
        // @ts-ignore
        octokit.repos.listDeployments.mockResolvedValue({ data: [] })

        const result = await detectPlatform(['package.json'], 'owner/repo', 'token')
        expect(result).toBe('unknown')
    })
})
