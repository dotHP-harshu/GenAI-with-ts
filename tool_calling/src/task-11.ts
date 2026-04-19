import { OpenAI } from "openai";
import readline from "node:readline/promises";
import { config } from "dotenv";
import { getDateTime, getUser } from "./tools.ts";
import { stdin, stdout } from "node:process";
import { text } from "node:stream/consumers";
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
  {
    type: "function",
    name: "getDateTime",
    description: "Get the current date and time",
    parameters: {
      type: "object",
      properties: {},
      required: [],
    },
    strict: true,
  },
];

const client = new OpenAI({
  baseURL: "https://api.groq.com/openai/v1",
  apiKey: process.env.OPENAI_API_KEY,
});

// callFunction (utils)
const callFunction = (name: string, args: unknown) => {
  if (name === "getDateTime") {
    return getDateTime();
  }
  if (name === "getUser") {
    return getUser(args as { userId: string });
  }
};

const main = async () => {
  const rl = readline.createInterface({ input: stdin, output: stdout });

  while (true) {
    const ques = await rl.question("User: ");
    if (ques === "exit") {
      break;
    }
    const res = await client.responses.create({
      model: "qwen/qwen3-32b",
      input: [
        { role: "system", content: "You are a smart assistent" },
        { role: "user", content: ques },
      ],
      tools,
    });
    for (const output of res.output) {
      if (output.type === "message") {
        console.log(
          "Ai: ",
          output.content[0].type === "output_text"
            ? output.content[0].text
            : "",
        );
        break;
      }
      // tool searching and calling
      if (output.type === "function_call") {
        console.log(
          "Calling tool",
          output.name,
          "parameters:",
          output.arguments,
        );
        const result = callFunction(output.name, JSON.parse(output.arguments));
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
  }

  rl.close();
};

main();
