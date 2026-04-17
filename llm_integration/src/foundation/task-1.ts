import dotenv from "dotenv";
import { OpenAI } from "openai";
import { stdin, stdout } from "process";
import readline from "readline/promises";

dotenv.config({ path: "./.env" });

const client = new OpenAI({
  baseURL: "https://api.groq.com/openai/v1",
  apiKey: process.env.OPENAI_API_KEY,
});

const askQuestion = async (ques: string): Promise<string> => {
  let prompt = ques;

  if (ques.startsWith("/code ")) {
    prompt = `
    You are a code generation assistant.
    Return only the code, nothing else.
    
    User asked:
    ${ques.replace("/code", "").trim()}
    `;
  }

  if (ques.startsWith("/explain")) {
    prompt = `
    You are a smart and friendly explanation assistant.
    Return only the explanation, nothing else.
    
    User asked:
    ${ques.replace("/explain", "").trim()}
    `;
  }

  try {
    const res = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content:
            "You are a friendly ai assistant, who give the satisfactory answers to user.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });
    return res.choices[0].message.content ?? "";
  } catch (error) {
    if (error instanceof Error) {
      return error.message;
    }
    return "Any Enternal Error.";
  }
};

const rl = readline.createInterface({ input: stdin, output: stdout });

const main = async () => {
  while (true) {
    const ques = await rl.question("User:> ");
    if (ques.trim() === "") {
      continue;
    }
    if (ques.toLowerCase() === "exit") {
      break;
    }
    const res = await askQuestion(ques);
    console.log(`Ai:> ${res}`);
  }
};

main();
