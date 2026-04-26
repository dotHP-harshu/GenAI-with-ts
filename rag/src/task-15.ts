import OpenAI from "openai";
import { config } from "dotenv";
config({ path: "./.env" });

import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { CloudClient } from "chromadb";
import { InferenceClient } from "@huggingface/inference";

// clients
const client = new OpenAI({
  baseURL: "https://rapid-union-a7f7.prajapatiharsh2323.workers.dev/v1",
  apiKey: "HARSH_IS_BATMAN",
});

const dbClient = new CloudClient({
  apiKey: "ck-FEw1aHTZM8essAxu4DK1EPQvwKJH89hk1HoFbZnMM6Ji",
  tenant: "004a6f58-3887-4571-a3e8-3488043e8053",
  database: "rag-learning",
});

const hfClient = new InferenceClient(process.env.HF_TOKEN);

const makeEmbedding = async (text: string) => {
  const res = await client.embeddings.create({
    model: "text-embedding-ada-002",
    input: text,
  });
  return res.data[0].embedding;

  // const res = await hfClient.featureExtraction({
  //   model: "sentence-transformers/all-MiniLM-L6-v2",
  //   inputs: text,
  // });
  // return res;
};

const loadPdf = async () => {
  // get the paegs from the pdf
  console.log("\n📂 Loading document: ./src/story.pdf...");
  const documentUrl = "./src/story.pdf";
  const loader = new PDFLoader(documentUrl);
  const pages = await loader.load();
  console.log(`📄 Document loaded: ${pages.length} pages found.`);

  // make the chunks from the pages
  console.log("✂️  Chunking text into smaller segments...");
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 500,
    chunkOverlap: 100,
  });
  const chunks = await splitter.splitDocuments(pages);
  console.log(`🧩 Created ${chunks.length} chunks.`);
  const docChunks = chunks.map((chunk) => {
    return {
      text: chunk.pageContent,
      metadata: {
        source: chunk.metadata.source,
        loc: chunk.metadata.loc,
      },
    };
  });
  return docChunks;
};

const makeEmbeddings = async (
  chunks: {
    text: string;
    metadata: { source: any; loc: any };
  }[],
) => {
  console.log("\n🧠 Connecting to ChromaDB...");
  const collection = await dbClient.getOrCreateCollection({ name: "task-15" });
  console.log("✅ Collection ready: task-15");

  const documents = [];
  const ids = [];
  const embeddings = [];
  const metadatas = [];
  let currentId = 1;

  console.log(`🚀 Starting vectorization of ${chunks.length} chunks...`);
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const em = await makeEmbedding(chunk.text);
    documents.push(chunk.text);
    embeddings.push(em);
    ids.push(currentId.toString());
    metadatas.push(chunk.metadata);
    currentId++;

    // Progress log
    const progress = Math.round(((i + 1) / chunks.length) * 100);
    process.stdout.write(
      `\r   Embeddings: [${"█".repeat(progress / 5)}${" ".repeat(20 - progress / 5)}] ${progress}% (${i + 1}/${chunks.length})`,
    );
  }
  console.log("\n");

  await collection.add({
    ids: ids,
    documents: documents,
    embeddings: embeddings as number[][],
    // metadatas: metadatas,
  });
  console.log("💾 Vector embeddings stored successfully in ChromaDB.");
};

const testRag = async () => {
  const ragTestQuestions = [
    "In what year does the story take place?",
    "What is the name of Aanya's AI assistant?",
    "What is the primary difference between how Archive Keepers and The Seekers treat data?",
    "According to the text, what happened to governments after the Collapse?",
    "What tools are mentioned as essential for an Archive Keeper?",
    "What is the 'Project Echo' dataset actually composed of?",
    "What was the first question asked by one of the Echo minds at the end?",
    "How many people's minds were stored in the intact dataset?",
    "Why did Aanya hesitate before activating Project Echo?",
    "Describe the state of the city of Varnak in 2093.",
  ];

  console.log("\n🔎 Starting RAG Pipeline Evaluation...");
  const collection = await dbClient.getCollection({ name: "task-15" });

  if (!collection) {
    console.error("❌ Error: Embeddings collection not found.");
    return;
  }

  let currentQuestion = 1;

  for (const query of ragTestQuestions) {
    const queryEmbedding = await makeEmbedding(query);

    process.stdout.write(
      `\r📝 Querying AI for Q${currentQuestion}/${ragTestQuestions.length}...`,
    );

    const context = await collection.query({
      queryEmbeddings: [queryEmbedding] as number[][],
      queryTexts: [query],
      nResults: 3,
    });

    // Clear the "Querying" line for the full report
    process.stdout.write("\r" + " ".repeat(50) + "\r");

    console.log(`\n${"━".repeat(60)}`);
    console.log(`❓ Q${currentQuestion}: ${query}`);
    console.log(`${"━".repeat(60)}`);
    // console.log(`📄 Context retrieved: ${context.documents[0].length} characters`);

    const ans = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `
            You are a RAG assistant.
            Answer ONLY using the provided context.
            If the answer is not in the context, say "I don't know".
            Do NOT hallucinate or make up information.`,
        },
        {
          role: "user",
          content: `
            userQuery:${query}

            context:${context.documents.join("\n")}
            `,
        },
      ],
    });
    currentQuestion++;

    console.log(`✨ AI Response:\n${ans.choices[0].message.content}`);
    currentQuestion++;
  }
  console.log(`\n${"━".repeat(60)}`);

  console.log("\n🧹 Cleaning up environment...");
  await dbClient.deleteCollection({ name: "task-15" });
  console.log("🗑️  ChromaDB collection deleted.");
  console.log("\n✨ Pipeline execution complete.\n");
};

loadPdf().then((chunks) => {
  makeEmbeddings(chunks).then(() => {
    testRag();
  });
});
