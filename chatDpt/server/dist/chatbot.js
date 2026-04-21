import OpenAI from "openai";
import { searchFunction, searchTool } from "./tools.js";
import { config } from "dotenv";
config({ path: "./.env" });
const client = new OpenAI({
    baseURL: "https://api.groq.com/openai/v1",
    apiKey: process.env.OPENAI_API_KEY,
});
const message = [
    {
        role: "system",
        content: "You are a smart ai assistant. You responds in plain english.",
    },
];
export const generate = async (query) => {
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
