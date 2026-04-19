import { OpenAI } from "openai";

import { config } from "dotenv";
import { getUser } from "./tools.ts";
config({ path: "./.env" });

// Agent tools declaration

const tools: OpenAI.Responses.Tool[] = [
  {
    type: "function",
    name: "getUser",
    description: "Get the user's detail by userId.",
    parameters: {
      type: "object",
      properties: {
        userId: {
          type: "string",
          description: "User's unique id",
        },
      },
      required: ["userId"],
      additionalProperties: false,
    },
    strict: true,
  },
];

const client = new OpenAI({
  baseURL: "https://api.groq.com/openai/v1",
  apiKey: process.env.OPENAI_API_KEY,
});

const main = async () => {
  const res = await client.responses.create({
    model: "qwen/qwen3-32b",
    input: [
      { role: "system", content: "You are a smart assistent" },
      { role: "user", content: "Find the user with userIs : 'user123'" },
    ],
    tools,
  });

  for (const output of res.output) {
    // tool searching and calling
    if (output.type === "function_call") {
      console.log("Calling tool", output.name, "parameters:", output.arguments);
      const result = getUser(JSON.parse(output.arguments));
      const outputForAi = {
        type: "funtion_call_result",
        call_id: output.call_id,
        result: JSON.stringify(result),
      };

      const finalAns = await client.responses.create({
        model: "qwen/qwen3-32b",
        input: [
          { role: "system", content: "You are a smart assistent" },
          { role: "user", content: JSON.stringify(outputForAi) },
        ],
      });

      console.log("Ai: ", finalAns.output_text);
    }
  }
};

main();
