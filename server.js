// server.js
import express from "express";
import fetch from "node-fetch";
import cors from "cors";
// If you need SPA fallback, uncomment below:
// import path from "path";
// import { fileURLToPath } from "url";
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static files from the project root
app.use(express.static(path.join(__dirname)));

// Send index.html for any other requests
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});


const OPENROUTER_KEY = process.env.OPENROUTER_KEY;

// ----------- APIs -----------
app.post("/summarize", async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: "Missing text" });

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "meta-llama/llama-3.2-3b-instruct:free",
        messages: [
          {
            role: "system",
            content:
              "You are an AI assistant that summarizes long banking/economy current affairs text into Indian exam-oriented short notes. Try to make them ~100 words if possible, minimum 50. Include definitions or related Indian concepts and examples when relevant."
          },
          { role: "user", content: text }
        ]
      })
    });

    const data = await response.json();
    const aiSummary = data.choices?.[0]?.message?.content || null;
    res.json({ summary: aiSummary });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate summary" });
  }
});

app.post("/api/categorize", async (req, res) => {
  const { question, answer } = req.body;
  if (!question || !answer) return res.status(400).json({ error: "Missing question/answer" });

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "meta-llama/llama-3.2-3b-instruct:free",
        messages: [
          {
            role: "system",
            content: "You are an assistant that categorizes flashcards into one of: Reports, Economics, Finance & Management, RBI, SEBI, Others."
          },
          {
            role: "user",
            content: `Question: ${question}\nAnswer: ${answer}\n\nReturn only the category name.`
          },
        ],
      }),
    });

    const result = await response.json();
    const category = result.choices?.[0]?.message?.content?.trim() || "Uncategorized";
    res.json({ category });
  } catch (err) {
    console.error("Error in categorize API:", err);
    res.status(500).json({ category: "Uncategorized" });
  }
});

// ----------- Optional: serve frontend -------------
// If your index.html is in a folder named 'public':
// app.use(express.static("public"));

// If your index.html is at the main project root:
// app.use(express.static("."));

// For Single-Page App routing (optional), place after API routes:
// app.get("*", (req, res) => res.sendFile(path.join(__dirname, "public/index.html")));

const PORT = process.env.PORT || 3000;
const HOST = "0.0.0.0";
app.listen(PORT, HOST, () => {
  console.log(`✅ Server running on http://${HOST}:${PORT}`);
});
