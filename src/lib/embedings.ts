import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function getEmbeddings(text: string) {
  try {
    const result = await openai.embeddings.create({
      model: "text-embedding-3-large",
      input: text.replace(/\n/g, ""),
      dimensions: 2048,
    });

    return result.data[0].embedding;
  } catch (error) {
    console.log("error calling openai embeddings api");
    throw error;
  }
}
