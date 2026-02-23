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

RULES:
- Do NOT identify technical strings (classNames, event handlers, route paths like '/login').
- Do NOT identify layout boilerplate (e.g. "Made with React").
- For each field, provide: component name, a unique field_id (snake_case), a human-readable label, type, current_value, and confidence score (0.0 to 1.0).
- Return ONLY a JSON array of AIField objects.
`;

export async function analyzeJSX(
    files: { path: string; content: string }[]
): Promise<AIField[]> {
    try {
        return await analyzeWithGemini(files);
    } catch (err) {
        console.warn('Gemini failed, falling back to Groq:', err);
        try {
            return await analyzeWithGroq(files);
        } catch (groqErr) {
            console.error('Both Gemini and Groq failed:', groqErr);
            throw new Error('AI_ERROR');
        }
    }
}

async function analyzeWithGemini(files: { path: string; content: string }[]): Promise<AIField[]> {
    const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        generationConfig: { responseMimeType: "application/json" }
    });

    const prompt = `${SYSTEM_PROMPT}\n\nFiles to analyze:\n${JSON.stringify(files)}`;

    const result = await Promise.race([
        model.generateContent(prompt),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), 9000))
    ]) as any;

    const response = await result.response;
    const text = response.text();
    return JSON.parse(text);
}

async function analyzeWithGroq(files: { path: string; content: string }[]): Promise<AIField[]> {
    const completion = await groq.chat.completions.create({
        messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: `Files to analyze:\n${JSON.stringify(files)}` }
        ],
        model: "llama-3.3-70b-versatile", // Closest versatile model in v1.1 spec
        response_format: { type: "json_object" }
    });

    const content = completion.choices[0].message.content;
    if (!content) throw new Error('EMPTY_GROQ_RESPONSE');
    const parsed = JSON.parse(content);
    return Array.isArray(parsed) ? parsed : (parsed.fields || []);
}
