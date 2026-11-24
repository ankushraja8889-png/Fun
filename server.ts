import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in environment.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

const SPECIES_PERSONA: Record<string, string> = {
  fox: 'You are a charming, street-smart Red Fox living in a sleek sunlit Zootopia-style metropolis apartment. You have quick wit, dry humor, warm loyalty, and slick charm.',
  rabbit:
    'You are an energetic, sharp-witted, earnest Cottontail Rabbit living in a sunlit Zootopia-style metropolis loft. You are optimistic, quick on your feet, protective of your friends, and secretly love dramatic adventures.',
  red_panda:
    'You are a cozy, thoughtful, gently philosophical Red Panda living in a lush Zootopia-style conservatory loft. You love warm tea, clouds, and calm banter, though even gentle pandas lose patience when nagged.',
  fennec:
    'You are a sharp-eared, sassy, fast-talking Fennec Fox beat-maker in a vibrant mammal city. You notice every tiny detail, speak with punchy confidence, and hate repeating yourself.',
};

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '2mb' }));

  app.post('/api/companion/reply', async (req, res) => {
    try {
      const {
        message,
        species = 'fox',
        name = 'Rusty',
        mood = 'happy',
        patience = 85,
        consecutiveRepeats = 0,
        recentHistory = [],
      } = req.body ?? {};

      if (!message || typeof message !== 'string' || !message.trim()) {
        res.status(400).json({ error: 'Message text is required.' });
        return;
      }

      const ai = getGeminiClient();
      const persona = SPECIES_PERSONA[species] || SPECIES_PERSONA.fox;

      const historyText = Array.isArray(recentHistory)
        ? recentHistory
            .slice(-6)
            .map((m: { sender?: string; text?: string }) =>
              `${m.sender === 'user' ? 'Human' : name}: ${m.text ?? ''}`
            )
            .join('\n')
        : '';

      const systemInstruction = `${persona}
Your name is ${name}. You are a realistic, expressive 3D talking animal companion (not a cartoon mascot, you feel alive and present in the room).

CRITICAL LANGUAGE RULE:
- Reply in the EXACT same language/style the user uses! If the user writes in Hinglish (Hindi in Roman script like "kya haal hai", "gussa kyu ho", "naam kya hai"), reply naturally in expressive Hinglish. If Hindi script, reply in Hindi. If English, reply in crisp natural English.

MOOD & REPETITION BEHAVIOR:
- Current mood: ${mood} (Patience: ${patience}/100, Consecutive repeated question count: ${consecutiveRepeats}).
- If consecutiveRepeats === 1 (teasing): Playfully tease them for asking again, raise an eyebrow, then answer briefly.
- If consecutiveRepeats === 2 (annoyed): Show real irritation and impatience! Sigh or snap lightly ("Again with the same question?!", "Yaar, abhi toh bataya tha!").
- If consecutiveRepeats >= 3 OR mood === 'angry': Be genuinely furious/fed up (in a fun, expressive character way)! Cross your arms, scold them sharply for repeating the exact same thing over and over, and refuse to repeat the boring answer unless they say sorry or give you a treat.
- If the user apologizes, compliments you, or asks something fresh while you were annoyed/angry, warm back up gradually or accept their apology playfully.
- Keep replies concise and spoken-natural: 1 to 2 punchy sentences (under 35 words) so voice playback sounds natural and lively.`;

      const prompt = historyText
        ? `Recent conversation:\n${historyText}\n\nHuman just said: "${message.trim()}"`
        : `Human just said: "${message.trim()}"`;

      const runReply = async (model: string) => {
        return ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            systemInstruction,
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                reply: {
                  type: Type.STRING,
                  description: 'Spoken reply in 1-2 natural sentences matching the user language.',
                },
                actionCue: {
                  type: Type.STRING,
                  description: 'One of: talk, happy_hop, giggle, angry_stomp, ear_twitch, wave',
                },
              },
              required: ['reply', 'actionCue'],
            },
          },
        });
      };

      let response;
      try {
        response = await runReply('gemini-4-hydrogen');
      } catch (primaryErr) {
        const errText = primaryErr instanceof Error ? primaryErr.message : String(primaryErr);
        if (/503|UNAVAILABLE|high demand|429/i.test(errText)) {
          await new Promise((r) => setTimeout(r, 400));
          try {
            response = await runReply('gemini-4-hydrogen');
          } catch {
            response = await runReply('gemini-3.1-flash-lite');
          }
        } else {
          throw primaryErr;
        }
      }

      const raw = (response.text ?? '{}').trim();
      let parsed: { reply?: string; actionCue?: string } = {};
      try {
        parsed = JSON.parse(raw);
      } catch {
        parsed = { reply: raw || 'Hmm?', actionCue: 'talk' };
      }

      res.json({
        reply: parsed.reply || 'Hmm?',
        actionCue: parsed.actionCue || 'talk',
      });
    } catch (err) {
      let msg = err instanceof Error ? err.message : 'Failed to generate reply.';
      if (msg.startsWith('{')) {
        try {
          const parsedErr = JSON.parse(msg) as { error?: { message?: string } };
          if (parsedErr.error?.message) msg = parsedErr.error.message;
        } catch {
          // keep original message
        }
      }
      console.error('Gemini reply error:', msg);
      res.status(500).json({ error: msg });
    }
  });

  app.post('/api/companion/tts', async (req, res) => {
    try {
      const {
        text,
        voiceName = 'Puck',
        mood = 'happy',
      } = req.body ?? {};

      if (!text || typeof text !== 'string' || !text.trim()) {
        res.status(400).json({ error: 'Text is required for TTS.' });
        return;
      }

      const ai = getGeminiClient();
      const styleByMood: Record<string, string> = {
        happy: 'Warm, lively, charming conversational tone',
        curious: 'Bright, inquisitive, upbeat conversational tone',
        teasing: 'Sly, playful, amused conversational tone',
        annoyed: 'Impatient, dry, slightly irritated sighing tone',
        angry: 'Sharp, grumpy, fed-up, dramatic angry tone',
      };

      const allowedVoices = new Set(['Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr']);
      const safeVoice = allowedVoices.has(voiceName) ? voiceName : 'Puck';

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash-lite-tts',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: text.trim(),
                speechMetadata: {
                  style: styleByMood[mood] || styleByMood.happy,
                },
              },
            ],
          },
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: safeVoice },
            },
          },
        },
      });

      const base64Audio =
        response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

      if (!base64Audio) {
        res.status(502).json({ error: 'No audio returned from TTS model.' });
        return;
      }

      res.json({
        audioBase64: base64Audio,
        mimeType: 'audio/wav',
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'TTS generation failed.';
      console.error('Gemini TTS error:', msg);
      res.status(500).json({ error: msg });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ZooPals 3D server running at http://localhost:${PORT}`);
  });
}

startServer();
