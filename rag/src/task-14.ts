import { InferenceClient } from "@huggingface/inference";
import OpenAI from "openai";
import { config } from "dotenv";

config({ path: "./.env" });

// clients
const hfClient = new InferenceClient(process.env.HF_TOKEN);
const chatClient = new OpenAI({
  baseURL: "https://api.groq.com/openai/v1",
  apiKey: process.env.OPENAI_API_KEY,
});
const dbClient = new CloudClient({
  apiKey: "ck-FEw1aHTZM8essAxu4DK1EPQvwKJH89hk1HoFbZnMM6Ji",
  tenant: "004a6f58-3887-4571-a3e8-3488043e8053",
  database: "rag-learning",
});

import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { CloudClient } from "chromadb";

const loadPdf = async () => {
  // get the paegs from the pdf
  console.log("# PDF loading...");
  const documentUrl = "./src/document-1.pdf";
  const loader = new PDFLoader(documentUrl);
  const pages = await loader.load();
  console.log("# PDF loaded ✅");

  // make the chunks from the pages
  console.log("# Chunking start.......");
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 500,
    chunkOverlap: 100,
  });
  const chunks = await splitter.splitDocuments(pages);
  const docChunks = chunks.map((chunk) => {
    return {
      text: chunk.pageContent,
      metadata: {
        source: chunk.metadata.source,
        loc: chunk.metadata.loc,
      },
    };
  });
  console.log("# Chunked the document ✅");
  makeEmbeddings(docChunks);
};

const makeEmbeddings = async (
  chunks: {
    text: string;
    metadata: { source: any; loc: any };
  }[],
) => {
  const collection = await dbClient.getOrCreateCollection({ name: "task-14" });
  console.log("# Get Collection successfylly");

  const documents = [];
  const ids = [];
  const embeddings = [];
  const metadatas = [];
  let currentId = 1;

  for (const chunk of chunks) {
    const em = await hfClient.featureExtraction({
      model: "sentence-transformers/all-MiniLM-L6-v2",
      inputs: chunk.text,
    });
    documents.push(chunk.text);
    embeddings.push(em);
    ids.push(currentId.toString());
    metadatas.push(chunk.metadata);
    currentId++;
  }

  await collection.add({
    ids: ids,
    documents: documents,
    embeddings: embeddings as number[][],
    // metadatas: metadatas,
  });
  console.log("# Embeddings stored successfully✅");
};

const testRag = async () => {
  const ragTestQuestions = [
    // Fact Retrieval
    "Who is the author of 'The Clockmaker of Orion Station'?",
    "What three instruments does Elias Varn carry at all times?",
    "What is the name of the girl Elias finds in Sector 12?",
    "What caused the breakdown in the station's time field?",
    "What specific device reported 'Time differential: infinite' in Sector 12?",

    // Synthesis & Summarization
    "Explain the relationship between the Drift Incident and the role of the Clockmaker.",
    "How does the story describe the 'Tick Engine', and what happens to it during the climax?",
    "Compare the state of Orion Station at the beginning of the story to its state in Chapter 12.",
    "What were the consequences of the 'Temporal Drift' as observed by the station's inhabitants?",

    // Inference & Contextual Understanding
    "Why did Elias smile before entering the Quantum Core?",
    "What does the phrase 'He was the Clock itself' imply about Elias's final state?",
    "Why was Lyra unaffected by the freeze in Sector 12?",
    "What 'cost' was Lyra referring to when she said the timeline could be fixed?",

    // Negative Constraints (Checking for Hallucinations)
    "What is the specific year Orion Station was built?",
    "How many other Clockmakers worked with Elias before he became the last one?",
    "What happened to Lyra's original timeline?",
    "What fuel does the Orion Station's engine use?",

    // Technical & Formatting
    "In which chapter is the Quantum Core first mentioned?",
    "What is the specific quote Elias often said about time?",
    "What was the last signal recorded in the Tick Engine logs?",
  ];

  const collection = await dbClient.getCollection({ name: "task-14" });
  console.log("# Get Collection successfylly");
  if (!collection) {
    return console.log("# Embeddings not found");
  }

  let currentQuestion = 1;

  console.log("-------------------");
  console.log(`       ${currentQuestion.toString().padStart(2, "0")} `);
  console.log("-------------------");

  for (const query of ragTestQuestions) {
    const queryEmbedding = await hfClient.featureExtraction({
      model: "sentence-transformers/all-MiniLM-L6-v2",
      inputs: query,
    });

    const context = await collection.query({
      queryEmbeddings: [queryEmbedding] as number[][],
      queryTexts: [query],
      nResults: 3,
    });

    const ans = await chatClient.chat.completions.create({
      model: "openai/gpt-oss-20b",
      messages: [
        {
          role: "system",
          content:
            "You are a smart ai assistant. You response the query according to given context. If you don't know the answer try to find in context, don't use fake data to answer the query.",
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

    console.log("Ai: ", ans.choices[0].message.content);
    console.log("===========================================================");
  }
};

testRag();
// loadPdf(); // done only one time or clear(delete the embeddings at end)
