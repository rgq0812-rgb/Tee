import { VercelRequest, VercelResponse } from '@vercel/node';
import { genAI } from '../_lib/db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  try {
    const { model, contents, config, systemInstruction } = req.body;
    
    // Support systemInstruction inside config or at top level
    const finalSystemInstruction = systemInstruction || (config && config.systemInstruction);
    
    const aiModel = (genAI.getGenerativeModel as any)({ 
      model: model || "gemini-3-flash-preview",
      systemInstruction: finalSystemInstruction
    });
    
    // Clean config if it contained systemInstruction (Gemini SDK doesn't like it there)
    const finalConfig = { ...config };
    if (finalConfig.systemInstruction) delete finalConfig.systemInstruction;
    
    const result = await aiModel.generateContent({
      contents,
      generationConfig: finalConfig
    });
    
    const response = await result.response;
    res.status(200).json({ text: response.text(), candidates: response.candidates });
  } catch (err: any) {
    console.error('[AI ERROR]', err);
    res.status(500).json({ error: err.message });
  }
}
