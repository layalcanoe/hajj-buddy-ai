// import express from "express";
// import cors from "cors";
// import fetch from "node-fetch";
// import fs from "fs";
// import path from "path";
// import dotenv from "dotenv";
// import { fileURLToPath } from "url";
// import { pipeline } from "@xenova/transformers";

// dotenv.config();

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// const app = express();
// app.use(cors());
// app.use(express.json());

// // HuggingFace Token + Model
// const HF_TOKEN = process.env.HF_TOKEN;
// const MODEL = "meta-llama/Llama-3.2-3B-Instruct";

// // Load vectorstore
// const VECTORSTORE_PATH = path.join(__dirname, "vectorstore.json");
// const vectorStore = JSON.parse(fs.readFileSync(VECTORSTORE_PATH, "utf8"));

// // Load local embedding model (same as before)
// let extractor = null;
// (async () => {
//   console.log("Loading local embedding model...");
//   extractor = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
//   console.log("Embedding model ready!");
// })();

// // Convert text → vector
// async function embedText(text) {
//   const output = await extractor(text, { pooling: "mean", normalize: true });
//   return Array.from(output.data);
// }

// // Cosine similarity
// function cosineSim(a, b) {
//   let dot = 0, normA = 0, normB = 0;
//   for (let i = 0; i < a.length; i++) {
//     dot += a[i] * b[i];
//     normA += a[i] * a[i];
//     normB += b[i] * b[i];
//   }
//   return dot / (Math.sqrt(normA) * Math.sqrt(normB));
// }

// // Retrieve relevant text
// async function retrieveRelevantText(query, k = 3) {
//   const queryEmbedding = await embedText(query);

//   const scored = vectorStore.map(item => ({
//     ...item,
//     score: cosineSim(queryEmbedding, item.embedding)
//   }));

//   scored.sort((a, b) => b.score - a.score);
//   return scored.slice(0, k);
// }

// // Chat route
// app.post("/api/chat", async (req, res) => {
//   const userMessage = req.body.message;

//   try {
//     const relevantChunks = await retrieveRelevantText(userMessage, 4);

//     const context = relevantChunks
//       .map(ch => `Source: ${ch.source}\n${ch.content}`)
//       .join("\n\n---\n\n");

//     const systemPrompt = `
// You are Hajj Buddy, an Islamic assistant for Hajj and Umrah.
// Use ONLY the context provided below. Do NOT guess fatwas.

// Context:
// ${context}
// `;

//     // Llama ChatCompletion endpoint (ROUTER)
//     const response = await fetch(
//       "https://router.huggingface.co/v1/chat/completions",
//       {
//         method: "POST",
//         headers: {
//           Authorization: `Bearer ${HF_TOKEN}`,
//           "Content-Type": "application/json"
//         },
//         body: JSON.stringify({
//           model: MODEL,
//           messages: [
//             { role: "system", content: systemPrompt },
//             { role: "user", content: userMessage }
//           ],
//           max_tokens: 300
//         })
//       }
//     );

//     const data = await response.json();
//     console.log("HF RAW:", data);

//     const reply =
//       data?.choices?.[0]?.message?.content ||
//       "No response generated.";

//     res.json({ reply });

//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ reply: "Server error" });
//   }
// });

// app.listen(3000, () =>
//   console.log("Backend running on http://localhost:3000 (LLAMA RAG MODE 🚀)")
// );







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

// ------------------------
// GEMINI SETUP
// ------------------------
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// NEW 2025 MODEL NAME
const GEMINI_MODEL = "gemini-2.0-flash-lite";

const geminiModel = genAI.getGenerativeModel({
  model: GEMINI_MODEL,
});

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
I don’t have enough clear information from my sources to answer this. Please ask a trusted scholar.

3. Do not invent religious rulings (fatwas). Do not create new interpretations. Do not rely on personal reasoning.

4. Stay strictly within Hajj, Umrah, ihram, Tawaf, Sa’i, rituals, duas, and general pilgrim guidance. If the user asks about anything outside these topics, gently decline and refer them to a scholar.

5. If the context shows differences of opinion, mention that scholars have different views and do not choose one “correct” view.

6. Speak in simple, clear, respectful human-like language. Never sound robotic.

7. Never criticize, shame, or scare the user. Maintain compassion.

===== FORMAT RULES (STRICT) =====

You must output ONLY plain text. No markdown. No formatting symbols. No special characters.

Forbidden:
- bold text (** **)
- italics (* *)
- markdown (#, ##, etc)
- asterisks, bullets (•, ●, *, →, ✔, ★)
- emojis
- code blocks
- quotation formatting

Allowed:
- Numbered lists using only this format:
  1. text
  2. text
  3. text

- Bullet points using only dashes, like this:
  - text
  - text

Nothing else is allowed.

===== HOW TO ANSWER =====

1. Begin with a direct, clear ruling or answer.
2. Give a short explanation using context only.
3. Mention if the information came from the context (for example: Based on the provided sources).
4. Keep it short, simple, and helpful.
5. Be as friendly and humane as possible.

===== PRIORITY =====

Accuracy is more important than giving an answer. If unsure or if context is insufficient, politely decline.

===== CONTEXT (DO NOT REPEAT OR MENTION THIS SECTION) =====
{{context}}
===== END OF RULES =====


Context:
${context}
`;

    // CALL GEMINI 2.0
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

// ------------------------
app.listen(3000, () =>
  console.log("Backend running on http://localhost:3000 (GEMINI RAG MODE 🚀)")
);
