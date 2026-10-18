import { StorageService } from './storage.ts';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

function getApiKey(): string {
  const stored = StorageService.getGeminiApiKey();
  if (stored) return stored;
  try {
    return (import.meta as any).env?.VITE_GEMINI_API_KEY || '';
  } catch {
    return '';
  }
}

async function callGeminiDirect(
  apiKey: string,
  contents: any[],
  systemInstruction?: string,
  responseMimeType?: string
): Promise<string> {
  const body: any = { contents };
  if (systemInstruction) {
    body.systemInstruction = {
      parts: [{ text: systemInstruction }],
    };
  }
  if (responseMimeType) {
    body.generationConfig = {
      responseMimeType,
      temperature: 0.3,
    };
  }

  // Model cascade: try gemini-2.5-flash, then fallback to gemini-1.5-flash or gemini-2.0-flash
  const models = ['gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-2.0-flash'];
  let lastError: any = null;

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        const errMsg = errJson.error?.message || `API error (${res.status})`;
        if (errMsg.toLowerCase().includes('not found') || res.status === 404) {
          lastError = new Error(errMsg);
          continue;
        }
        throw new Error(errMsg);
      }

      const data = await res.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    } catch (err: any) {
      lastError = err;
      if (err.message?.toLowerCase().includes('not found')) {
        continue;
      }
      throw err;
    }
  }

  throw lastError || new Error('Failed to generate response from Gemini API');
}

export const GeminiService = {
  isConfigured(): boolean {
    return !!getApiKey();
  },

  async chat(prompt: string, history: ChatMessage[] = [], systemInstruction?: string): Promise<string> {
    const apiKey = getApiKey();
    if (apiKey) {
      const contents = history.map((item) => ({
        role: item.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: item.content }],
      }));
      contents.push({
        role: 'user',
        parts: [{ text: prompt }],
      });
      return await callGeminiDirect(
        apiKey,
        contents,
        systemInstruction ||
          'You are an insightful academic assistant and life operating system intelligence. Provide structured, accurate, and concise responses. If formulating notes, use clear Markdown headers, bullet points, and definitions.'
      );
    }

    // Fallback to local Express server if available
    try {
      const res = await fetch('/api/gemini/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, history, systemInstruction }),
      });
      if (res.ok) {
        const data = await res.json();
        return data.text || '';
      }
    } catch {
      // Local server not running or network error
    }

    throw new Error(
      'Gemini API Key is not set. Please enter your Gemini API key in AI Workspace or Settings (free key available at aistudio.google.com/app/apikey).'
    );
  },

  async summarize(content: string, format: 'cornell' | 'casebrief' | 'general' = 'cornell'): Promise<any> {
    let prompt = '';
    if (format === 'cornell') {
      prompt = `Convert the following lecture/meeting transcript or notes into Cornell Notes format.\nReturn strictly JSON with keys:\n- "title": string\n- "cues": array of strings (key questions, keywords, prompts)\n- "notes": string in Markdown (detailed notes organized with headings and bullet points)\n- "summary": string (brief synthesis of the main takeaways)\n- "actionItems": array of strings (actionable tasks or follow-ups)\n\nTranscript/Notes:\n${content}`;
    } else if (format === 'casebrief') {
      prompt = `Analyze the following legal text and produce a structured Case Brief in JSON format with keys:\n- "caseName": string\n- "citation": string\n- "facts": string\n- "legalIssues": string\n- "arguments": string\n- "applicableLaw": string\n- "judgment": string\n- "reasoning": string\n- "legalPrinciple": string\n\nText:\n${content}`;
    } else {
      prompt = `Provide a concise executive summary and list of action items for this text. Return strictly JSON with keys "summary" (string), "keyTakeaways" (array of strings), and "actionItems" (array of strings).\n\nText:\n${content}`;
    }

    const apiKey = getApiKey();
    if (apiKey) {
      const rawText = await callGeminiDirect(
        apiKey,
        [{ role: 'user', parts: [{ text: prompt }] }],
        'You are an expert summarizer. Return strictly valid JSON without Markdown blocks.',
        'application/json'
      );
      try {
        const clean = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(clean);
      } catch {
        return { summary: rawText };
      }
    }

    // Fallback to local server
    try {
      const res = await fetch('/api/gemini/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, format }),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {}

    throw new Error(
      'Gemini API Key is not set. Please enter your Gemini API key in Settings.'
    );
  },

  async generateQuiz(text: string, count: number = 5, type: 'flashcards' | 'quiz' = 'flashcards'): Promise<any[]> {
    const prompt =
      type === 'flashcards'
        ? `Generate ${count} high-yield flashcards from the following study material. Return strictly a JSON array of objects with keys: "front" (question, prompt, or term) and "back" (detailed answer, definition, or explanation). Do not add Markdown code blocks around the JSON.\n\nMaterial:\n${text}`
        : `Generate ${count} multiple-choice practice quiz questions from the following text. Return strictly a JSON array of objects with keys: "question", "options" (array of 4 strings), "correctIndex" (0-3 integer), and "explanation" (why the answer is correct). Do not add Markdown code blocks.\n\nMaterial:\n${text}`;

    const apiKey = getApiKey();
    if (apiKey) {
      const rawText = await callGeminiDirect(
        apiKey,
        [{ role: 'user', parts: [{ text: prompt }] }],
        'You are an expert academic evaluator. Return strictly a JSON array without Markdown blocks.',
        'application/json'
      );
      try {
        const clean = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(clean);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }

    // Fallback to local server
    try {
      const res = await fetch('/api/gemini/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, count, type }),
      });
      if (res.ok) {
        const data = await res.json();
        return data.items || [];
      }
    } catch {}

    throw new Error(
      'Gemini API Key is not set. Please enter your Gemini API key in Settings.'
    );
  },
};
