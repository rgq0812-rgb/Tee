import { VercelRequest, VercelResponse } from '@vercel/node';
import { genAI } from '../_lib/db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  try {
    const { model, history, message, systemInstruction, tools } = req.body;
    const aiModel = genAI.getGenerativeModel({ 
      model: model || "gemini-3-flash-preview",
      systemInstruction
    });
    
    const chat = aiModel.startChat({
      history,
      tools
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
