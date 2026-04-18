import OpenAI from "openai";
import { stdin, stdout } from "process";
import readline from "readline/promises";
import { zodTextFormat } from "openai/helpers/zod";
import z from "zod";

import dotenv from "dotenv";

dotenv.config({ path: "./.env" });

// make the client for openai
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

const outputSchemea = z.object({
  title: z.string().describe("Title of response"),
  summary: z.string().describe("The summary of message"),
});

// call the model with input

const askQuestion = async (
  query: string,
  MAX_TRIES = 3,
): Promise<string | object> => {
  try {
    if (MAX_TRIES <= 0) {
      return "Ai is unable to generat valid json.";
    }

    const res = await client.responses.parse({
      model: "openai/gpt-oss-20b",
      input: [
        {
          role: "system",
          content: `Give response in stucture`,
        },
        {
          role: "user",
          content: query,
        },
      ],
      text: { format: zodTextFormat(outputSchemea, "Output") },
    });

    if (!checkJson(res.output_parsed)) {
      console.log(`Retrying max-tries:${MAX_TRIES}`);
      return askQuestion(query, MAX_TRIES - 1);
    }

    return JSON.stringify(res.output_parsed);
  } catch (error) {
    if (error instanceof Error) {
      return error.message;
    }
    return "Internal server Error";
  }
};

// check json is valid or not
const checkJson = (json: unknown) => {
  try {
    return outputSchemea.parse(json);
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
