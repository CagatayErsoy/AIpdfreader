import { Pinecone } from "@pinecone-database/pinecone";
import { convertToAscii } from "./utils";
import { getEmbeddings } from "./embedings";

export async function getMatctchesFromEmbedings(
  embeddings: number[],
  fileKey: string
) {
  const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY as string,
  });
  const index = pinecone.index("aipdfreader");

  try {
    const namespace = convertToAscii(fileKey);
    const queryResponse = await index.namespace(namespace).query({
      vector: embeddings,
      topK: 5,
      includeMetadata: true,
      includeValues: false,
    });
    return queryResponse.matches || [];
  } catch (error) {
    console.log("error querying embedings", error);
    throw error;
  }
}
export async function getContext(query: string, fileKey: string) {
  const queryEmbeddings = await getEmbeddings(query);
  const matches = await getMatctchesFromEmbedings(queryEmbeddings, fileKey);
  // console.log("matches:", matches);
  const qualifyingDocs = matches.filter(
    (match) => match.score && match.score > 0.2
  );
  type Metadata = {
    text: string;
    pageNumber: number;
  };
  const docs = qualifyingDocs.map((match) => (match.metadata as Metadata).text);

  return docs.join("\n").substring(0, 3000);
}
