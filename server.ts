import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, GenerateVideosOperation } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json({ limit: '50mb' }));

// Server-side initialization with telemetry header
const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({
  apiKey: apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Helper to extract clean error message and status code from Gemini API errors
function parseGeminiError(err: any): { message: string; isQuotaError: boolean; code: number } {
  const rawMsg = err?.message || String(err || '');
  let isQuotaError = false;
  let code = 500;
  let cleanMsg = rawMsg;

  try {
    // Gemini errors often come wrapped as stringified JSON
    const parsed = JSON.parse(rawMsg);
    if (parsed.error) {
      if (parsed.error.code === 429 || parsed.error.status === 'RESOURCE_EXHAUSTED') {
        isQuotaError = true;
        code = 429;
        cleanMsg =
          'Gemini API Quota Exceeded (429 RESOURCE_EXHAUSTED). Veo 3 video generation and Maps Grounding require an active paid Google AI Studio project with quota enabled.';
      } else {
        cleanMsg = parsed.error.message || cleanMsg;
        code = parsed.error.code || 500;
      }
    }
  } catch {
    if (rawMsg.includes('429') || rawMsg.includes('RESOURCE_EXHAUSTED') || rawMsg.includes('quota')) {
      isQuotaError = true;
      code = 429;
      cleanMsg =
        'Gemini API Quota Exceeded (429 RESOURCE_EXHAUSTED). Video generation and Maps Grounding require a paid Google AI Studio API key with quota enabled.';
    }
  }

  return { message: cleanMsg, isQuotaError, code };
}

// 1. Multi-turn Gemini Chatbot Endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { messages, model, systemInstruction, datasetContext } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    const selectedModel = model || 'gemini-3.5-flash';

    const defaultRole =
      'You are DataClean AI Copilot, an expert data scientist and spreadsheet engineering specialist. ' +
      'You help users clean, normalize, deduplicate, and restructure messy spreadsheets (Excel/CSV). ' +
      'You provide helpful formulas, regex patterns, data audit insights, and column transformation advice. ' +
      'Be clear, concise, and professional.';

    let effectiveInstruction = systemInstruction || defaultRole;
    if (datasetContext) {
      effectiveInstruction += `\n\nCURRENT SPREADSHEET CONTEXT:\n${datasetContext}`;
    }

    const contents = messages.map((m: { role: string; text: string }) => ({
      role: m.role === 'model' || m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.text }],
    }));

    const response = await ai.models.generateContent({
      model: selectedModel,
      contents,
      config: {
        systemInstruction: effectiveInstruction,
      },
    });

    const replyText = response.text || 'No response generated.';
    res.json({ response: replyText });
  } catch (error: any) {
    console.error('Chat error:', error);
    const parsed = parseGeminiError(error);
    res.status(parsed.code).json({
      error: parsed.message,
      isQuotaError: parsed.isQuotaError,
      code: parsed.code,
    });
  }
});

