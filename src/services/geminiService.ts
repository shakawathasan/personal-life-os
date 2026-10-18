export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export const GeminiService = {
  async chat(prompt: string, history: ChatMessage[] = [], systemInstruction?: string): Promise<string> {
    try {
      const res = await fetch('/api/gemini/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, history, systemInstruction }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Server responded with ${res.status}`);
      }
      const data = await res.json();
      return data.text || '';
    } catch (err: any) {
      console.error('Gemini chat error:', err);
      throw err;
    }
  },

  async summarize(content: string, format: 'cornell' | 'casebrief' | 'general' = 'cornell'): Promise<any> {
    try {
      const res = await fetch('/api/gemini/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, format }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Server error: ${res.status}`);
      }
      return await res.json();
    } catch (err: any) {
      console.error('Gemini summarize error:', err);
      throw err;
    }
  },

  async generateQuiz(text: string, count: number = 5, type: 'flashcards' | 'quiz' = 'flashcards'): Promise<any[]> {
    try {
      const res = await fetch('/api/gemini/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, count, type }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Server error: ${res.status}`);
      }
      const data = await res.json();
      return data.items || [];
    } catch (err: any) {
      console.error('Gemini quiz error:', err);
      throw err;
    }
  }
};
