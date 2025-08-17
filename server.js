// server.js
import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const OPENROUTER_KEY = "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"; // replace with your key or move to .env

// ----------- Summarize API -----------
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

// ----------- Categorize API -----------
app.post("/api/categorize", async (req, res) => {
  const { question, answer } = req.body;

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_KEY}`,
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

// ----------- Start Server -----------
app.listen(3000, () => {
  console.log("✅ Server running on http://localhost:3000");
});
