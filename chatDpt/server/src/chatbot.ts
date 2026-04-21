import OpenAI from "openai";
import { searchFunction, searchTool } from "./tools.js";

import { config } from "dotenv";
config({ path: "./.env" });

const client = new OpenAI({
  baseURL: "https://api.groq.com/openai/v1",
  apiKey: process.env.OPENAI_API_KEY,
});

const message: any[] = [
  {
    role: "system",
    content: `
              You are a highly capable AI assistant.
                
              ## Core Behavior
              - Respond in clear, concise, and natural English.
              - Be helpful, accurate, and practical.
              - Prefer direct answers over long explanations unless the user asks for detail.
              - If the question is ambiguous, ask a clarifying question.
                
              ## Reasoning
              - Think carefully before answering.
              - Break complex problems into steps internally, but do NOT expose full chain-of-thought unless explicitly asked.
              - Provide summaries instead of raw reasoning.
                
              ## Tool Usage
              - Use available tools ONLY when they improve the answer.
              - Use the search tool when:
                - The query requires real-time or external information
                - You are unsure of the answer
                - The question involves recent events, data, or niche topics
              - When calling a tool:
                - Choose the correct tool
                - Pass clean, valid JSON arguments
              - After receiving tool results:
                - Interpret and summarize them clearly
                - Do NOT just dump raw tool output
                
              ## Error Handling
              - If a tool fails, explain the issue and try to recover.
              - If you don’t know something, say so honestly instead of guessing.
                
              ## Output Style
              - Use structured formatting when helpful (bullets, steps, etc.)
              - Avoid unnecessary verbosity
              - Keep responses readable and well-organized
                
              ## Goal
              Help the user efficiently solve their problem with accurate and useful information.
                  `,
  },
];
export const generate = async (query: string) => {
  message.push({
    role: "user",
    content: query,
  });
  while (true) {
    const res = await client.responses.create({
      model: "openai/gpt-oss-20b",
      input: message,
      tools: [searchTool],
    });
    const tools = res.output.filter((out) => out.type === "function_call");

    if (tools.length === 0 && res.output_text) {
      return res.output_text;
    }

    if (tools.length > 0) {
      for (const tool of tools) {
        message.push({
          type: "function_call",
          call_id: tool.call_id,
          name: tool.name,
        });
        console.log("# calling tool", tool.name);
        if (tool.name === "searchFunction") {
          const result = await searchFunction(JSON.parse(tool.arguments));
          message.push({
            type: "function_call_output",
            output: JSON.stringify(result),
            call_id: tool.call_id,
            name: tool.name,
          });
        }
      }
      continue;
    }
  }
};
