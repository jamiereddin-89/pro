import { GoogleGenAI, ThinkingLevel } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export enum ModelType {
  FLASH = "gemini-3-flash-preview",
  PRO = "gemini-3.1-pro-preview",
  LITE = "gemini-3.1-flash-lite-preview",
}

export interface ChatMessage {
  role: "user" | "model";
  content: string;
}

const MODERN_BEST_PRACTICES = `
MODERN BEST PRACTICES:
1. Use semantic HTML5 elements (header, main, section, footer, nav, article).
2. Use modern CSS (Flexbox, Grid) for layouts.
3. Prefer Tailwind CSS classes (via CDN) for styling to ensure maintainability.
4. Keep CSS and JS modular and well-commented.
5. Ensure accessibility (ARIA labels, proper contrast, logical heading hierarchy).
6. Use responsive design patterns (mobile-first).
7. Avoid inline styles where possible; use classes.
8. Use modern JS features (ES6+, async/await, arrow functions).
`;

export async function generateSite(
  prompt: string,
  modelType: ModelType = ModelType.FLASH,
  isThinking: boolean = false
) {
  const systemInstruction = `You are an expert front-end web developer. 
You ALWAYS return a single complete, valid HTML5 document with inline CSS (Tailwind via CDN is preferred) and vanilla JavaScript.
NEVER use markdown code fences. NEVER explain your code. 
Output ONLY the raw HTML starting with <!DOCTYPE html>.
Ensure the design is modern, responsive, and accessible.

${MODERN_BEST_PRACTICES}`;

  const response = await ai.models.generateContent({
    model: modelType,
    contents: `Generate a full website based on this description: ${prompt}`,
    config: {
      systemInstruction,
      temperature: 0.7,
      topP: 0.95,
      topK: 40,
      ...(isThinking && modelType === ModelType.PRO ? {
        thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH }
      } : {})
    },
  });

  return response.text || "";
}

export async function updateSite(
  currentHtml: string,
  instruction: string,
  modelType: ModelType = ModelType.FLASH,
  isThinking: boolean = false
) {
  const systemInstruction = `You are an expert front-end refactoring assistant.
The user will provide a full HTML document and a change request.
You MUST return the ENTIRE updated HTML document.
NEVER use markdown code fences. NEVER explain your changes.
Output ONLY the raw HTML.
Preserve all existing functionality unless explicitly asked to change it.
Refactor the code to follow modern best practices if it doesn't already.

${MODERN_BEST_PRACTICES}`;

  const prompt = `CURRENT HTML:
${currentHtml}

CHANGE REQUEST:
${instruction}

Return the full updated HTML:`;

  const response = await ai.models.generateContent({
    model: modelType,
    contents: prompt,
    config: {
      systemInstruction,
      temperature: 0.4,
      ...(isThinking && modelType === ModelType.PRO ? {
        thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH }
      } : {})
    },
  });

  return response.text || "";
}

export async function generateComponent(
  prompt: string,
  modelType: ModelType = ModelType.FLASH,
  isThinking: boolean = false
) {
  const systemInstruction = `You are an expert front-end component developer.
Generate a specific UI component (e.g., a button, card, form, navigation bar) based on the description.
The output should be a standalone HTML snippet with necessary CSS (Tailwind via CDN) and JS.
NEVER use markdown code fences. NEVER explain your code.
Output ONLY the raw HTML/CSS/JS.
Ensure the component is modular, accessible, and follows modern best practices.

${MODERN_BEST_PRACTICES}`;

  const response = await ai.models.generateContent({
    model: modelType,
    contents: `Generate a UI component based on this description: ${prompt}`,
    config: {
      systemInstruction,
      temperature: 0.7,
      ...(isThinking && modelType === ModelType.PRO ? {
        thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH }
      } : {})
    },
  });

  return response.text || "";
}
