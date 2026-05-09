import { VercelRequest, VercelResponse } from '@vercel/node';
import { genAI } from '../_lib/db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  try {
    const { model, contents, config } = req.body;
    const aiModel = genAI.getGenerativeModel({ model: model || "gemini-3-flash-preview" });
    
    const result = await aiModel.generateContent({
      contents,
      generationConfig: config
    });
    
    const response = await result.response;
    res.status(200).json({ text: response.text(), candidates: response.candidates });
  } catch (err: any) {
    console.error('[AI ERROR]', err);
    res.status(500).json({ error: err.message });
  }
}
