import dotenv from "dotenv";
import { OpenAI } from "openai";
import { stdin, stdout } from "process";
import readline from "readline/promises";

dotenv.config({ path: "./.env" });

const client = new OpenAI({
  baseURL: "https://api.groq.com/openai/v1",
  apiKey: process.env.OPENAI_API_KEY,
});

type Systems = "teacher" | "sarcastic" | "interviewer";

let currentSystem: Systems = "teacher";

const askQuestion = async (ques: string): Promise<string> => {
  const systemPrompts: Record<Systems, string> = {
    teacher: "You are a teacher, who give the satisfactory answers to user.",
    sarcastic:
      "You are a sarcastic friend, who give the sarcastic answers to user.",
    interviewer:
      "You are an interviewer, who give the interview questions to user.",
  };

  try {
    const res = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: systemPrompts[currentSystem],
        },
        {
          role: "user",
          content: ques,
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

    if (ques.startsWith("/system ")) {
      const system = ques.split(" ")[1];
      if (
        !system ||
        !["teacher", "sarcastic", "interviewer"].includes(system)
      ) {
        console.log("Invalid system");
        continue;
      }
      currentSystem = system as Systems;
      console.log(`System changed to ${system}`);
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
