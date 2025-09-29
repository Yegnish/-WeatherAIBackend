import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const PORT = process.env.PORT || 3000;

app.post('/ai-suggestion', async (req, res) => {
  const { weather, aqi } = req.body;

  try {
    const prompt = `Give me a short 2-line health/outdoor suggestion for this weather:
    Temperature: ${weather.temp}°C
    Condition: ${weather.description}
    AQI: ${aqi}`;

    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + GEMINI_API_KEY,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    );

    const data = await response.json();

    // Robust extraction
    let suggestion = 'No suggestion available';
    if (data?.candidates?.length > 0) {
      const parts = data.candidates[0].content?.parts;
      if (parts && parts.length > 0 && parts[0].text) {
        suggestion = parts[0].text.trim();
      }
    }

    // Force only 2 lines max
    const twoLines = suggestion.split('\n').filter(line => line.trim() !== '').slice(0, 2).join(' ');

    console.log("Gemini suggestion:", twoLines);
    res.json({ suggestion: twoLines });

  } catch (err) {
    console.error('Gemini API error:', err);
    res.status(500).json({ suggestion: 'Could not generate suggestion' });
  }
});

app.listen(PORT, () => console.log(`✅ Backend running on http://localhost:${PORT}`));

