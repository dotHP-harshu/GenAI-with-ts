import { document } from "./document.ts";
import {
  fixedSizeChunking,
  recursiveChunk,
  semanticeChunking,
} from "./chunking.ts";
import { client, hfClient } from "./client.ts";

const chunks = recursiveChunk(document);

import { CloudClient } from "chromadb";

const dbClient = new CloudClient({
  apiKey: "ck-FEw1aHTZM8essAxu4DK1EPQvwKJH89hk1HoFbZnMM6Ji",
  tenant: "004a6f58-3887-4571-a3e8-3488043e8053",
  database: "rag-learning",
});

const storeVectors = async () => {
  const task13Collection = await dbClient.createCollection({
    name: "task-13-v1",
  });

  const documents = [];
  const ids = [];
  const embeddings = [];
  let currentId = 1;

  for (const chunk of chunks) {
    const embedding = await hfClient.featureExtraction({
      model: "sentence-transformers/all-MiniLM-L6-v2",
      inputs: chunk,
    });
    embeddings.push(embedding);
    ids.push(currentId.toString());
    documents.push(chunk);
    currentId++;
  }

  await task13Collection.add({
    ids: ids,
    documents: documents,
    embeddings: embeddings as number[][],
  });
};

const makeEmbedding = async (text: string) => {
  const embedding = await hfClient.featureExtraction({
    model: "sentence-transformers/all-MiniLM-L6-v2",
    inputs: text,
  });
  return embedding;
};

const main = async () => {
  const collection = await dbClient.getCollection({ name: "task-13-v1" });
  console.log("Get collection sucesfully");

  // Basic questions

  // const questions = [
  //   "What is the company name in the document?",
  //   "What is the version of the policy document?",
  //   "When was the document last updated?",
  //   "What is the confidentiality level of the document?",
  //   "What is the purpose of this policy?",
  // ];

  // Advance questions

  const questions = [
    "Can AI systems be used without human validation?",
    "Can developers send private company data to AI tools?",
    "Who is the CEO of Nexora Systems?",
    "Explain all security requirements related to authentication and API protection.",
    "What chunking strategy is recommended in the document?",
    "What are all the requirements before using AI-generated code in production?",
  ];
  let currentIndex = 1;

  for (const ques of questions) {
    const embedQuery = await makeEmbedding(ques);
    const res = await collection.query({
      queryEmbeddings: [embedQuery] as number[][],
      queryTexts: [ques],
      nResults: 3,
    });
    console.log("=================");
    console.log("    Ans-", currentIndex);
    console.log("=================");

    const aiRes = await client.chat.completions.create({
      model: "openai/gpt-oss-20b",
      messages: [
        {
          role: "system",
          content:
            "You are a smart AI assistant who is answering the questions from the given context.",
        },
        {
          role: "user",
          content: `
          context:${res.documents.join("\n")}

          Question : ${ques}
          `,
        },
      ],
    });

    console.log("Ai :", aiRes.choices[0].message.content);
    currentIndex++;
  }
};

// storeVectors()
main();
