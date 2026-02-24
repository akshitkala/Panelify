import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { pollForDeploy } from '@/lib/deploy-poll'

describe('lib/deploy-poll.ts - pollForDeploy', () => {
    beforeEach(() => {
        vi.useFakeTimers()
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    it('returns "live" when expectedValue is found in response', async () => {
        const mockResponse = {
            text: vi.fn().mockResolvedValue('<html><body>Live Content</body></html>')
        }
        global.fetch = vi.fn().mockResolvedValue(mockResponse)

        const pollPromise = pollForDeploy('https://site.com', 'Live Content', 5, 100)

        // Fast-forward
        await vi.runAllTimersAsync()

        const result = await pollPromise
        expect(result).toBe('live')
        expect(global.fetch).toHaveBeenCalled()
    })

    it('returns "timeout" after max attempts', async () => {
        global.fetch = vi.fn().mockResolvedValue({
            text: vi.fn().mockResolvedValue('<html>Updating...</html>')
        })

        const pollPromise = pollForDeploy('https://site.com', 'Live Content', 3, 100)

        // Fast-forward (3 attempts)
        await vi.runAllTimersAsync()

        const result = await pollPromise
        expect(result).toBe('timeout')
        expect(global.fetch).toHaveBeenCalledTimes(3)
    })

    it('waits for the specified interval between attempts', async () => {
        global.fetch = vi.fn().mockResolvedValue({
            text: vi.fn().mockResolvedValue('<html>Updating...</html>')
        })

        const pollPromise = pollForDeploy('https://site.com', 'Live Content', 2, 5000)

        // First attempt happens immediately
        await vi.advanceTimersByTimeAsync(0)
        expect(global.fetch).toHaveBeenCalledTimes(1)

        // Second attempt should not have happened yet
        await vi.advanceTimersByTimeAsync(3000)
        expect(global.fetch).toHaveBeenCalledTimes(1)

        // Advance past interval
        await vi.advanceTimersByTimeAsync(2001)
        expect(global.fetch).toHaveBeenCalledTimes(2)
    })
})
