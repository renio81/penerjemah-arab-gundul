import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

const app = express();
const PORT = 3000;

// Increase limit to accommodate base64 image/pdf payloads
app.use(express.json({ limit: '20mb' }));

let aiClient: GoogleGenAI | null = null;
function getAi() {
  if (!aiClient) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not set');
    }
    aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return aiClient;
}

app.post('/api/translate', async (req, res) => {
  try {
    const { text, file } = req.body;
    const ai = getAi();

    const prompt = `Anda adalah ahli bahasa Arab. Tugas Anda adalah menerjemahkan teks bahasa Arab gundul (tanpa harakat) ke dalam bahasa Indonesia secara akurat. 
Jika teks terlalu panjang, pecah dengan baik, dan berikan terjemahan yang jelas. Jika input berupa gambar atau dokumen, pertama-tama ekstrak/baca teks bahasa arab di dalamnya, lalu berikan terjemahannya. Berikan hasil terjemahan langsung ke bahasa Indonesia dan opsi transliterasi (tulisan latin) jika dirasa berguna.`;

    let content: any[] = [prompt];

    if (text) {
      content.push(text);
    }

    if (file) {
      // file.data is expected to be base64 encoded
      content.push({
        inlineData: {
          mimeType: file.mimeType,
          data: file.data
        }
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: content,
    });

    res.json({ result: response.text });
  } catch (error: any) {
    console.error('Translation error:', error);
    res.status(500).json({ error: error.message || 'Error occurred during translation.' });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
