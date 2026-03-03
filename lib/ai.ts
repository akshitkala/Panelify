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
You are a React component scanner for Panelify, a CMS that makes hardcoded websites editable.
Your task is to analyze JSX/TSX code and identify content literals that should be editable by a site owner.

Editable types:
1. 'text': Short strings (titles, buttons, single words).
2. 'textarea': Longer descriptive text (paragraphs, about sections).
3. 'image': Image paths usually in 'src' attributes (e.g., /images/hero.jpg).

RULES (IMPORTANT):
- Do NOT identify technical strings (classNames, event handlers, route paths like '/login').
- Do NOT identify layout boilerplate (e.g. "Made with React").
- Do NOT identify dynamic values like {props.title}, {data.name}, or backtick template literals with variables.
- Strings must be at least 3 characters long to be considered.
- For each field, provide: component (the name of the component), a unique field_id (snake_case), a human-readable label, type, current_value, and confidence score (0.0 to 1.0).
- The "component" property is REQUIRED and must match the component name found in the file.
- Return ONLY a JSON array of AIField objects.
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
            setTimeout(() => reject(new Error('TIMEOUT')), 15000)
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
