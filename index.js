
import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Test backend
app.get('/', (req, res) => {
  res.send('WeatherAI Backend is running!');
});

// AI Weather Suggestion
app.post('/ai-suggestion', async (req, res) => {
  try {
    const { weather, aqi } = req.body;

    // Validate input
    if (!weather || weather.temp === undefined || !weather.description) {
      return res.status(400).json({
        suggestion: 'Weather information is missing'
      });
    }

    // Check API key
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    if (!GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY is missing');
      return res.status(500).json({
        suggestion: 'Server API key is missing'
      });
    }

    // Create prompt
    const prompt = `Give me a short 2-line health and outdoor suggestion based on this weather:

    Temperature: ${weather.temp}°C
    Condition: ${weather.description}
    AQI: ${aqi ?? 'Not available'}

    Give practical advice about outdoor activities, clothing and health.
    Keep the response short and simple.`;

    // Call Gemini API
    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': GEMINI_API_KEY
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ]
        })
      }
    );

    // Read Gemini response
    const data = await response.json();

    console.log('Gemini HTTP status:', response.status);

    // Handle API errors
    if (!response.ok) {
      console.error('Gemini API error:', data);

      return res.status(response.status).json({
        suggestion: 'Gemini API request failed',
        error: data.error?.message || 'Unknown Gemini API error'
      });
    }

    // Extract suggestion
    const suggestion = data?.candidates?.[0]?.content?.parts
      ?.map(part => part.text || '')
      .join(' ')
      .trim();

    if (!suggestion) {
      console.error('No suggestion in Gemini response:', data);

      return res.status(500).json({
        suggestion: 'No suggestion available'
      });
    }

    // Limit response to two lines
    const twoLines = suggestion
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .slice(0, 2)
      .join(' ');

    console.log('Gemini suggestion:', twoLines);

    return res.json({
      suggestion: twoLines
    });

  } catch (err) {
    console.error('Backend error:', err);

    return res.status(500).json({
      suggestion: 'Could not generate suggestion',
      error: err.message
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`WeatherAI Backend running on port ${PORT}`);
});

