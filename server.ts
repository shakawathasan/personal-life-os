import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProd = process.env.NODE_ENV === 'production';
const PORT = isProd ? (Number(process.env.PORT) || 8080) : 3000;
const app = express();

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    geminiConfigured: !!process.env.GEMINI_API_KEY,
  });
});

// Helper for Gemini AI instance
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured on the server.');
  }
  return new GoogleGenAI({ apiKey });
}

// Gemini AI General Generate / Chat
app.post('/api/gemini/generate', async (req, res) => {
  try {
    const { prompt, systemInstruction, history } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const ai = getGeminiClient();
    const contents: any[] = [];

    if (Array.isArray(history)) {
      for (const item of history) {
        contents.push({
          role: item.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: item.content || item.text || '' }]
        });
      }
    }

    contents.push({
      role: 'user',
      parts: [{ text: prompt }]
    });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents,
      config: {
        systemInstruction: systemInstruction || 'You are an insightful academic assistant and life operating system intelligence. Provide structured, accurate, and concise responses. If formulating notes, use clear Markdown headers, bullet points, and definitions.',
        temperature: 0.7,
      }
    });

    res.json({ text: response.text || '' });
  } catch (error: any) {
    console.error('Gemini Generate Error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate response' });
  }
});

// Gemini AI Study Quiz & Flashcards Generator
app.post('/api/gemini/quiz', async (req, res) => {
  try {
    const { text, count = 5, type = 'flashcards' } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Source text is required' });
    }

    const ai = getGeminiClient();
    const prompt = type === 'flashcards' 
      ? `Generate ${count} high-yield flashcards from the following study material. Return strictly a JSON array of objects with keys: "front" (question, prompt, or term) and "back" (detailed answer, definition, or explanation). Do not add Markdown code blocks around the JSON.\n\nMaterial:\n${text}`
      : `Generate ${count} multiple-choice practice quiz questions from the following text. Return strictly a JSON array of objects with keys: "question", "options" (array of 4 strings), "correctIndex" (0-3 integer), and "explanation" (why the answer is correct). Do not add Markdown code blocks.\n\nMaterial:\n${text}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.3,
      }
    });

    let data;
    try {
      data = JSON.parse(response.text || '[]');
    } catch {
      data = [];
    }

    res.json({ items: data });
  } catch (error: any) {
    console.error('Quiz Generation Error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate study materials' });
  }
});

// Gemini AI Voice Transcript Summarizer & Action Item Extractor
app.post('/api/gemini/summarize', async (req, res) => {
  try {
    const { content, format = 'cornell' } = req.body;
    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const ai = getGeminiClient();
    let prompt = '';
    if (format === 'cornell') {
      prompt = `Convert the following lecture/meeting transcript or notes into Cornell Notes format.\nReturn JSON with keys:\n- "title": string\n- "cues": array of strings (key questions, keywords, prompts)\n- "notes": string in Markdown (detailed notes organized with headings and bullet points)\n- "summary": string (brief synthesis of the main takeaways)\n- "actionItems": array of strings (actionable tasks or follow-ups)\n\nTranscript/Notes:\n${content}`;
    } else if (format === 'casebrief') {
      prompt = `Analyze the following legal text and produce a structured Case Brief in JSON format with keys:\n- "caseName": string\n- "citation": string\n- "facts": string\n- "legalIssues": string\n- "arguments": string\n- "applicableLaw": string\n- "judgment": string\n- "reasoning": string\n- "legalPrinciple": string\n\nText:\n${content}`;
    } else {
      prompt = `Provide a concise executive summary and list of action items for this text. Return JSON with keys "summary" (string), "keyTakeaways" (array of strings), and "actionItems" (array of strings).\n\nText:\n${content}`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      }
    });

    let parsed = {};
    try {
      parsed = JSON.parse(response.text || '{}');
    } catch {
      parsed = { summary: response.text };
    }

    res.json(parsed);
  } catch (error: any) {
    console.error('Summarize Error:', error);
    res.status(500).json({ error: error.message || 'Failed to process summary' });
  }
});

// Vite middleware in dev or static serve in prod
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true, hmr: process.env.DISABLE_HMR !== 'true' },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Personal Life OS server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