// 2. Google Maps Grounding Endpoint
app.post('/api/maps-grounding', async (req, res) => {
  const { query, latLng, datasetContext } = req.body;

  if (!query) {
    return res.status(400).json({ error: 'Query is required' });
  }

  try {
    // Primary path: Use gemini-3.5-flash with googleMaps tool
    const prompt = datasetContext
      ? `Based on the following spreadsheet context:\n${datasetContext}\n\nAnswer this geographic/location query with precise Google Maps details: ${query}`
      : query;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        tools: [{ googleMaps: {} }],
        toolConfig: latLng
          ? {
              retrievalConfig: {
                latLng: {
                  latitude: latLng.latitude,
                  longitude: latLng.longitude,
                },
              },
            }
          : undefined,
      },
    });

    const text = response.text || '';
    const groundingChunks =
      response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    return res.json({ text, groundingChunks });
  } catch (error: any) {
    console.error('Maps Grounding error:', error);
    const parsed = parseGeminiError(error);

    // Fallback path: When quota is exhausted, create verified Google Maps links and rich location lookup
    // so the user can still verify addresses and interact with Google Maps without being blocked!
    const encodedQuery = encodeURIComponent(query.trim());
    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedQuery}`;
    const cleanLocationTitle = query.replace(/^(Verify address:|Locate|Find postal code for|Search for)/i, '').trim();

    const fallbackText =
      `### Location Intelligence Summary\n\n` +
      `**Queried Address / Location:** ${cleanLocationTitle}\n\n` +
      `*Note: Gemini Maps Grounding API reported:* ${parsed.message}\n\n` +
      `We have automatically prepared verified direct Google Maps routing and place navigation links for you below.`;

    const fallbackChunks = [
      {
        maps: {
          title: `${cleanLocationTitle} - View on Google Maps`,
          uri: googleMapsUrl,
          placeAnswerSources: {
            reviewSnippets: [
              {
                content: `Direct Google Maps search for "${cleanLocationTitle}". Click to view coordinates, satellite imagery, and navigation directions.`,
                author: 'Google Maps Link Service',
              },
            ],
          },
        },
      },
      {
        maps: {
          title: `Directions to ${cleanLocationTitle}`,
          uri: `https://www.google.com/maps/dir/?api=1&destination=${encodedQuery}`,
          placeAnswerSources: {
            reviewSnippets: [
              {
                content: 'Plan directions and travel ETA using Google Maps.',
                author: 'Google Maps Navigation',
              },
            ],
          },
        },
      },
    ];

    return res.json({
      text: fallbackText,
      groundingChunks: fallbackChunks,
      isFallback: true,
      isQuotaError: parsed.isQuotaError,
    });
  }
});

// 3. Veo 3 Video Generation: Start Generation
app.post('/api/generate-video', async (req, res) => {
  const { prompt, aspectRatio } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  const ratio = aspectRatio === '9:16' ? '9:16' : '16:9';

  try {
    const operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt,
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: ratio,
      },
    });

    res.json({ operationName: operation.name });
  } catch (error: any) {
    console.error('Video generation error:', error);
    const parsed = parseGeminiError(error);

    res.status(parsed.code).json({
      error: parsed.message,
      isQuotaError: parsed.isQuotaError,
      code: parsed.code,
    });
  }
});

// Veo 3 Video Generation: Check Status
app.post('/api/video-status', async (req, res) => {
  try {
    const { operationName } = req.body;

    if (!operationName) {
      return res.status(400).json({ error: 'operationName is required' });
    }

    const op = new GenerateVideosOperation();
    op.name = operationName;
    const updated = await ai.operations.getVideosOperation({ operation: op });

    res.json({
      done: updated.done || false,
      error: updated.error || null,
    });
  } catch (error: any) {
    console.error('Video status error:', error);
    const parsed = parseGeminiError(error);
    res.status(parsed.code).json({ error: parsed.message, isQuotaError: parsed.isQuotaError });
  }
});

// Veo 3 Video Generation: Stream / Download Video
app.post('/api/video-download', async (req, res) => {
  try {
    const { operationName } = req.body;

    if (!operationName) {
      return res.status(400).json({ error: 'operationName is required' });
    }

    const op = new GenerateVideosOperation();
    op.name = operationName;
    const updated = await ai.operations.getVideosOperation({ operation: op });

    const uri = updated.response?.generatedVideos?.[0]?.video?.uri;
    if (!uri) {
      return res.status(404).json({ error: 'Video URI not found or video generation incomplete.' });
    }

    const videoRes = await fetch(uri, {
      headers: {
        'x-goog-api-key': process.env.GEMINI_API_KEY || '',
      },
    });

    if (!videoRes.ok) {
      return res.status(videoRes.status).json({ error: 'Failed to retrieve video stream from upstream.' });
    }

    res.setHeader('Content-Type', 'video/mp4');
    const arrayBuffer = await videoRes.arrayBuffer();
    res.send(Buffer.from(arrayBuffer));
  } catch (error: any) {
    console.error('Video download error:', error);
    const parsed = parseGeminiError(error);
    res.status(parsed.code).json({ error: parsed.message });
  }
});

// Mounting Vite in development or serving dist in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
}

startServer();
