import { config } from "dotenv";
config({ path: "./.env" });
import { tavily } from "@tavily/core";
import { Tool } from "openai/resources/responses/responses.js";

// Tools
export const searchInternetTool: Tool = {
  type: "function",
  name: "searchInternet",
  description:
    "search any query in the internet and return the top four to five results",
  parameters: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "the query which has to be searched.",
      },
    },
    required: ["query"],
  },
  strict: true,
};

// functions
export const searchInternet = async ({ query }: { query: string }) => {
  const tvly = tavily({ apiKey: process.env.TVLY_API_KEY });
  const response = await tvly.search(query);

  return response.results.map((res) => res.content).join("\n");
};
