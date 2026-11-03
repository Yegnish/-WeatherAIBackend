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
   const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("GEMINI_API_KEY is missing");
}

const response = await fetch(
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [{ text: prompt }]
        }
      ]
    })
  }
);

const data = await response.json();

console.log("Gemini HTTP status:", response.status);

if (!response.ok) {
  console.error("Gemini API error:", data);
  throw new Error(data.error?.message || "Gemini API request failed");
}

console.log("Gemini response:", JSON.stringify(data));

const suggestion = data?.candidates?.[0]?.content?.parts
  ?.map(part => part.text || "")
  .join(" ")
  .trim();

if (!suggestion) {
  console.log("Prompt feedback:", data.promptFeedback);
  throw new Error("Gemini returned no text");
}

res.json({
  suggestion: suggestion.split("\n").filter(Boolean).slice(0, 2).join(" ")
});

  } catch (err) {
    console.error('Gemini API error:', err);
    res.status(500).json({ suggestion: 'Could not generate suggestion' });
  }
});

app.listen(PORT, () => console.log(`✅ Backend running on http://localhost:${PORT}`));

