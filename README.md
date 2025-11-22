#  Hajj Buddy AI

### *Your Smart Pilgrimage Companion — Powered by RAG + Gemini*

Hajj Buddy AI is an intelligent assistant designed to guide pilgrims through the sacred journey of **Hajj and Umrah**.
Built with **Retrieval-Augmented Generation (RAG)** + **Gemini AI**, it provides **authentic, trustworthy, and context-aware Islamic guidance**—with zero hallucinations.

This system blends **LLM power**, **vector search**, and a clean, interactive web interface to deliver answers that are accurate, safe, and grounded in real Islamic sources.

**Live Demo:** [Try Hajj Buddy AI](https://hajj-buddy-ai-cet1.onrender.com/)

---

##  Features

###  Intelligent Web Chat Interface

A beautiful, responsive chat UI where pilgrims can ask anything about:

* Tawaf
* Sa’i
* Ihram
* Duas
* Hajj steps
* Umrah steps
* Logistics, timings & rules

###  Authentic Islamic Knowledge Base (RAG)

You provide the assistant with your own verified `.md` files, including:

* Tawaf steps
* Sa’i steps
* Ihram rules
* Duas
* Hajj & Umrah rituals
* Fatwas & scholarly rulings

These are chunked, embedded, and indexed into a **vectorstore** so the AI only answers using real sources.

###  Gemini-Powered LLM

The assistant uses **Google Gemini** for generating clear, human-like guidance while:

* Never guessing
* Never inventing rulings
* Always citing context
* Staying respectful
* Following Qur’an, Sunnah, and authentic scholars

###  Local Embeddings (Secure + Free)

Embeddings are generated using:

```
Xenova/all-MiniLM-L6-v2
```

Runs locally — no API costs for embeddings.

###  Fully Local RAG Pipeline

Your system includes:

* Document loader
* Chunking
* Embedding pipeline
* Vector store
* RAG retrieval
* Final combined prompt fed into Gemini

---

##  Project Structure

```
hajj-buddy-ai/
│
├── knowledge-base/          # Islamic sources (.md files)
├── server.js                # Backend (RAG + Gemini)
├── build_embeddings.js      # Converts knowledge → vectorstore
├── vectorstore.json         # Embeddings (auto-generated)
│
├── homePage.html            # Chat UI
├── homePage.css             # Styles
├── logo.png                 # Branding
│
├── package.json
├── .gitignore               # Protects secrets & big files
└── .env                     # API key (NOT committed)
```

---

##  Tech Stack

### **Frontend**

* HTML
* CSS
* Vanilla JavaScript
* Smooth chat UI

### **Backend**

* Node.js
* Express
* Google Gemini API
* Local embedding pipeline
* Custom RAG logic

### **AI**

* Google Gemini 1.5 Flash
* Local Embeddings (MiniLM)
* RAG retrieval system

---

##  Setup & Installation

###  Clone the repo

```bash
git clone https://github.com/layalcanoe/hajj-buddy-ai.git
cd hajj-buddy-ai
```

###  Install dependencies

```bash
npm install
```

###  Add your environment variable

Create `.env`:

```
GEMINI_API_KEY=your_key_here
```

###  Build the vector store

```bash
node build_embeddings.js
```

### Run the backend

```bash
npm start
```

Backend runs on:

```
http://localhost:3000
```

###  Open the frontend

Just double-click **homePage.html**.

---

---

##  Deployment

Hajj Buddy AI is deployed using [Render](https://render.com), which hosts both the **backend** and **frontend** seamlessly.

**Live app:** [https://hajj-buddy-ai-cet1.onrender.com](https://hajj-buddy-ai-cet1.onrender.com/)

Steps we followed to deploy:

1. Push the repo to GitHub.
2. Create a new Node.js web service on Render.
3. Connect the GitHub repo.
4. Set the `GEMINI_API_KEY` environment variable in Render.
5. Render automatically installed dependencies and started the server.
6. App is now live at the above link!


##  Safety & Islamic Authenticity

Hajj Buddy AI follows strict rules:

* No fatwas unless found in context
* No personal opinions
* No guessing
* Declines respectfully when unsure
* Always grounded in authentic provided sources

Your `.md` files = your Islamic truth source.

---

## Vision

Hajj Buddy AI aims to empower pilgrims with:

* Reliable guidance
* A peaceful experience
* Easy access to correct rituals
* 24/7 personal assistance
* Multilingual support in the future


---

## Credits



