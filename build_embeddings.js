import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { pipeline } from "@xenova/transformers";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const KNOWLEDGE_FOLDER = path.join(__dirname, "knowledge-base");
const OUTPUT_FILE = path.join(__dirname, "vectorstore.json");

// Chunking function
function chunkText(text, maxChars = 600) {
  const chunks = [];
  let current = "";

  const sentences = text.split(/(?<=[.!?])\s+/);

  for (const sentence of sentences) {
    if ((current + " " + sentence).length > maxChars) {
      chunks.push(current.trim());
      current = sentence;
    } else {
      current += " " + sentence;
    }
  }
  if (current.trim()) chunks.push(current.trim());

  return chunks;
}

// Load all .md files
function loadDocuments() {
  const files = fs.readdirSync(KNOWLEDGE_FOLDER).filter(f => f.endsWith(".md"));
  const docs = [];

  for (const file of files) {
    const full = path.join(KNOWLEDGE_FOLDER, file);
    const content = fs.readFileSync(full, "utf8");

    const chunks = chunkText(content);

    chunks.forEach((chunk, i) => {
      docs.push({
        id: `${file}#${i}`,
        source: file,
        text: chunk
      });
    });
  }

  return docs;
}

async function generateEmbeddings() {
  console.log("📚 Loading local embedding model...");
  const extractor = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");

  console.log("📖 Loading documents...");
  const docs = loadDocuments();
  console.log(`Found ${docs.length} chunks.`);

  const vectorStore = [];

  for (const doc of docs) {
    console.log("🔎 Embedding:", doc.id);

    const output = await extractor(doc.text, { pooling: "mean", normalize: true });
    const embedding = Array.from(output.data); // convert Tensor to JS array

    vectorStore.push({
      id: doc.id,
      source: doc.source,
      content: doc.text,
      embedding: embedding
    });
  }

  console.log("💾 Saving vectorstore.json...");
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(vectorStore, null, 2));
  console.log("✅ Done! Embeddings saved.");
}

generateEmbeddings();

