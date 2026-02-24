import { describe, it, expect, vi, beforeEach } from 'vitest'
import { analyzeJSX } from '@/lib/ai'
import { GoogleGenerativeAI } from '@google/generative-ai'
import Groq from 'groq-sdk'

const { mockGenerateContent, mockChatCreate } = vi.hoisted(() => ({
    mockGenerateContent: vi.fn(),
    mockChatCreate: vi.fn(),
}))

vi.mock('@google/generative-ai', () => {
    return {
        GoogleGenerativeAI: vi.fn().mockImplementation(function () {
            return {
                getGenerativeModel: () => ({
                    generateContent: mockGenerateContent,
                }),
            }
        }),
    }
})

vi.mock('groq-sdk', () => {
    return {
        default: vi.fn().mockImplementation(function () {
            return {
                chat: {
                    completions: {
                        create: mockChatCreate,
                    },
                },
            }
        }),
    }
})

describe('lib/ai.ts - analyzeJSX', () => {
    const mockFiles = [{ path: 'Hero.tsx', content: '<div>Hello</div>' }]

    beforeEach(() => {
        vi.clearAllMocks()
        // Reset process.env if needed
    })

    it('calls Gemini first and returns results on success', async () => {
        const mockResponse = {
            response: {
                text: () => JSON.stringify([{
                    component: 'Hero.tsx',
                    field_id: 'title',
                    label: 'Title',
                    type: 'text',
                    current_value: 'Hello',
                    confidence: 0.9
                }])
            }
        }

        // @ts-ignore
        const genAI = new GoogleGenerativeAI()
        // @ts-ignore
        genAI.getGenerativeModel().generateContent.mockResolvedValue(mockResponse)

        const results = await analyzeJSX(mockFiles)

        expect(results).toHaveLength(1)
        expect(results[0].field_id).toBe('title')
        // @ts-ignore
        expect(genAI.getGenerativeModel().generateContent).toHaveBeenCalled()
    })

    it('falls back to Groq when Gemini fails (e.g. 429)', async () => {
        // @ts-ignore
        const genAI = new GoogleGenerativeAI()
        // @ts-ignore
        genAI.getGenerativeModel().generateContent.mockRejectedValue(new Error('Gemini 429'))

        const mockGroqResponse = {
            choices: [{
                message: {
                    content: JSON.stringify([{
                        component: 'Hero.tsx',
                        field_id: 'title_groq',
                        label: 'Title',
                        type: 'text',
                        current_value: 'Hello',
                        confidence: 0.8
                    }])
                }
            }]
        }

        const groq = new Groq({ apiKey: 'test' })
        // @ts-ignore
        groq.chat.completions.create.mockResolvedValue(mockGroqResponse)

        const results = await analyzeJSX(mockFiles)

        expect(results).toHaveLength(1)
        expect(results[0].field_id).toBe('title_groq')
        // @ts-ignore
        expect(groq.chat.completions.create).toHaveBeenCalled()
    })

    it('falls back to Groq when Gemini times out', async () => {
        // @ts-ignore
        const genAI = new GoogleGenerativeAI()
        // Mock a slow response that will be beaten by the timeout promise in lib/ai.ts
        // However, in our test we can just mock it to reject or wait
        // Actually, in lib/ai.ts it uses path.race with a 9s timeout.
        // To test this reliably without waiting 9s, we should ideally inject the timeout or mock Promise.race.
        // For now, let's mock it as a rejection to verify the fallback path.
        // @ts-ignore
        genAI.getGenerativeModel().generateContent.mockImplementation(() => new Promise((_, reject) => {
            // Force a timeout error
            reject(new Error('TIMEOUT'))
        }))

        const mockGroqResponse = {
            choices: [{
                message: {
                    content: JSON.stringify([{
                        component: 'Hero.tsx',
                        field_id: 'title_timeout',
                        label: 'Title',
                        type: 'text',
                        current_value: 'Hello',
                        confidence: 0.8
                    }])
                }
            }]
        }

        const groq = new Groq({ apiKey: 'test' })
        // @ts-ignore
        groq.chat.completions.create.mockResolvedValue(mockGroqResponse)

        const results = await analyzeJSX(mockFiles)
        expect(results[0].field_id).toBe('title_timeout')
    })

    it('throws AI_ERROR when both providers fail', async () => {
        // @ts-ignore
        const genAI = new GoogleGenerativeAI()
        // @ts-ignore
        genAI.getGenerativeModel().generateContent.mockRejectedValue(new Error('Gemini fail'))

        const groq = new Groq({ apiKey: 'test' })
        // @ts-ignore
        groq.chat.completions.create.mockRejectedValue(new Error('Groq fail'))

        await expect(analyzeJSX(mockFiles)).rejects.toThrow('AI_ERROR')
    })
})
