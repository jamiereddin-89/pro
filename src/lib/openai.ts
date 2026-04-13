import OpenAI from 'openai';

export async function generateOpenAIStream(
  prompt: string,
  onChunk: (chunk: string) => void,
  model: string,
  apiKey: string,
  baseUrl?: string,
  systemInstruction?: string
) {
  const openai = new OpenAI({
    apiKey,
    baseURL: baseUrl || 'https://api.openai.com/v1',
    dangerouslyAllowBrowser: true
  });

  const stream = await openai.chat.completions.create({
    model: model || 'gpt-4o',
    messages: [
      { role: 'system', content: systemInstruction || 'You are an expert web developer.' },
      { role: 'user', content: prompt }
    ],
    stream: true,
  });

  let fullText = '';
  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content || '';
    fullText += content;
    onChunk(fullText);
  }

  return fullText;
}
