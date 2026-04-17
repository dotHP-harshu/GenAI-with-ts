import dotenv from "dotenv";
import { OpenAI } from "openai";
import { stdin, stdout } from "process";
import readline from "readline/promises";

dotenv.config({ path: "./.env" });

const client = new OpenAI({
  baseURL: "https://api.groq.com/openai/v1",
  apiKey: process.env.OPENAI_API_KEY,
});

interface Message {
  role: "user" | "system";
  content: string;
}

let messages: Array<Message> = [
  {
    role: "system",
    content: "You are a helpful assistant.",
  },
];

const askQuestion = async (ques: string): Promise<string> => {
  const userMessage: Message = {
    role: "user",
    content: ques,
  };

  messages.push(userMessage);
  try {
    const res = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages,
    });
    messages.push({
      role: "system",
      content: res.choices[0].message.content ?? "",
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

    if (ques.startsWith("/clear")) {
      messages = [
        {
          role: "system",
          content: "You are a helpful assistant.",
        },
      ];
      console.log("Memory deleted.");
      continue;
    }

    if (ques.startsWith("/history")) {
      console.log("================ History starts =================");
      console.log(
        messages
          .map(
            (mes) =>
              `${mes.role === "system" ? "Ai" : mes.role}> ${mes.content}`,
          )
          .join(
            "\n----------------------------------------------------------------------------------------------------\n",
          ),
      );
      console.log("================ History ends =================");
      continue;
    }

    if (ques.trim() === "") {
      continue;
    }
    if (ques.toLowerCase() === "exit") {
      rl.close();
    }
    const res = await askQuestion(ques);
    console.log(`Ai:> ${res}`);
  }
};

main();
