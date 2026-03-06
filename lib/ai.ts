import { GoogleGenerativeAI } from '@google/generative-ai';
import Groq from 'groq-sdk';

export interface AIField {
    component: string;
    field_id: string;
    label: string;
    type: 'text' | 'textarea' | 'image';
    current_value: string;
    confidence: number;
}

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM_PROMPT = `
  You are a React component scanner for Panelify.
  Analyze JSX/TSX/JS code and identify ALL hardcoded 
  content strings that a site owner would want to edit.

  INCLUDE:
  - All visible text: headings, paragraphs, buttons, 
    labels, badges, navigation items, footer text
  - Image src paths (not external URLs starting with http)
  - Alt text for images
  - Any string that appears as visible content on the page

  EXCLUDE:
  - CSS class names and Tailwind classes
  - Event handler strings
  - Route paths (/login, /dashboard etc)
  - External URLs (http:// or https://)
  - Technical attributes (id, name, type, method)
  - Template literals with variables
  - Dynamic expressions {props.x} {data.x}
  - Single characters or strings under 2 chars
  - SVG path data (M13 10V3L4...)
  - Aria labels that are purely technical

  For each field return:
  - component: component function name
  - field_id: snake_case unique identifier
  - label: human readable label
  - type: text | textarea | image
  - current_value: exact string as it appears in code
  - confidence: 0.0 to 1.0

  Return ONLY a valid JSON array. No markdown. No explanation.
  Every visible text string on the page must be included.
`;

export async function analyzeJSX(
    files: { path: string; content: string }[]
): Promise<AIField[]> {
    try {
        const results = await analyzeWithGemini(files);
        console.log('✓ Gemini succeeded, fields:', results.length);
        return mapResults(results, files);
    } catch (err: any) {
        console.error('✗ Gemini failed')
        console.error('  message:', err.message)
        console.error('  status:', err.status ?? 'no status')
        console.error('  code:', err.code ?? 'no code')
        console.error('  errorDetails:', JSON.stringify(err.errorDetails ?? {}))
        console.error('  stack:', err.stack?.split('\n')[0])

        try {
            const results = await analyzeWithGroq(files);
            console.log('✓ Groq succeeded, fields:', results.length);
            return mapResults(results, files);
        } catch (groqErr: any) {
            console.error('✗ Groq failed')
            console.error('  message:', groqErr.message)
            console.error('  status:', groqErr.status ?? 'no status')
            console.error('  code:', groqErr.code ?? 'no code')
            console.error('  stack:', groqErr.stack?.split('\n')[0])
            throw new Error('AI_ERROR');
        }
    }
}

function mapResults(results: AIField[], files: { path: string; content: string }[]): AIField[] {
    return results.map(field => {
        // Ensure component name exists, fallback to filename if missing
        if (!field.component) {
            const matchingFile = files.find(f => f.content.includes(field.current_value));
            if (matchingFile) {
                // Manually handle path splitting to avoid node:path dependency
                const parts = matchingFile.path.split(/[\\/]/);
                const basename = parts.pop() || 'Component';
                field.component = basename.replace(/\.(tsx|jsx|js|ts)$/, '');
            } else {
                field.component = 'Unknown';
            }
        }
        return field;
    });
}

async function analyzeWithGemini(files: { path: string; content: string }[]): Promise<AIField[]> {
    const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        generationConfig: {
            responseMimeType: "application/json",
            temperature: 0
        }
    });

    const prompt = `${SYSTEM_PROMPT}\n\nFiles to analyze:\n${JSON.stringify(files)}`;

    const result = await Promise.race([
        model.generateContent(prompt),
        new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('TIMEOUT')), 25000)
        )
    ]) as any;

    // result IS the GenerateContentResponse — do not call .response on it
    const text = result.response.text();

    console.log('Gemini raw response length:', text.length);

    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : (parsed.fields || []);
}
async function analyzeWithGroq(files: { path: string; content: string }[]): Promise<AIField[]> {
    const completion = await groq.chat.completions.create({
        messages: [
            {
                role: "system",
                content: SYSTEM_PROMPT + "\nIMPORTANT: Return a JSON object with a 'fields' key containing the array."
            },
            {
                role: "user",
                content: `Files to analyze:\n${JSON.stringify(files)}`
            }
        ],
        model: "llama-3.3-70b-versatile",
        response_format: { type: "json_object" },
        temperature: 0
    });

    const content = completion.choices[0].message.content;
    if (!content) throw new Error('EMPTY_GROQ_RESPONSE');

    console.log('Groq raw response length:', content.length);

    const parsed = JSON.parse(content);
    return Array.isArray(parsed) ? parsed : (parsed.fields || []);
}
