import { OpenAI } from "openai";
import { config } from "dotenv";
import { HfInference } from "@huggingface/inference";

config({ path: "./.env" });

export const client = new OpenAI({
  baseURL: "https://api.groq.com/openai/v1",
  apiKey: process.env.OPENAI_API_KEY,
});

export const cfClient = new OpenAI({
  baseURL: "https://ai.prajapatiharsh2323.workers.dev/v1",
  apiKey: "HARSH_IS_BATMAN",
});

export const hfClient = new HfInference(process.env.HF_TOKEN);
