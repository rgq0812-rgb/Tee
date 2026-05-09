import { VercelRequest, VercelResponse } from '@vercel/node';
import { genAI } from '../_lib/db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  try {
    const { model, history, message, systemInstruction, tools, config } = req.body;
    
    const finalSystemInstruction = systemInstruction || (config && config.systemInstruction);

    const aiModel = (genAI.getGenerativeModel as any)({ 
      model: model || "gemini-3-flash-preview",
      systemInstruction: finalSystemInstruction
    });
    
    const chat = aiModel.startChat({
      history,
      tools,
      generationConfig: config
    });
    
    const result = await chat.sendMessage(message);
    const response = await result.response;
    
    res.status(200).json({ 
      text: response.text(), 
      functionCalls: response.functionCalls ? response.functionCalls() : [] 
    });
  } catch (err: any) {
    console.error('[AI CHAT ERROR]', err);
    res.status(500).json({ error: err.message });
  }
}
