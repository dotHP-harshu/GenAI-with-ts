import OpenAI from "openai";

const client = new OpenAI({
  baseURL: "https://rapid-union-a7f7.prajapatiharsh2323.workers.dev/v1",
  apiKey: "HARSH_IS_BATMAN",
});

const makeEmbeddings = async () => {
  const embeddings = await client.embeddings.create({
    model: "text-embedding-3-large",
    input: ["his name is harsh"],
    encoding_format: "float",
  });
  console.log("Total Dimensions:", embeddings.data[0]);
};

makeEmbeddings();
