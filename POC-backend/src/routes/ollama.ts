// routes/ollama.ts
import { Router } from 'express';
import ollama from 'ollama';

const router = Router();

router.post('/chat', async (req, res) => {
  try {
    console.log('🔥 Ollama route hit');
    const { content, model } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Message content is required' });
    }

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const response = await ollama.chat({
      model: 'Jarvis',
      messages: [{ role: 'user', content }],
    });
    res.json(response)

    // for await (const part of response) {
    //   if (part.message?.content) {
    //     res.write(JSON.stringify({ content: part.message.content }) + '\n');
    //   }
    // }

    res.end();
  } catch (err) {
    console.error('❌ Error in /chat:', err);
    res.status(500).json({ error: 'Failed to stream response from Ollama' });
  }
});

export default router;
