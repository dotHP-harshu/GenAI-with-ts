import OpenAI from "openai";
import { stdin, stdout } from "process";
import readline from "readline/promises";

import dotenv from "dotenv";

dotenv.config({ path: "./.env" });

// make the client for openai
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

const askQuestion = async (
  query: string,
  MAX_TRIES = 3,
): Promise<string | object> => {
  try {
    if (MAX_TRIES <= 0) {
      return "Ai is unable to generat valid json.";
    }

    const res = await client.chat.completions.create({
      model: "llama-3.1-8b-instant",
      temperature: 0,
      messages: [
        {
          role: "system",
          content: `
        You MUST return ONLY valid JSON.
        Do NOT include any explanation or text outside JSON.
                
        Schema:
        {
          "title": string,
          "summary": string
        }
        `,
        },
        {
          role: "user",
          content: query,
        },
      ],
    });

    if (!checkJson(res.choices[0].message.content || "")) {
      return askQuestion(query, MAX_TRIES - 1);
    }

    return JSON.parse(res.choices[0].message.content || "");
  } catch (error) {
    if (error instanceof Error) {
      return error.message;
    }
    return "Internal server Error";
  }
};

// check json is valid or not
const checkJson = (json: string) => {
  try {
    JSON.parse(json);
    return true;
  } catch (error) {
    return false;
  }
};

// main function to start chat
const rl = readline.createInterface({ input: stdin, output: stdout });

const main = async () => {
  while (true) {
    const query = await rl.question("User: ");
    if (query === "exit") {
      rl.close();
    }
    if (query.trim() === "") {
      continue;
    }
    const ans = await askQuestion(query);
    console.log(ans);
  }
};

main();
