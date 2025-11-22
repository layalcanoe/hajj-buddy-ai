import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { pipeline } from "@xenova/transformers";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// ✅ ADDED: Serve static files (HTML, CSS, images)
app.use(express.static(__dirname));

// ------------------------
// GEMINI SETUP
// ------------------------
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const GEMINI_MODEL = "gemini-2.0-flash-lite";
const geminiModel = genAI.getGenerativeModel({ model: GEMINI_MODEL });

// ------------------------
// LOAD VECTORSTORE
// ------------------------
const VECTORSTORE_PATH = path.join(__dirname, "vectorstore.json");
const vectorStore = JSON.parse(fs.readFileSync(VECTORSTORE_PATH, "utf8"));

// ------------------------
// LOAD EMBEDDING MODEL
// ------------------------
let extractor = null;
(async () => {
  console.log("Loading local embedding model...");
  extractor = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
  console.log("Embedding model ready!");
})();

async function embedText(text) {
  const output = await extractor(text, { pooling: "mean", normalize: true });
  return Array.from(output.data);
}

function cosineSim(a, b) {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

async function retrieveRelevantText(query, k = 3) {
  const queryEmbedding = await embedText(query);
  const scored = vectorStore.map(item => ({
    ...item,
    score: cosineSim(queryEmbedding, item.embedding)
  }));
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, k);
}

// ------------------------
// MAIN CHAT ENDPOINT
// ------------------------
app.post("/api/chat", async (req, res) => {
  const userMessage = req.body.message;

  try {
    const chunks = await retrieveRelevantText(userMessage, 4);
    const context = chunks
      .map(ch => `Source: ${ch.source}\n${ch.content}`)
      .join("\n\n---\n\n");

    const systemPrompt = `
You are Hajj Buddy, an Islamic assistant specialized only in Hajj and Umrah guidance.

Your knowledge comes from:
- The provided context (trusted Islamic sources)
- The user's question

You must always follow these rules:

===== CORE RULES =====
1. Use only the context provided. Do not use outside knowledge, do not guess, and do not assume anything that is not clearly in the context.
2. If the context does not contain enough information to answer the question, say this exact sentence:
I don't have enough clear information from my sources to answer this. Please ask a trusted scholar.
3. Do not invent religious rulings (fatwas). Do not create new interpretations. Do not rely on personal reasoning.
4. Stay strictly within Hajj, Umrah, ihram, Tawaf, Sa'i, rituals, duas, and general pilgrim guidance.
5. If the context shows differences of opinion, mention that scholars have different views.
6. Speak in simple, clear, respectful human-like language.
7. Never criticize, shame, or scare the user. Maintain compassion.

===== FORMAT RULES =====
Output ONLY plain text. No markdown. No formatting symbols.
- Numbered lists: 1. text 2. text
- Bullet points: - text

===== CONTEXT =====
${context}
===== END =====
`;

    const result = await geminiModel.generateContent(
      systemPrompt + "\n\nUser question: " + userMessage
    );
    const reply = result.response.text() || "No response generated.";
    res.json({ reply });

  } catch (err) {
    console.error("GEMINI ERROR:", err);
    res.status(500).json({ reply: "Server error" });
  }
});

// ✅ ADDED: Serve homepage for root route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "homePage.html"));
});

// ✅ CHANGED: Use environment PORT for deployment
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`Backend running on port ${PORT} (GEMINI RAG MODE 🚀)`)
);
