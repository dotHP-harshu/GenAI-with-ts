import express, { type Request, type Response } from "express";
import OpenAI from "openai";
const app = express();

import dotenv from "dotenv";
import z from "zod";
import { zodTextFormat } from "openai/helpers/zod";
dotenv.config({ path: "./.env" });

// middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ai related
const client = new OpenAI({
  baseURL: "https://api.groq.com/openai/v1",
  apiKey: process.env.OPENAI_API_KEY,
});

const outputSchema = z.object({
  summary: z.string().describe("The summary of given text."),
});

type Output = {
  summary: string;
};

const aiCall = async (
  query: string,
  MAX_TRIES = 3,
): Promise<string | Output> => {
  try {
    if (MAX_TRIES <= 0) {
      return "ai is unable to generated sturcture output.";
    }
    const res = await client.responses.parse({
      model: "openai/gpt-oss-20b",
      input: [
        {
          role: "system",
          content:
            "Your are professional summariser, who summarise the given text or data. Respond with structured output",
        },
        {
          role: "user",
          content: query,
        },
      ],
      text: { format: zodTextFormat(outputSchema, "summary") },
    });

    if (!checkValidation(res.output_parsed)) {
      return aiCall(query, MAX_TRIES - 1);
    }
    MAX_TRIES = 3;
    return outputSchema.parse(res.output_parsed);
  } catch (error) {
    if (error instanceof Error) {
      return error.message;
    }
    return "Error on the ai server";
  }
};

// utils
const checkValidation = (data: unknown) => {
  try {
    return outputSchema.parse(data);
  } catch (error) {
    return false;
  }
};

// routes
app.post("/summary", async (req: Request, res: Response) => {
  const { text } = req.body;

  if (!text || typeof text !== "string") {
    return res.status(400).json({ error: "Invalid input" });
  }

  const aiRes = await aiCall(text);
  if (typeof aiRes !== "string") {
    return res.json(aiRes);
  }
  return res.json({ erro: true, message: aiRes });
});

app.listen(3000, () => {
  console.log("Sever is listening at port 3000");
});
