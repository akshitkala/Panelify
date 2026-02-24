import { analyzeJSX } from '../lib/ai';

// Mocking process.env for the test
process.env.GOOGLE_GEMINI_API_KEY = 'invalid_key';
process.env.GROQ_API_KEY = 'mock_groq_key_or_test_key';

async function testFallback() {
    console.log('Testing Groq Fallback...');
    const mockFiles = [
        { path: 'Hero.tsx', content: '<div><h1>Hello World</h1><p>Buy now</p></div>' }
    ];

    try {
        const results = await analyzeJSX(mockFiles);
        console.log('Results:', JSON.stringify(results, null, 2));
        if (results.length > 0) {
            console.log('✅ Fallback successful!');
        } else {
            console.log('❌ Fallback failed: No results.');
        }
    } catch (error: any) {
        if (error.message === 'AI_ERROR') {
            console.log('✅ Fallback caught the error correctly after both failed.');
        } else {
            console.log('❌ Unexpected error during fallback:', error.message);
        }
    }
}

testFallback();
