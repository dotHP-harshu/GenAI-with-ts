import OpenAI from "openai";
import { config } from "dotenv";
import { searchInternet, searchInternetTool } from "./tools";
import readline from "readline/promises";
import { stdin, stdout } from "process";
config({ path: "./.env" });

const client = new OpenAI({
  baseURL: "https://api.groq.com/openai/v1",
  apiKey: process.env.OPENAI_API_KEY,
});

const rl = readline.createInterface({ input: stdin, output: stdout });

const main = async () => {
  let messages: any[] = [
    {
      role: "system",
      content: "You are a smart ai assistant",
    },
  ];

  while (true) {
    const query = await rl.question("User: ");
    // validate the user's query
    if (query.trim() === "") {
      continue;
    }
    if (query === "exit") {
      break;
    }
    if (query === "/clear") {
      messages = [];
      continue;
    }
    if (query === "/history") {
      console.log(messages.filter((mes) => mes.role === "user"));
      continue;
    }

    messages.push({
      role: "user",
      content: query,
    });

    // ai agent loop
    while (true) {
      const res = await client.responses.create({
        model: "openai/gpt-oss-20b",
        tools: [searchInternetTool],
        input: messages,
      });

      const tools = res.output.filter(
        (output) => output.type === "function_call",
      );

      if (tools.length === 0 && res.output_text) {
        console.log("Ai: ", res.output_text);
        messages.push({
          role: "assistant",
          content: res.output_text,
        });
        break;
      }

      if (tools.length > 0) {
        for (const tool of tools) {
          messages.push({
            type: "function_call",
            call_id: tool.call_id,
            name: tool.name,
            arguments: tool.arguments,
          });
          console.log("# Calling function", tool.name);
          if (tool.name === "searchInternet") {
            const functionResult = await searchInternet(
              JSON.parse(tool.arguments),
            );
            messages.push({
              type: "function_call_output",
              call_id: tool.call_id,
              output: JSON.stringify(functionResult),
            });
          }
        }
        continue;
      }
    }
  }
  rl.close();
};
main();
