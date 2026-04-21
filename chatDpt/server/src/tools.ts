import { tavily } from "@tavily/core";
import { Tool } from "openai/resources/responses/responses.mjs";
export const searchFunction = async ({ query }: { query: string }) => {
  const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY });
  const response = await tvly.search(query);
  return response.results.map((res) => res.content).join("\n");
};

export const searchTool: Tool = {
  type: "function",
  name: "searchFunction",
  description:
    "A function that take query, searches in the internet and returns the top searches in a signle string. ",
  parameters: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "The query which has to search in the internet.",
      },
    },
    required: ["query"],
  },
  strict: true,
};
