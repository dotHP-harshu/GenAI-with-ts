import { OpenAI } from "openai";
import readline from "node:readline/promises";
import { config } from "dotenv";
import { getDateTime, getUser } from "./tools.ts";
import { stdin, stdout } from "node:process";
import { inflateSync } from "node:zlib";
config({ path: "./.env" });

let messages: any[] = [
  {
    role: "system",
    content: "you are a smart ai assistent",
  },
];

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
    // Taking the query
    const query = await rl.question("User:> ");

    // exit
    if (query === "exit") {
      break;
    }

    // clear history
    if (query === "/clear") {
      messages = [
        {
          role: "system",
          content: "You are a smart assistent.",
        },
      ];
      console.log("history cleared");
      continue;
    }
    if (query.trim() === "") {
      continue;
    }

    messages.push({
      role: "user",
      content: query,
    });

    let MAX_TRIES = 3;

    while (true) {
      // call the model
      const res = await client.responses.create({
        model: "qwen/qwen3-32b",
        input: messages,
        tools: tools,
        tool_choice: MAX_TRIES <= 0 ? "none" : "auto",
      });

      // get the function calls
      const toolCalls = res.output.filter(
        (output) => output.type === "function_call",
      );

      if (res.output_text) {
        console.log("Ai: ", res.output_text);
        messages.push({
          role: "assistant",
          content: res.output_text,
        });

        break;
      }

      if (toolCalls.length > 0) {
        for (const toolCall of toolCalls) {
          console.log(
            "# Calling tool",
            toolCall.name,
            " with args ",
            toolCall.arguments,
          );
          const functionResult = callFunction(
            toolCall.name,
            JSON.parse(toolCall.arguments),
          );

          // console.log({ functionResult });
          messages.push({
            type: "function_call_output",
            call_id: toolCall.call_id,
            output: JSON.stringify(functionResult),
          });

          MAX_TRIES--;
        }
        continue;
      }
    }
  }

  rl.close();
};

main();
