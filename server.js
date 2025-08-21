// server.js
import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// ----------- API Routes -----------
app.post("/summarize", async (req, res) => {
  const { text } = req.body || {};

  if (!text || !text.trim()) {
    return res.status(400).json({ error: "Missing text" });
  }
  if (!process.env.OPENROUTER_KEY) {
    console.error("FATAL: OPENROUTER_KEY environment variable is not set!");
    return res.status(500).json({ error: "Server is not configured" });
  }

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "deepseek/deepseek-chat-v3-0324:free",
        messages: [
          {
            role: "system",
            content: "You are an AI assistant that summarizes long banking/economy current affairs text into Indian exam-oriented short notes. Try to make them ~100 words if possible, minimum 50. Include definitions or related Indian concepts and examples when relevant.",
          },
          { role: "user", content: text },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => "Could not read error body.");
      console.error("OpenRouter API Error:", response.status, errText);
      return res.status(502).send(errText || "Upstream API error");
    }

    const data = await response.json();
    const summary = data?.choices?.[0]?.message?.content?.trim() || "";
    res.json({ summary: summary });
  } catch (e) {
    console.error("Internal Server Error in /summarize:", e);
    res.status(500).json({ error: "Failed to process summary request" });
  }
});

app.post("/api/categorize", async (req, res) => {
  const { question, answer } = req.body;
  if (!question || !answer) return res.status(400).json({ error: "Missing question/answer" });
  // Add OPENROUTER_KEY check here as well for consistency
  if (!process.env.OPENROUTER_KEY) {
    console.error("FATAL: OPENROUTER_KEY environment variable is not set!");
    return res.status(500).json({ error: "Server is not configured" });
  }

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "deepseek/deepseek-chat-v3-0324:free",
        messages: [
          {
            role: "system",
            content: "You are an assistant that categorizes flashcards into one of: Reports, Economics, Finance & Management, RBI, SEBI, Others.",
          },
          {
            role: "user",
            content: `Question: ${question}\nAnswer: ${answer}\n\nReturn only the category name.`,
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

// ----------- Serve frontend from repo root -----------
app.use(express.static(path.join(__dirname)));

app.get("/*", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// ----------- Start Server -----------
const PORT = process.env.PORT || 10000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server running on http://0.0.0.0:${PORT}`);
});
