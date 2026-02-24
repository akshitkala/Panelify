import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://mock.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'mock-anon-key'
process.env.GOOGLE_GEMINI_API_KEY = 'mock-gemini-key'
process.env.GROQ_API_KEY = 'mock-groq-key'
